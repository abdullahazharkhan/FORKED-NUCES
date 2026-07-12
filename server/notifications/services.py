from django.utils import timezone

from .models import Notification


def notify(
    *,
    recipient,
    event_type,
    message,
    actor=None,
    url_path="",
    dedupe_key=None,
):
    """Create or refresh an in-app notification without notifying the actor."""

    if actor is not None and recipient.pk == actor.pk:
        return None

    values = {
        "recipient": recipient,
        "actor": actor,
        "event_type": event_type,
        "message": message,
        "url_path": url_path,
        "read_at": None,
        "created_at": timezone.now(),
    }
    if dedupe_key:
        notification, _ = Notification.objects.update_or_create(
            dedupe_key=dedupe_key,
            defaults=values,
        )
        return notification
    return Notification.objects.create(**values)


def notify_many(events):
    """Bulk-create or refresh deduplicated local notifications."""
    notifications = []
    for event in events:
        recipient = event["recipient"]
        actor = event.get("actor")
        if actor is not None and recipient.pk == actor.pk:
            continue
        notifications.append(
            Notification(
                recipient=recipient,
                actor=actor,
                event_type=event["event_type"],
                message=event["message"],
                url_path=event.get("url_path", ""),
                dedupe_key=event["dedupe_key"],
                read_at=None,
            )
        )
    if not notifications:
        return []
    return Notification.objects.bulk_create(
        notifications,
        update_conflicts=True,
        update_fields=[
            "recipient",
            "actor",
            "event_type",
            "message",
            "url_path",
            "read_at",
            "created_at",
        ],
        unique_fields=["dedupe_key"],
    )
