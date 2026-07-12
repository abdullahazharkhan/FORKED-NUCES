from django.db import migrations, models
from django.db.models import F


def normalize_resolution_metadata(apps, schema_editor):
    collaboration_request = apps.get_model("projects", "CollaborationRequest")
    collaboration_request.objects.filter(status="pending").update(
        resolved_by=None,
        responded_at=None,
    )
    collaboration_request.objects.exclude(status="pending").filter(
        responded_at__isnull=True
    ).update(responded_at=F("updated_at"))


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0010_collaboration_request_integrity_and_list_indexes"),
    ]

    operations = [
        migrations.RunPython(
            normalize_resolution_metadata,
            migrations.RunPython.noop,
        ),
        migrations.AddConstraint(
            model_name="collaborationrequest",
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(
                        status="pending",
                        resolved_by__isnull=True,
                        responded_at__isnull=True,
                    )
                    | (
                        ~models.Q(status="pending")
                        & models.Q(responded_at__isnull=False)
                    )
                ),
                name="collaboration_request_resolution_valid",
            ),
        ),
    ]
