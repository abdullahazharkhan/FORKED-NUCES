from django.db import migrations, models
from django.db.models import Count
from django.db.models.functions import Lower, Trim


def normalize_existing_emails(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    duplicates = list(
        User.objects.annotate(normalized_email=Lower(Trim("nu_email")))
        .values("normalized_email")
        .annotate(total=Count("user_id"))
        .filter(total__gt=1)
        .order_by("normalized_email")
    )
    if duplicates:
        details = ", ".join(
            f"{item['normalized_email']} ({item['total']} rows)"
            for item in duplicates
        )
        raise RuntimeError(
            "Cannot enforce case-insensitive NU email uniqueness. "
            f"Resolve these duplicate accounts first: {details}"
        )

    for user in User.objects.only("user_id", "nu_email").iterator(chunk_size=500):
        normalized_email = user.nu_email.strip().lower()
        if normalized_email != user.nu_email:
            User.objects.filter(user_id=user.user_id).update(
                nu_email=normalized_email
            )


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_skill"),
    ]

    operations = [
        migrations.RunPython(
            normalize_existing_emails,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.UniqueConstraint(
                Lower(Trim("nu_email")),
                name="accounts_user_nu_email_ci_unique",
            ),
        ),
    ]
