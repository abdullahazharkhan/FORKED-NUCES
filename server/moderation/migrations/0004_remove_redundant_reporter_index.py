from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("moderation", "0003_report_resolution_integrity"),
    ]

    operations = [
        migrations.AlterField(
            model_name="report",
            name="reporter",
            field=models.ForeignKey(
                db_index=False,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="submitted_reports",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
