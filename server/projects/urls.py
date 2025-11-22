from django.urls import path

from .views import (
	ProjectListCreateView,
	ProjectDetailView,
	IssueCreateView,
	IssueStatusUpdateView,
)


urlpatterns = [
	path("", ProjectListCreateView.as_view(), name="project-list-create"),
	path("<int:project_id>/", ProjectDetailView.as_view(), name="project-detail"),
	path("issues/", IssueCreateView.as_view(), name="issue-create"),
	path("issues/<int:issue_id>/status/", IssueStatusUpdateView.as_view(), name="issue-status-update"),
]

