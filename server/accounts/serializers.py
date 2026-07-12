from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import EmailMultiAlternatives
from django.utils.encoding import force_str
from django.utils.html import escape
from django.utils.http import urlsafe_base64_decode
from django.urls import reverse
from urllib.parse import urlencode

from drf_backend.fields import EarlyBoundedListField
from .models import User, VerificationToken, Skill
from .security import (
    DELETED_USER_FULL_NAME,
    SESSION_VERSION_CLAIM,
    generate_deleted_user_email,
    has_current_session_version,
    invalidate_user_sessions,
    revoke_user_refresh_tokens,
    scrub_deleted_user_notification_messages,
    scrub_deleted_user_report_snapshots,
)
from .utils import generate_random_avatar_url

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.settings import api_settings
from rest_framework.exceptions import AuthenticationFailed


MAX_USER_SKILLS = 50
MAX_USER_BIO_LENGTH = 2_000
MAX_PASSWORD_INPUT_LENGTH = 256
MAX_AUTH_TOKEN_INPUT_LENGTH = 4_096
MAX_UID_INPUT_LENGTH = 128


class UserSerializer(serializers.ModelSerializer):
    skills = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field="skill",
    )
    class Meta:
        model = User
        fields = [
            "user_id",
            "full_name",
            "nu_email",
            "github_username",
            "is_github_connected",
            "avatar_url",
            "bio",
            "is_email_verified",
            "created_at",
            "updated_at",
            "skills",
        ]
        read_only_fields = [
            "user_id",
            "is_github_connected",
            "is_email_verified",
            "created_at",
            "updated_at",
        ]


class UserDirectoryQuerySerializer(serializers.Serializer):
    ORDER_NAME = "name"
    ORDER_NEWEST = "newest"
    ORDER_OLDEST = "oldest"

    search = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
        max_length=255,
    )
    skill = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
        max_length=100,
    )
    ordering = serializers.ChoiceField(
        choices=(ORDER_NAME, ORDER_NEWEST, ORDER_OLDEST),
        default=ORDER_NAME,
    )
    # Backward-compatible alias for the original email-only search endpoint.
    nu_email = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
        max_length=255,
    )

    def validate(self, attrs):
        if not attrs.get("search") and attrs.get("nu_email"):
            attrs["search"] = attrs["nu_email"]
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=MAX_PASSWORD_INPUT_LENGTH,
        style={"input_type": "password"},
    )
    skills = EarlyBoundedListField(
        child=serializers.CharField(max_length=100),
        allow_empty=True,
        write_only=True,
        required=False,
        max_length=MAX_USER_SKILLS,
    )

    class Meta:
        model = User
        fields = ["full_name", "nu_email", "password", "skills"]
        extra_kwargs = {"nu_email": {"validators": []}}

    def validate_nu_email(self, value):
        value = value.strip().lower()
        _, separator, domain = value.rpartition("@")
        if not separator or domain != "nu.edu.pk":
            raise serializers.ValidationError("Only NU email addresses are allowed.")
        return value

    def validate(self, attrs):
        candidate_user = User(
            nu_email=attrs.get("nu_email", ""),
            full_name=attrs.get("full_name", ""),
        )
        try:
            validate_password(attrs.get("password"), user=candidate_user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        skill_list = validated_data.pop("skills", [])
        password = validated_data.pop("password")
        user = User.objects.create_user(
            password=password,
            avatar_url=generate_random_avatar_url(),
            **validated_data,
        )
        unique_skills = set([s.strip() for s in skill_list if s.strip()])
        Skill.objects.bulk_create(
            [Skill(user=user, skill=skill) for skill in unique_skills],
            ignore_conflicts=True,
        )

        token_obj = VerificationToken.create_for_user(user)
        user._verification_token = token_obj
        return user


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=MAX_AUTH_TOKEN_INPUT_LENGTH)
    nu_email = serializers.EmailField()

    def validate(self, attrs):
        token_str = attrs.get("token")
        nu_email = attrs.get("nu_email").lower()

        try:
            token_obj = (
                VerificationToken.objects
                .select_related("user")
                .get(token=token_str, user__nu_email__iexact=nu_email)
            )
        except VerificationToken.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token.")

        if token_obj.used_at is not None:
            raise serializers.ValidationError("This token has already been used.")

        if token_obj.is_expired():
            raise serializers.ValidationError("This token has expired.")

        attrs["token_obj"] = token_obj
        return attrs

    def save(self, **kwargs):
        token_obj = self.validated_data["token_obj"]
        user = token_obj.user

        # Mark user as verified
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])

        # Mark token as used
        token_obj.mark_used()

        return user



def send_verification_email(user, token_obj, request=None):
    frontend_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
    query = urlencode({"token": token_obj.token, "nu_email": user.nu_email})
    verify_url = f"{frontend_base}/verify-email?{query}"
    display_name = user.full_name or "there"
    html_display_name = escape(display_name)
    html_verify_url = escape(verify_url)

    subject = "Verify your FORKED NUCES account"

    # ── Plain-text fallback ───────────────────────────────────────────────────
    plain_text = (
        f"Hi {display_name},\n\n"
        f"Thank you for signing up on FORKED NUCES — a student-driven collaboration "
        f"platform where FASTians share projects, find teammates, and build better software together.\n\n"
        f"Please verify your NU email address by visiting:\n{verify_url}\n\n"
        f"This link expires in 24 hours. If it expires, you can request a new one from the login page.\n\n"
        f"If you did not create an account on FORKED NUCES, please ignore this email.\n\n"
        f"FASTians Build Better Together.\n"
        f"-- The FORKED NUCES Team\n"
        f"   Abdul Rafay Mughal    k230667@nu.edu.pk\n"
        f"   Abdullah Azhar Khan  k230691@nu.edu.pk\n"
        f"   Muhammad Awais       k230544@nu.edu.pk"
    )

    # ── HTML email ────────────────────────────────────────────────────────────
    html_body = (
        "<!DOCTYPE html>"
        '<html lang="en">'
        "<head>"
        '<meta charset="UTF-8" />'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
        "<title>Verify your FORKED NUCES account</title>"
        '<link rel="preconnect" href="https://fonts.googleapis.com" />'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />'
        '<link href="https://fonts.googleapis.com/css2?family=Jaro&family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />'
        "</head>"
        '<body style="margin:0;padding:0;background-color:#E8EAEC;font-family:Poppins,Arial,sans-serif;">'
        '<table width="100%" cellpadding="0" cellspacing="0" border="0"'
        ' style="background-color:#E8EAEC;padding:40px 16px;">'
        '<tr><td align="center">'
        '<table width="600" cellpadding="0" cellspacing="0" border="0"'
        ' style="max-width:600px;width:100%;background-color:#ffffff;'
        "border-radius:16px;overflow:hidden;"
        'box-shadow:0 8px 40px rgba(111,67,254,0.15);">'
        # HERO HEADER
        "<tr>"
        '<td style="background-color:#6F43FE;padding:48px 40px 40px;text-align:center;">'
        '<h1 style="margin:0;font-family:Jaro,Arial,sans-serif;font-size:62px;'
        'font-weight:700;color:#ffffff;line-height:1;letter-spacing:-1px;">'
        "FORK&#39;D NUCES"
        "</h1>"
        '<p style="margin:10px 0 0;font-size:14px;font-weight:500;'
        'color:rgba(255,255,255,0.80);letter-spacing:0.2px;">'
        "FASTians Build Better Together."
        "</p></td></tr>"
        # VERIFICATION LABEL
        "<tr>"
        '<td style="background-color:#f9f7ff;padding:14px 48px;border-bottom:2px solid #EDE8FF;">'
        '<p style="margin:0;font-size:11px;font-weight:700;color:#6F43FE;'
        'text-transform:uppercase;letter-spacing:2px;text-align:center;">'
        "&#9993; &nbsp; Email Verification"
        "</p></td></tr>"
        # BODY
        "<tr>"
        '<td style="padding:40px 48px 32px;">'
        f'<p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111111;">Hi, {html_display_name}!</p>'
        '<p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#444444;">'
        "Thank you for signing up on "
        '<span style="color:#6F43FE;font-weight:700;">FORKED NUCES</span>'
        " &mdash; a student-driven collaboration platform where FASTians share projects,"
        " find teammates, and help each other build better software."
        "</p>"
        '<p style="margin:0 0 28px;font-size:15px;line-height:1.75;color:#444444;">'
        "To activate your account, please verify your NU email address by clicking the button below."
        "</p>"
        # CTA Button — purple, non-italic, full-width
        '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;">'
        "<tr>"
        '<td align="center" style="background-color:#6F43FE;border-radius:10px;">'
        f'<a href="{html_verify_url}"'
        ' style="display:block;padding:16px 40px;'
        "font-family:Poppins,Arial,sans-serif;"
        "font-size:15px;font-weight:700;color:#ffffff;"
        "text-decoration:none;font-style:normal;"
        'text-transform:uppercase;letter-spacing:1px;text-align:center;">'
        "Verify My Email"
        "</a></td></tr></table>"
        # Expiry note
        '<table cellpadding="0" cellspacing="0" border="0" width="100%"'
        ' style="background-color:#f9f7ff;border-radius:8px;border-left:3px solid #6F43FE;margin-bottom:28px;">'
        '<tr><td style="padding:12px 16px;">'
        '<p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">'
        '<strong style="color:#6F43FE;">Note:</strong>'
        ' This verification link expires in <strong style="color:#111111;">24 hours.</strong>'
        " If it expires, you can request a new one from the login page."
        "</p></td></tr></table>"
        # Divider
        '<hr style="border:none;border-top:1px solid #eeeeee;margin:0 0 20px;" />'
        # Manual link — light purple background
        '<p style="margin:0 0 6px;font-size:12px;color:#888888;">'
        "Button not working? Copy and paste this link into your browser:"
        "</p>"
        f'<p style="margin:0 0 24px;font-size:11px;'
        "background-color:#f9f7ff;border-radius:6px;"
        "padding:12px 14px;word-break:break-all;"
        'border:1px solid #EDE8FF;color:#6F43FE;font-family:Courier New,monospace;">'
        f"{html_verify_url}"
        "</p>"
        # Disclaimer — darker for accessibility
        '<p style="margin:0;font-size:12px;color:#666666;line-height:1.7;">'
        "If you did not create an account on FORKED NUCES, please ignore this email. Your address will not be used."
        "</p>"
        "</td></tr>"
        # FOOTER — simplified, centred, no redundant logo
        "<tr>"
        '<td style="background-color:#000000;padding:32px 48px;">'
        '<p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#ffffff;text-align:center;">'
        "Contact the Team"
        "</p>"
        '<p style="margin:0 0 16px;font-size:12px;color:#888888;text-align:center;">'
        "Have feedback or recommendations?"
        "</p>"
        '<p style="margin:0 0 4px;font-size:12px;color:#aaaaaa;text-align:center;">'
        "Abdul Rafay Mughal &nbsp;&mdash;&nbsp;"
        '<a href="mailto:k230667@nu.edu.pk" style="color:#ffffff;text-decoration:none;font-weight:600;">'
        "k230667@nu.edu.pk</a></p>"
        '<p style="margin:0 0 4px;font-size:12px;color:#aaaaaa;text-align:center;">'
        "Abdullah Azhar Khan &nbsp;&mdash;&nbsp;"
        '<a href="mailto:k230691@nu.edu.pk" style="color:#ffffff;text-decoration:none;font-weight:600;">'
        "k230691@nu.edu.pk</a></p>"
        '<p style="margin:0 0 20px;font-size:12px;color:#aaaaaa;text-align:center;">'
        "Muhammad Awais &nbsp;&mdash;&nbsp;"
        '<a href="mailto:k230544@nu.edu.pk" style="color:#ffffff;text-decoration:none;font-weight:600;">'
        "k230544@nu.edu.pk</a></p>"
        '<p style="margin:0;font-size:11px;color:#444444;text-align:center;">'
        "&copy; 2025 FORKED NUCES. All rights reserved."
        "</p>"
        "</td></tr>"
        "</table></td></tr></table></body></html>"
    )

    msg = EmailMultiAlternatives(
        subject=subject,
        body=plain_text,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        to=[user.nu_email],
    )
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=False)



class ResendVerificationSerializer(serializers.Serializer):
    nu_email = serializers.EmailField()

    def validate_nu_email(self, value):
        value = value.strip().lower()
        _, separator, domain = value.rpartition("@")
        if not separator or domain != "nu.edu.pk":
            raise serializers.ValidationError("Only NU email addresses are allowed.")
        return value

    def validate(self, attrs):
        attrs["user"] = User.objects.filter(
            nu_email=attrs["nu_email"],
            is_active=True,
            is_email_verified=False,
        ).first()
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        if user is None:
            return None
        token_obj = VerificationToken.create_for_user(user)
        user._verification_token = token_obj
        return user


class LoginSerializer(serializers.Serializer):
    nu_email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=MAX_PASSWORD_INPUT_LENGTH,
        style={"input_type": "password"},
    )

    def validate(self, attrs):
        nu_email = attrs.get("nu_email").lower()
        password = attrs.get("password")

        user = authenticate(username=nu_email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_email_verified:
            raise serializers.ValidationError("Email is not verified.")

        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        refresh = RefreshToken.for_user(user)
        refresh[SESSION_VERSION_CLAIM] = user.session_version
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }


class VerifiedTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Keep the standard SimpleJWT contract while enforcing email verification."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field] = serializers.EmailField(write_only=True)
        self.fields["password"] = serializers.CharField(
            write_only=True,
            trim_whitespace=False,
            max_length=MAX_PASSWORD_INPUT_LENGTH,
            style={"input_type": "password"},
        )

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token[SESSION_VERSION_CLAIM] = user.session_version
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_email_verified:
            raise AuthenticationFailed("Email is not verified.")
        return data


class VerifiedTokenRefreshSerializer(TokenRefreshSerializer):
    """Reject refresh tokens whose account is inactive or still unverified."""

    refresh = serializers.CharField(max_length=MAX_AUTH_TOKEN_INPUT_LENGTH)

    def validate(self, attrs):
        refresh = self.token_class(attrs["refresh"])
        user_id = refresh.payload.get(api_settings.USER_ID_CLAIM)
        if user_id is None:
            raise AuthenticationFailed(
                "No active account found for the given token.",
                code="no_active_account",
            )

        try:
            user = User.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except (User.DoesNotExist, TypeError, ValueError) as exc:
            raise AuthenticationFailed(
                "No active account found for the given token.",
                code="no_active_account",
            ) from exc

        if not user.is_active:
            raise AuthenticationFailed(
                "No active account found for the given token.",
                code="no_active_account",
            )
        if not user.is_email_verified:
            raise AuthenticationFailed(
                "Email is not verified.",
                code="email_not_verified",
            )
        if not has_current_session_version(refresh, user):
            raise AuthenticationFailed(
                "This session has been revoked. Please sign in again.",
                code="session_revoked",
            )

        return super().validate(attrs)


def _validate_new_password(password, user):
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        raise serializers.ValidationError(
            {"new_password": list(exc.messages)}
        ) from exc


class PasswordResetRequestSerializer(serializers.Serializer):
    nu_email = serializers.EmailField()

    def validate_nu_email(self, value):
        value = value.strip().lower()
        _, separator, domain = value.rpartition("@")
        if not separator or domain != "nu.edu.pk":
            raise serializers.ValidationError("Only NU email addresses are allowed.")
        return value

    def get_user(self):
        return (
            User.objects.filter(
                nu_email__iexact=self.validated_data["nu_email"],
                is_active=True,
                is_email_verified=True,
            )
            .only(
                "user_id",
                "nu_email",
                "full_name",
                "password",
                "last_login",
            )
            .first()
        )


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(max_length=MAX_UID_INPUT_LENGTH)
    token = serializers.CharField(max_length=MAX_AUTH_TOKEN_INPUT_LENGTH)
    new_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=MAX_PASSWORD_INPUT_LENGTH,
        style={"input_type": "password"},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=MAX_PASSWORD_INPUT_LENGTH,
        style={"input_type": "password"},
    )

    default_error_messages = {
        "invalid_link": "Invalid or expired password reset link.",
        "password_mismatch": "Passwords do not match.",
    }

    def _get_user(self, uid):
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            return User.objects.filter(user_id=user_id, is_active=True).first()
        except (TypeError, ValueError, OverflowError, UnicodeDecodeError):
            return None

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": [self.error_messages["password_mismatch"]]}
            )

        user = self._get_user(attrs["uid"])
        if user is None or not default_token_generator.check_token(
            user, attrs["token"]
        ):
            raise serializers.ValidationError(
                {"token": [self.error_messages["invalid_link"]]}
            )

        _validate_new_password(attrs["new_password"], user)
        attrs["user_id"] = user.user_id
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user = (
            User.objects.select_for_update()
            .filter(user_id=validated_data["user_id"], is_active=True)
            .first()
        )
        if user is None or not default_token_generator.check_token(
            user, validated_data["token"]
        ):
            raise serializers.ValidationError(
                {"token": [self.error_messages["invalid_link"]]}
            )

        _validate_new_password(validated_data["new_password"], user)
        user.set_password(validated_data["new_password"])
        user.password_changed_at = timezone.now()
        user.save(update_fields=["password", "password_changed_at", "updated_at"])
        return invalidate_user_sessions(user)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=MAX_PASSWORD_INPUT_LENGTH,
        style={"input_type": "password"},
    )
    new_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=MAX_PASSWORD_INPUT_LENGTH,
        style={"input_type": "password"},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=MAX_PASSWORD_INPUT_LENGTH,
        style={"input_type": "password"},
    )

    default_error_messages = {
        "incorrect_password": "Current password is incorrect.",
        "password_mismatch": "Passwords do not match.",
    }

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError(
                {"current_password": [self.error_messages["incorrect_password"]]}
            )
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": [self.error_messages["password_mismatch"]]}
            )

        _validate_new_password(attrs["new_password"], user)
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request_user = self.context["request"].user
        user = User.objects.select_for_update().get(pk=request_user.pk)
        if not user.check_password(validated_data["current_password"]):
            raise serializers.ValidationError(
                {"current_password": [self.error_messages["incorrect_password"]]}
            )

        _validate_new_password(validated_data["new_password"], user)
        user.set_password(validated_data["new_password"])
        user.password_changed_at = timezone.now()
        user.save(update_fields=["password", "password_changed_at", "updated_at"])
        return invalidate_user_sessions(user)


class AccountDeletionSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=MAX_PASSWORD_INPUT_LENGTH,
        style={"input_type": "password"},
    )
    confirmation = serializers.CharField(trim_whitespace=False, max_length=16)

    default_error_messages = {
        "incorrect_password": "Current password is incorrect.",
        "invalid_confirmation": 'Type "DELETE" exactly to confirm account deletion.',
    }

    def validate(self, attrs):
        user = self.context["request"].user
        if attrs["confirmation"] != "DELETE":
            raise serializers.ValidationError(
                {"confirmation": [self.error_messages["invalid_confirmation"]]}
            )
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError(
                {"current_password": [self.error_messages["incorrect_password"]]}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request_user = self.context["request"].user
        user = User.objects.select_for_update().get(pk=request_user.pk)
        if not user.check_password(validated_data["current_password"]):
            raise serializers.ValidationError(
                {"current_password": [self.error_messages["incorrect_password"]]}
            )

        original_full_name = user.full_name
        deleted_email = generate_deleted_user_email()
        while User.objects.exclude(pk=user.pk).filter(nu_email=deleted_email).exists():
            deleted_email = generate_deleted_user_email()

        user.nu_email = deleted_email
        user.full_name = DELETED_USER_FULL_NAME
        user.github_username = None
        user.is_github_connected = False
        user.avatar_url = None
        user.bio = None
        user.is_active = False
        user.is_email_verified = False
        user.is_staff = False
        user.is_superuser = False
        user.last_login = None
        user.set_unusable_password()
        user.password_changed_at = timezone.now()
        user.session_version += 1
        user.save(
            update_fields=[
                "nu_email",
                "full_name",
                "github_username",
                "is_github_connected",
                "avatar_url",
                "bio",
                "is_active",
                "is_email_verified",
                "is_staff",
                "is_superuser",
                "last_login",
                "password",
                "password_changed_at",
                "session_version",
                "updated_at",
            ]
        )
        Skill.objects.filter(user=user).delete()
        VerificationToken.objects.filter(user=user).delete()
        user.groups.clear()
        user.user_permissions.clear()
        scrub_deleted_user_notification_messages(user, original_full_name)
        scrub_deleted_user_report_snapshots(user)
        revoke_user_refresh_tokens(user)
        return user


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(max_length=MAX_AUTH_TOKEN_INPUT_LENGTH)

    def validate(self, attrs):
        self.token = attrs.get("refresh")
        return attrs

    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except TokenError:
            raise serializers.ValidationError("Token is invalid or has already been blacklisted.")


class UserUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False, allow_blank=False, max_length=255)
    bio = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=MAX_USER_BIO_LENGTH,
    )
    skills = EarlyBoundedListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True,
        max_length=MAX_USER_SKILLS,
    )

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("No data provided to update.")
        return attrs

    @transaction.atomic
    def update(self, instance: User, validated_data):
        full_name = validated_data.get("full_name")
        bio = validated_data.get("bio")
        skills_list = validated_data.get("skills", None)

        if full_name is not None:
            instance.full_name = full_name

        if bio is not None:
            instance.bio = bio

        instance.save(update_fields=["full_name", "bio", "updated_at"])

        if skills_list is not None:
            cleaned = [s.strip() for s in skills_list if s and s.strip()]
            unique_skills = sorted(set(cleaned))

            Skill.objects.filter(user=instance).delete()
            Skill.objects.bulk_create(
                [Skill(user=instance, skill=skill) for skill in unique_skills]
            )

        return instance

    def create(self, validated_data):  # not used
        raise NotImplementedError
