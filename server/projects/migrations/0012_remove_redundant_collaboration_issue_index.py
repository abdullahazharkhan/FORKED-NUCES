from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0011_collaboration_request_resolution_integrity"),
    ]

    operations = [
        migrations.AlterField(
            model_name="collaborationrequest",
            name="issue",
            field=models.ForeignKey(
                db_index=False,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="collaboration_requests",
                to="projects.issue",
            ),
        ),
    ]
