from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import authenticate
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.urls import reverse

from .models import User, VerificationToken, Skill
from .utils import generate_random_avatar_url

from rest_framework_simplejwt.tokens import RefreshToken


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


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, min_length=8, style={"input_type": "password"}
    )
    skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        allow_empty=True,
        write_only=True,
        required=False,
    )

    class Meta:
        model = User
        fields = ["full_name", "nu_email", "password", "skills"]

    def validate_nu_email(self, value):
        value = value.lower()
        if not value.endswith("@nu.edu.pk"):
            raise serializers.ValidationError("Only NU email addresses are allowed.")
        if User.objects.filter(nu_email=value).exists():
            raise serializers.ValidationError("This NU email is already registered.")
        return value

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

        request = self.context.get("request")
        send_verification_email(user, token_obj, request=request)

        user._verification_token = token_obj
        return user


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()
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
    verify_url = f"{frontend_base}/verify-email?token={token_obj.token}&nu_email={user.nu_email}"
    display_name = user.full_name or "there"

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
        f'<p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111111;">Hi, {display_name}!</p>'
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
        f'<a href="{verify_url}"'
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
        f"{verify_url}"
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

    def validate(self, attrs):
        nu_email = attrs.get("nu_email").lower()
        try:
            user = User.objects.get(nu_email__iexact=nu_email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user with this NU email found.")

        if user.is_email_verified:
            raise serializers.ValidationError("This email is already verified.")

        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]

        # Optionally invalidate previous tokens for this user
        VerificationToken.objects.filter(user=user, used_at__isnull=True).delete()

        token_obj = VerificationToken.create_for_user(user)
        request = self.context.get("request")
        send_verification_email(user, token_obj, request=request)
        return user


class LoginSerializer(serializers.Serializer):
    nu_email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

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
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs.get("refresh")
        return attrs

    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except Exception:
            raise serializers.ValidationError("Token is invalid or has already been blacklisted.")


class UserUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False, allow_blank=False, max_length=255)
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True,
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