from django.urls import path

from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    IssueCreateView,
    IssueStatusUpdateView,
    IssueUpdateDeleteView,
    CloseIssueAndAddCollaboratorView,
    AllProjectsListView,
    PublicProjectDetailView,
    UserProjectsListView,
    ProjectCollaboratorsView,
    UserCollaboratedProjectsView,
    RecommendedProjectsView,
    TopContributorsView,
    UserActivityStatsView,
    RecentActivityView,
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
    path(
        "issues/close-with-collaborator/",
        CloseIssueAndAddCollaboratorView.as_view(),
        name="issue-close-with-collaborator",
    ),
    path(
        "<int:project_id>/collaborators/",
        ProjectCollaboratorsView.as_view(),
        name="project-collaborators",
    ),
    path(
        "collaborated/by-user/<int:user_id>/",
        UserCollaboratedProjectsView.as_view(),
        name="user-collaborated-projects",
    ),
    # Endpoints using PostgreSQL DB Views
    path("recommended/", RecommendedProjectsView.as_view(), name="recommended-projects"),
    path("top-contributors/", TopContributorsView.as_view(), name="top-contributors"),
    path("user-stats/", UserActivityStatsView.as_view(), name="user-activity-stats-self"),
    path("user-stats/<int:user_id>/", UserActivityStatsView.as_view(), name="user-activity-stats"),
    path("recent-activity/", RecentActivityView.as_view(), name="recent-activity"),
]
