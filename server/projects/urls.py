from django.urls import path

from .views import (
	ProjectListCreateView,
	ProjectDetailView,
	IssueCreateView,
	IssueStatusUpdateView,
	IssueUpdateDeleteView,
	AllProjectsListView,
	PublicProjectDetailView,
 	UserProjectsListView,
)


urlpatterns = [
	path("", ProjectListCreateView.as_view(), name="project-list-create"),
	path("all/", AllProjectsListView.as_view(), name="project-list-all"),
	path("<int:project_id>/", ProjectDetailView.as_view(), name="project-detail"),
 	path(
        "public/<int:project_id>/",
        PublicProjectDetailView.as_view(),
        name="project-detail-public",
    ),
  	path("by-user/<int:user_id>/", UserProjectsListView.as_view(), name="user-projects"),
	path("issues/", IssueCreateView.as_view(), name="issue-create"),
	path("issues/<int:issue_id>/status/", IssueStatusUpdateView.as_view(), name="issue-status-update"),
	path("issues/<int:issue_id>/", IssueUpdateDeleteView.as_view(), name="issue-update-delete"),
]

