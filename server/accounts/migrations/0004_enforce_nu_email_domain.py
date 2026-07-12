from django.db import migrations, models
from django.db.models.functions import Lower, Trim


def validate_existing_email_domains(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    valid_email = (
        models.Q(nu_email=Lower(Trim("nu_email")))
        & models.Q(nu_email__regex=r"^[^@\s]+@nu\.edu\.pk$")
    )
    invalid_users = list(
        User.objects.exclude(valid_email)
        .order_by("user_id")
        .values_list("user_id", "nu_email")[:20]
    )
    if invalid_users:
        details = ", ".join(
            f"user_id={user_id} email={email!r}"
            for user_id, email in invalid_users
        )
        raise RuntimeError(
            "Cannot enforce the NU email domain constraint. "
            f"Correct these accounts first: {details}"
        )


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_normalize_unique_nu_email"),
    ]

    operations = [
        migrations.RunPython(
            validate_existing_email_domains,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(nu_email=Lower(Trim("nu_email")))
                    & models.Q(
                        nu_email__regex=r"^[^@\s]+@nu\.edu\.pk$"
                    )
                ),
                name="accounts_user_nu_email_normalized_domain",
            ),
        ),
    ]
