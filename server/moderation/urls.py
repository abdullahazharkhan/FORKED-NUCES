from django.urls import path

from .views import ReportListCreateView, StaffReportListView, StaffReportReviewView


urlpatterns = [
    path("reports/", ReportListCreateView.as_view(), name="report-list-create"),
    path("staff/reports/", StaffReportListView.as_view(), name="staff-report-list"),
    path(
        "staff/reports/<int:report_id>/",
        StaffReportReviewView.as_view(),
        name="staff-report-review",
    ),
]
