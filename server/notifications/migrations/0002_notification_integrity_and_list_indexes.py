from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name="notification",
            name="notify_recipient_read_idx",
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(
                fields=["recipient", "-created_at", "-notification_id"],
                name="notify_recipient_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(
                condition=models.Q(read_at__isnull=True),
                fields=["recipient", "-created_at", "-notification_id"],
                name="notify_unread_recipient_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="notification",
            constraint=models.CheckConstraint(
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
        ),
    ]
