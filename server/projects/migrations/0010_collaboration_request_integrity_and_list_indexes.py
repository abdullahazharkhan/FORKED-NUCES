from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0009_collaborationrequest"),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name="collaborationrequest",
            name="collab_req_issue_status_idx",
        ),
        migrations.RemoveIndex(
            model_name="collaborationrequest",
            name="collab_req_user_status_idx",
        ),
        migrations.AddIndex(
            model_name="collaborationrequest",
            index=models.Index(
                fields=["issue", "status", "-created_at", "-request_id"],
                name="collab_req_issue_status_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="collaborationrequest",
            index=models.Index(
                fields=["issue", "-created_at", "-request_id"],
                name="collab_req_issue_created_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="collaborationrequest",
            constraint=models.CheckConstraint(
                condition=models.Q(kind__in=["application", "invitation"]),
                name="collaboration_request_kind_valid",
            ),
        ),
        migrations.AddConstraint(
            model_name="collaborationrequest",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    status__in=[
                        "pending",
                        "accepted",
                        "rejected",
                        "withdrawn",
                        "cancelled",
                    ]
                ),
                name="collaboration_request_status_valid",
            ),
        ),
    ]
