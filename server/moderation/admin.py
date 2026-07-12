from django.contrib import admin, messages
from django.db import transaction
from django.utils import timezone

from notifications.models import Notification
from notifications.services import notify, notify_many
from .models import Report


MAX_BULK_REPORT_ACTIONS = 200


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        "report_id",
        "reporter",
        "target_type",
        "target_id",
        "reason",
        "status",
        "assigned_to",
        "created_at",
    )
    list_filter = ("target_type", "reason", "status", "created_at")
    search_fields = (
        "reporter__nu_email",
        "details",
        "resolution_notes",
    )
    readonly_fields = ("target_snapshot", "created_at", "updated_at", "resolved_at")
    actions = ("mark_reviewing", "mark_actioned", "mark_dismissed")

    def save_model(self, request, obj, form, change):
        with transaction.atomic():
            previous_status = None
            if change:
                previous_status = (
                    Report.objects.filter(pk=obj.pk)
                    .values_list("status", flat=True)
                    .first()
                )
            status_changed = not change or previous_status != obj.status

            if status_changed and obj.status in {
                Report.STATUS_REVIEWING,
                Report.STATUS_ACTIONED,
                Report.STATUS_DISMISSED,
            }:
                obj.assigned_to = request.user

            if obj.status in {Report.STATUS_ACTIONED, Report.STATUS_DISMISSED}:
                if status_changed:
                    obj.resolved_at = timezone.now()
                elif obj.resolved_at is None:
                    obj.resolved_at = timezone.now()
            else:
                obj.resolved_at = None

            super().save_model(request, obj, form, change)

            if change and status_changed and obj.reporter is not None:
                notify(
                    recipient=obj.reporter,
                    actor=request.user,
                    event_type=Notification.TYPE_MODERATION,
                    message=f"Your {obj.target_type} report is now {obj.status}.",
                    url_path="/profile/reports",
                    dedupe_key=(
                        f"moderation-report:{obj.report_id}:status:{obj.status}"
                    ),
                )

    def _set_status(self, request, queryset, next_status):
        with transaction.atomic():
            reports = list(
                queryset.select_for_update(of=("self",))
                .select_related("reporter")[: MAX_BULK_REPORT_ACTIONS + 1]
            )
            if len(reports) > MAX_BULK_REPORT_ACTIONS:
                self.message_user(
                    request,
                    (
                        f"Select at most {MAX_BULK_REPORT_ACTIONS} reports per "
                        "action to avoid a long-running moderation transaction."
                    ),
                    level=messages.ERROR,
                )
                return
            if not reports:
                return
            now = timezone.now()
            resolved_at = (
                now
                if next_status in {Report.STATUS_ACTIONED, Report.STATUS_DISMISSED}
                else None
            )
            Report.objects.filter(pk__in=[report.pk for report in reports]).update(
                status=next_status,
                assigned_to=request.user,
                resolved_at=resolved_at,
                updated_at=now,
            )
            notify_many(
                [
                    {
                        "recipient": report.reporter,
                        "actor": request.user,
                        "event_type": Notification.TYPE_MODERATION,
                        "message": (
                            f"Your {report.target_type} report is now {next_status}."
                        ),
                        "url_path": "/profile/reports",
                        "dedupe_key": (
                            f"moderation-report:{report.report_id}:"
                            f"status:{next_status}"
                        ),
                    }
                    for report in reports
                    if report.reporter is not None
                ]
            )
        self.message_user(request, f"Updated {len(reports)} report(s).")

    @admin.action(description="Mark selected reports as reviewing")
    def mark_reviewing(self, request, queryset):
        self._set_status(request, queryset, Report.STATUS_REVIEWING)

    @admin.action(description="Mark selected reports as actioned")
    def mark_actioned(self, request, queryset):
        self._set_status(request, queryset, Report.STATUS_ACTIONED)

    @admin.action(description="Mark selected reports as dismissed")
    def mark_dismissed(self, request, queryset):
        self._set_status(request, queryset, Report.STATUS_DISMISSED)
