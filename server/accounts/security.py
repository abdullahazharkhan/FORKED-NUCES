from html import escape
from urllib.parse import urlencode
from uuid import uuid4

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)


PASSWORD_RESET_REQUEST_MESSAGE = (
    "A password reset link has been sent to your NU email address."
)
SESSION_VERSION_CLAIM = "session_version"
DELETED_USER_FULL_NAME = "Deleted User"


def has_current_session_version(token, user):
    token_session_version = token.get(SESSION_VERSION_CLAIM)
    return (
        not isinstance(token_session_version, bool)
        and isinstance(token_session_version, int)
        and token_session_version == user.session_version
    )


def build_password_reset_credentials(user):
    """Return Django's URL-safe user id and single-use reset token."""
    return (
        urlsafe_base64_encode(force_bytes(user.pk)),
        default_token_generator.make_token(user),
    )


def generate_deleted_user_email():
    """Generate an occupied tombstone address that contains no original PII."""
    return f"deleted-{uuid4().hex}@nu.edu.pk"


def scrub_deleted_user_report_snapshots(user):
    """Remove denormalized account PII from reports targeting this user."""
    from moderation.models import Report

    reports = list(
        Report.objects.filter(
            target_type=Report.TARGET_USER,
            target_id=user.pk,
        ).only("report_id", "target_snapshot")
    )
    for report in reports:
        snapshot = dict(report.target_snapshot or {})
        snapshot.pop("nu_email", None)
        snapshot.pop("email", None)
        snapshot["label"] = DELETED_USER_FULL_NAME
        snapshot["full_name"] = DELETED_USER_FULL_NAME
        report.target_snapshot = snapshot
    if reports:
        Report.objects.bulk_update(reports, ["target_snapshot"])


def scrub_deleted_user_notification_messages(user, original_full_name):
    """Replace denormalized actor names in retained notification text."""
    if not original_full_name:
        return

    from notifications.models import Notification

    notifications = list(
        Notification.objects.filter(actor=user).only("notification_id", "message")
    )
    changed = []
    for notification in notifications:
        scrubbed_message = notification.message.replace(
            original_full_name,
            DELETED_USER_FULL_NAME,
        )
        if scrubbed_message != notification.message:
            notification.message = scrubbed_message
            changed.append(notification)
    if changed:
        Notification.objects.bulk_update(changed, ["message"])


def send_password_reset_email(user):
    uid, token = build_password_reset_credentials(user)
    query = urlencode({"uid": uid, "token": token})
    frontend_base = settings.FRONTEND_BASE_URL.rstrip("/")
    reset_url = f"{frontend_base}/reset-password?{query}"
    display_name = user.full_name.strip() or "there"

    subject = "Reset your FORKED NUCES password"
    plain_text = (
        f"Hi {display_name},\n\n"
        "We received a request to reset your FORKED NUCES password.\n"
        f"Open this link to choose a new password:\n{reset_url}\n\n"
        "The link is single-use and expires automatically. If you did not "
        "request this, you can ignore this email.\n"
    )
    html_body = (
        "<!doctype html><html><body>"
        f"<p>Hi {escape(display_name)},</p>"
        "<p>We received a request to reset your FORKED NUCES password.</p>"
        f'<p><a href="{escape(reset_url, quote=True)}">Reset my password</a></p>'
        "<p>This link is single-use and expires automatically. If you did not "
        "request this, you can ignore this email.</p>"
        "</body></html>"
    )

    message = EmailMultiAlternatives(
        subject=subject,
        body=plain_text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.nu_email],
    )
    message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)


def send_neutral_account_request_notice(nu_email, purpose):
    labels = {
        "password_reset": "password reset",
        "registration": "registration",
        "verification": "email verification",
    }
    label = labels[purpose]
    subject = "FORKED NUCES account request received"
    plain_text = (
        f"We received a {label} request for this NU email address.\n\n"
        "If this address is eligible for the requested action, the relevant "
        "instructions have been sent. If you did not make this request, you "
        "can safely ignore this message.\n"
    )
    message = EmailMultiAlternatives(
        subject=subject,
        body=plain_text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[nu_email],
    )
    message.send(fail_silently=False)


@transaction.atomic(savepoint=False)
def revoke_user_refresh_tokens(user):
    """Blacklist every refresh token currently recorded for a user."""
    blacklisted_token_ids = BlacklistedToken.objects.values("token_id")
    outstanding_tokens = list(
        OutstandingToken.objects.select_for_update()
        .filter(user=user)
        .exclude(id__in=blacklisted_token_ids)
        .order_by("id")
    )
    BlacklistedToken.objects.bulk_create(
        [
            BlacklistedToken(token=outstanding_token)
            for outstanding_token in outstanding_tokens
        ],
        ignore_conflicts=True,
    )
    return len(outstanding_tokens)


@transaction.atomic
def invalidate_user_sessions(user):
    """Revoke current JWT sessions and return the locked, updated user."""
    locked_user = user.__class__.objects.select_for_update().get(pk=user.pk)
    locked_user.session_version += 1
    locked_user.save(update_fields=["session_version", "updated_at"])
    revoke_user_refresh_tokens(locked_user)
    return locked_user
