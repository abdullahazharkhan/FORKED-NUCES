from django.conf import settings
from django.db import models


class Report(models.Model):
    TARGET_USER = "user"
    TARGET_PROJECT = "project"
    TARGET_ISSUE = "issue"
    TARGET_COMMENT = "comment"
    TARGET_CHOICES = [
        (TARGET_USER, "User"),
        (TARGET_PROJECT, "Project"),
        (TARGET_ISSUE, "Issue"),
        (TARGET_COMMENT, "Comment"),
    ]

    REASON_SPAM = "spam"
    REASON_HARASSMENT = "harassment"
    REASON_INAPPROPRIATE = "inappropriate"
    REASON_IMPERSONATION = "impersonation"
    REASON_PRIVACY = "privacy"
    REASON_OTHER = "other"
    REASON_CHOICES = [
        (REASON_SPAM, "Spam"),
        (REASON_HARASSMENT, "Harassment"),
        (REASON_INAPPROPRIATE, "Inappropriate content"),
        (REASON_IMPERSONATION, "Impersonation"),
        (REASON_PRIVACY, "Privacy concern"),
        (REASON_OTHER, "Other"),
    ]

    STATUS_OPEN = "open"
    STATUS_REVIEWING = "reviewing"
    STATUS_ACTIONED = "actioned"
    STATUS_DISMISSED = "dismissed"
    STATUS_CHOICES = [
        (STATUS_OPEN, "Open"),
        (STATUS_REVIEWING, "Reviewing"),
        (STATUS_ACTIONED, "Actioned"),
        (STATUS_DISMISSED, "Dismissed"),
    ]

    report_id = models.BigAutoField(primary_key=True)
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        db_index=False,
        on_delete=models.SET_NULL,
        null=True,
        related_name="submitted_reports",
    )
    target_type = models.CharField(max_length=16, choices=TARGET_CHOICES)
    target_id = models.PositiveBigIntegerField()
    target_snapshot = models.JSONField(default=dict)
    reason = models.CharField(max_length=24, choices=REASON_CHOICES)
    details = models.TextField(blank=True)
    status = models.CharField(
        max_length=12,
        choices=STATUS_CHOICES,
        default=STATUS_OPEN,
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_reports",
        limit_choices_to={"is_staff": True},
    )
    resolution_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-report_id"]
        indexes = [
            models.Index(
                fields=["status", "-created_at", "-report_id"],
                name="report_status_created_idx",
            ),
            models.Index(
                fields=["reporter", "-created_at", "-report_id"],
                name="report_reporter_created_idx",
            ),
            models.Index(
                fields=["-created_at", "-report_id"],
                name="report_created_idx",
            ),
            models.Index(
                fields=["target_type", "target_id"],
                name="report_target_idx",
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["reporter", "target_type", "target_id"],
                condition=models.Q(status__in=["open", "reviewing"]),
                name="moderation_one_active_report_per_target",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    target_type__in=["user", "project", "issue", "comment"]
                ),
                name="moderation_report_target_type_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    reason__in=[
                        "spam",
                        "harassment",
                        "inappropriate",
                        "impersonation",
                        "privacy",
                        "other",
                    ]
                ),
                name="moderation_report_reason_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    status__in=["open", "reviewing", "actioned", "dismissed"]
                ),
                name="moderation_report_status_valid",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(
                        status__in=["open", "reviewing"],
                        resolved_at__isnull=True,
                    )
                    | models.Q(
                        status__in=["actioned", "dismissed"],
                        resolved_at__isnull=False,
                    )
                ),
                name="moderation_report_resolution_valid",
            ),
        ]

    def __str__(self):
        return f"Report {self.report_id}: {self.target_type} {self.target_id}"
