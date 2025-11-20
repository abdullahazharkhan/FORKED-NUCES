from django.contrib import admin

# Register your models here.
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, VerificationToken

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ("nu_email", "full_name", "is_email_verified", "is_github_connected", "github_username", "is_staff", "is_active")
    list_filter = ("is_email_verified", "is_github_connected", "is_staff", "is_active")
    search_fields = ("nu_email", "full_name")
    ordering = ("nu_email",)

    fieldsets = (
        (None, {"fields": ("nu_email", "password")}),
        ("Personal info", {"fields": ("full_name", "github_username", "avatar_url", "bio")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_email_verified",
                    "is_github_connected",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "password_changed_at", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("nu_email", "full_name", "password1", "password2"),
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at", "last_login", "password_changed_at")
    
@admin.register(VerificationToken)
class VerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("token_id", "user", "token", "expires_at", "used_at", "created_at")
    search_fields = ("token", "user__nu_email")
    list_filter = ("expires_at", "used_at", "created_at")