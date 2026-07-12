from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_COLLABORATION_REQUEST = "collaboration_request"
    TYPE_COLLABORATION_DECISION = "collaboration_decision"
    TYPE_COMMENT = "comment"
    TYPE_LIKE = "like"
    TYPE_ISSUE_CLOSED = "issue_closed"
    TYPE_MODERATION = "moderation"
    TYPE_CHOICES = [
        (TYPE_COLLABORATION_REQUEST, "Collaboration request"),
        (TYPE_COLLABORATION_DECISION, "Collaboration decision"),
        (TYPE_COMMENT, "Comment"),
        (TYPE_LIKE, "Like"),
        (TYPE_ISSUE_CLOSED, "Issue closed"),
        (TYPE_MODERATION, "Moderation"),
    ]

    notification_id = models.BigAutoField(primary_key=True)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        db_index=False,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_notifications",
    )
    event_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    message = models.CharField(max_length=500)
    url_path = models.CharField(max_length=500, blank=True)
    dedupe_key = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
    )
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-notification_id"]
        indexes = [
            models.Index(
                fields=["recipient", "-created_at", "-notification_id"],
                name="notify_recipient_created_idx",
            ),
            models.Index(
                fields=["recipient", "-created_at", "-notification_id"],
                condition=models.Q(read_at__isnull=True),
                name="notify_unread_recipient_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    event_type__in=[
                        "collaboration_request",
                        "collaboration_decision",
                        "comment",
                        "like",
                        "issue_closed",
                        "moderation",
                    ]
                ),
                name="notification_event_type_valid",
            ),
        ]

    def __str__(self):
        return f"Notification {self.notification_id} for user {self.recipient_id}"
