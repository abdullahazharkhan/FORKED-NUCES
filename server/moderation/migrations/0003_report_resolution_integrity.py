from django.db import migrations, models
from django.db.models import F


def normalize_resolution_metadata(apps, schema_editor):
    report = apps.get_model("moderation", "Report")
    report.objects.filter(status__in=["open", "reviewing"]).update(
        resolved_at=None
    )
    report.objects.filter(
        status__in=["actioned", "dismissed"],
        resolved_at__isnull=True,
    ).update(resolved_at=F("updated_at"))


class Migration(migrations.Migration):
    dependencies = [
        ("moderation", "0002_report_integrity_and_list_indexes"),
    ]

    operations = [
        migrations.RunPython(
            normalize_resolution_metadata,
            migrations.RunPython.noop,
        ),
        migrations.AddConstraint(
            model_name="report",
            constraint=models.CheckConstraint(
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
        ),
    ]
