import uuid
from datetime import timedelta
from django.conf import settings
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
import secrets

def validate_nu_email(value):
    if not value.lower().endswith("nu.edu.pk"):
        raise ValidationError("Email must belong to the NU domain (nu.edu.pk)")

class UserManager(BaseUserManager):
    
    def create_user(self, nu_email, full_name=None, password=None, **extra_fields):
        if not nu_email:
            raise ValueError("Users must have an NU email address")
    
        nu_email = self.normalize_email(nu_email)
        
        # validate domain
        allowed_domain = "nu.edu.pk"
        if not nu_email.lower().endswith(f"@{allowed_domain}"):
            raise ValueError("Email must belong to the NU domain (@nu.edu.pk)")

        
        extra_fields.setdefault('is_active', True)
        
        user = self.model(
            nu_email=nu_email,
            full_name=full_name or "",
            **extra_fields
        )
        if password:
            user.set_password(password)
            user.password_changed_at = timezone.now()
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user
    
    def create_superuser(self, nu_email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(nu_email, password=password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=255)
    
    nu_email = models.EmailField(
        unique=True,
        validators=[validate_nu_email],
    )
    
    github_username = models.CharField(
        max_length=255, unique=True, null=True, blank=True
    )
    is_github_connected = models.BooleanField(default=False)

    avatar_url = models.URLField(null=True, blank=True)
    bio = models.TextField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_email_verified = models.BooleanField(default=False)

    is_staff = models.BooleanField(default=False)

    password_changed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()

    USERNAME_FIELD = "nu_email"
    REQUIRED_FIELDS = ["full_name"]

    def __str__(self):
        return self.nu_email

    @property
    def id(self):
        # for simplejwt compatibility
        return self.user_id


class Skill(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="skills",
    )
    skill = models.CharField(max_length=100)

    class Meta:
        unique_together = ("user", "skill")
        indexes = [
            models.Index(fields=["user", "skill"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} - {self.skill}"
    
class VerificationToken(models.Model):
    token_id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="verification_tokens",
    )
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def mark_used(self):
        self.used_at = timezone.now()
        self.save(update_fields=["used_at"])

    @staticmethod
    def create_for_user(user, hours_valid=24):
        token_value = secrets.token_urlsafe(32)
        return VerificationToken.objects.create(
            user=user,
            token=token_value,
            expires_at=timezone.now() + timedelta(hours=hours_valid),
        )