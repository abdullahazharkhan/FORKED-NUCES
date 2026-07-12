from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Report",
            fields=[
                ("report_id", models.BigAutoField(primary_key=True, serialize=False)),
                (
                    "target_type",
                    models.CharField(
                        choices=[
                            ("user", "User"),
                            ("project", "Project"),
                            ("issue", "Issue"),
                            ("comment", "Comment"),
                        ],
                        max_length=16,
                    ),
                ),
                ("target_id", models.PositiveBigIntegerField()),
                ("target_snapshot", models.JSONField(default=dict)),
                (
                    "reason",
                    models.CharField(
                        choices=[
                            ("spam", "Spam"),
                            ("harassment", "Harassment"),
                            ("inappropriate", "Inappropriate content"),
                            ("impersonation", "Impersonation"),
                            ("privacy", "Privacy concern"),
                            ("other", "Other"),
                        ],
                        max_length=24,
                    ),
                ),
                ("details", models.TextField(blank=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("open", "Open"),
                            ("reviewing", "Reviewing"),
                            ("actioned", "Actioned"),
                            ("dismissed", "Dismissed"),
                        ],
                        default="open",
                        max_length=12,
                    ),
                ),
                ("resolution_notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("resolved_at", models.DateTimeField(blank=True, null=True)),
                (
                    "assigned_to",
                    models.ForeignKey(
                        blank=True,
                        limit_choices_to={"is_staff": True},
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="assigned_reports",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "reporter",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="submitted_reports",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at", "-report_id"],
                "indexes": [
                    models.Index(
                        fields=["status", "created_at"],
                        name="report_status_created_idx",
                    ),
                    models.Index(
                        fields=["target_type", "target_id"],
                        name="report_target_idx",
                    ),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        condition=models.Q(status__in=["open", "reviewing"]),
                        fields=("reporter", "target_type", "target_id"),
                        name="moderation_one_active_report_per_target",
                    ),
                ],
            },
        ),
    ]
