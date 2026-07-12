from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0008_remove_legacy_db_views"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CollaborationRequest",
            fields=[
                ("request_id", models.AutoField(primary_key=True, serialize=False)),
                (
                    "kind",
                    models.CharField(
                        choices=[
                            ("application", "Application"),
                            ("invitation", "Invitation"),
                        ],
                        max_length=11,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("accepted", "Accepted"),
                            ("rejected", "Rejected"),
                            ("withdrawn", "Withdrawn"),
                            ("cancelled", "Cancelled"),
                        ],
                        default="pending",
                        max_length=9,
                    ),
                ),
                ("message", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("responded_at", models.DateTimeField(blank=True, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="created_collaboration_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "issue",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="collaboration_requests",
                        to="projects.issue",
                    ),
                ),
                (
                    "resolved_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="resolved_collaboration_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="collaboration_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at", "-request_id"],
                "indexes": [
                    models.Index(
                        fields=["issue", "status"],
                        name="collab_req_issue_status_idx",
                    ),
                    models.Index(
                        fields=["user", "status"],
                        name="collab_req_user_status_idx",
                    ),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("issue", "user"),
                        name="projects_collaboration_request_issue_user_unique",
                    ),
                ],
            },
        ),
    ]
