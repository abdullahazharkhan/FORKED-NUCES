from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "notification_id",
        "recipient",
        "event_type",
        "actor",
        "read_at",
        "created_at",
    )
    list_filter = ("event_type", "read_at", "created_at")
    search_fields = (
        "recipient__nu_email",
        "actor__nu_email",
        "message",
    )
    readonly_fields = ("created_at",)
