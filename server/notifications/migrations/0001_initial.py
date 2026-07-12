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
            name="Notification",
            fields=[
                (
                    "notification_id",
                    models.BigAutoField(primary_key=True, serialize=False),
                ),
                (
                    "event_type",
                    models.CharField(
                        choices=[
                            ("collaboration_request", "Collaboration request"),
                            ("collaboration_decision", "Collaboration decision"),
                            ("comment", "Comment"),
                            ("like", "Like"),
                            ("issue_closed", "Issue closed"),
                            ("moderation", "Moderation"),
                        ],
                        max_length=32,
                    ),
                ),
                ("message", models.CharField(max_length=500)),
                ("url_path", models.CharField(blank=True, max_length=500)),
                (
                    "dedupe_key",
                    models.CharField(
                        blank=True,
                        max_length=255,
                        null=True,
                        unique=True,
                    ),
                ),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="triggered_notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "recipient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at", "-notification_id"],
                "indexes": [
                    models.Index(
                        fields=["recipient", "read_at", "created_at"],
                        name="notify_recipient_read_idx",
                    ),
                ],
            },
        ),
    ]
