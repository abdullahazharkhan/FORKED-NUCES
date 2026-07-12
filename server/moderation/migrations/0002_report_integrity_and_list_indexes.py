from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("moderation", "0001_initial"),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name="report",
            name="report_status_created_idx",
        ),
        migrations.AddIndex(
            model_name="report",
            index=models.Index(
                fields=["status", "-created_at", "-report_id"],
                name="report_status_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="report",
            index=models.Index(
                fields=["reporter", "-created_at", "-report_id"],
                name="report_reporter_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="report",
            index=models.Index(
                fields=["-created_at", "-report_id"],
                name="report_created_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="report",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    target_type__in=["user", "project", "issue", "comment"]
                ),
                name="moderation_report_target_type_valid",
            ),
        ),
        migrations.AddConstraint(
            model_name="report",
            constraint=models.CheckConstraint(
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
        ),
        migrations.AddConstraint(
            model_name="report",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    status__in=["open", "reviewing", "actioned", "dismissed"]
                ),
                name="moderation_report_status_valid",
            ),
        ),
    ]
