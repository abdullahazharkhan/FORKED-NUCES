from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import authenticate
from django.conf import settings
from django.core.mail import send_mail
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
    frontend_base = getattr(settings, "FRONTEND_BASE_URL", "").rstrip("/")
    
    # frontend path to verify email
    verify_path = "/verify-email"
    
    verify_url = f"{frontend_base}{verify_path}?token={token_obj.token}&nu_email={user.nu_email}"
    
    subject = "Verify your NU email"
    message = (
        f"Hi {user.full_name or 'there'},\n\n"
        f"Please verify your email by clicking the link below:\n"
        f"{verify_url}\n\n"
        "If you did not sign up, you can ignore this email."
    )
    
    send_mail(
        subject,
        message,
        getattr(settings, "DEFAULT_FROM_EMAIL", None),
        [user.nu_email],
        fail_silently=False,
    )
    
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