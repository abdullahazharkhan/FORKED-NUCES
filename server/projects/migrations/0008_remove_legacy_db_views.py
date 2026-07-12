from importlib import import_module

from django.db import migrations


# Keep the already-shared 0007 migration immutable. Import its reversible SQL so
# an upgrade safely removes the legacy objects and a rollback can restore them.
legacy_migration = import_module("projects.migrations.0007_db_views")


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0007_db_views"),
    ]

    operations = [
        migrations.RunSQL(
            sql=legacy_migration.REVERSE_SQL,
            reverse_sql=legacy_migration.FORWARD_SQL,
        ),
    ]
