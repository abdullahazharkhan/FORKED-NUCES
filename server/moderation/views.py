from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, serializers as drf_serializers, status
from rest_framework.response import Response

from notifications.models import Notification
from notifications.services import notify
from .models import Report
from .serializers import (
    ReportCreateSerializer,
    ReportReviewSerializer,
    ReportSerializer,
)


class ReportListCreateView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReportCreateSerializer

    def get_throttles(self):
        self.throttle_scope = "report_create" if self.request.method == "POST" else None
        return super().get_throttles()

    def get(self, request):
        reports = Report.objects.filter(reporter=request.user).select_related(
            "reporter", "assigned_to"
        )
        page = self.paginate_queryset(reports)
        serializer = ReportSerializer(
            page if page is not None else reports,
            many=True,
            context=self.get_serializer_context(),
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                report = serializer.save()
        except IntegrityError as exc:
            raise drf_serializers.ValidationError(
                {"detail": ["You already have an active report for this resource."]}
            ) from exc
        return Response(
            ReportSerializer(report, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )


class StaffReportListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = ReportSerializer

    def get_queryset(self):
        queryset = Report.objects.select_related("reporter", "assigned_to")
        status_filter = self.request.query_params.get("status", "").strip()
        if status_filter:
            valid_statuses = {choice for choice, _ in Report.STATUS_CHOICES}
            if status_filter not in valid_statuses:
                raise drf_serializers.ValidationError(
                    {"status": ["Unknown moderation status."]}
                )
            queryset = queryset.filter(status=status_filter)
        return queryset


class StaffReportReviewView(generics.GenericAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = ReportReviewSerializer

    def patch(self, request, report_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            report = get_object_or_404(
                Report.objects.select_for_update(of=("self",)).select_related(
                    "reporter"
                ),
                report_id=report_id,
            )
            report.status = serializer.validated_data["status"]
            report.resolution_notes = serializer.validated_data["resolution_notes"]
            report.assigned_to = request.user
            report.resolved_at = (
                timezone.now()
                if report.status in {Report.STATUS_ACTIONED, Report.STATUS_DISMISSED}
                else None
            )
            report.save(
                update_fields=[
                    "status",
                    "resolution_notes",
                    "assigned_to",
                    "resolved_at",
                    "updated_at",
                ]
            )

            if report.reporter is not None:
                notify(
                    recipient=report.reporter,
                    actor=request.user,
                    event_type=Notification.TYPE_MODERATION,
                    message=(
                        f"Your {report.target_type} report is now {report.status}."
                    ),
                    url_path="/profile/reports",
                    dedupe_key=(
                        f"moderation-report:{report.report_id}:status:{report.status}"
                    ),
                )
        return Response(
            ReportSerializer(report, context=self.get_serializer_context()).data
        )
