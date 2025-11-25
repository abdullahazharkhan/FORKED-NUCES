from django.urls import path

from .views import CommentCreateView, ProjectCommentsListView, ToggleProjectLikeView

urlpatterns = [
    path("comments/", CommentCreateView.as_view(), name="comment-create"),
    path(
        "projects/<int:project_id>/comments/",
        ProjectCommentsListView.as_view(),
        name="project-comments-list",
    ),
    path("likes/toggle/", ToggleProjectLikeView.as_view(), name="project-like-toggle"),
]
