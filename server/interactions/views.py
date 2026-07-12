from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db import transaction

from projects.models import Project
from notifications.models import Notification
from notifications.services import notify

from .models import Comment, Like
from .serializers import (
	CommentCreateSerializer,
	CommentSerializer,
	ToggleProjectLikeSerializer,
)


class CommentCreateView(generics.CreateAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = CommentCreateSerializer

	def perform_create(self, serializer):
		with transaction.atomic():
			comment = serializer.save()
			notify(
				recipient=comment.project.user,
				actor=comment.user,
				event_type=Notification.TYPE_COMMENT,
				message=(
					f"{comment.user.full_name} commented on “{comment.project.title}”."
				),
				url_path=f"/platform/projects/{comment.project_id}",
			)


class CommentDeleteView(generics.DestroyAPIView):
	permission_classes = [permissions.IsAuthenticated]
	lookup_field = "comment_id"

	def get_queryset(self):
		return Comment.objects.select_related("user", "project__user").all()

	def destroy(self, request, *args, **kwargs):
		try:
			comment = self.get_object()
		except Comment.DoesNotExist:
			return Response(
				{"detail": "Comment not found."},
				status=status.HTTP_404_NOT_FOUND,
			)

		user = request.user
		is_comment_author = comment.user == user
		is_project_owner = comment.project.user == user

		if not is_comment_author and not is_project_owner:
			return Response(
				{"detail": "You do not have permission to delete this comment."},
				status=status.HTTP_403_FORBIDDEN,
			)

		comment.delete()
		return Response(
			{"detail": "Comment deleted successfully."},
			status=status.HTTP_200_OK,
		)


class ProjectCommentsListView(generics.ListAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = CommentSerializer

	def get_queryset(self):
		project_id = self.kwargs.get("project_id")
		return Comment.objects.filter(project__project_id=project_id).select_related("user")


class ToggleProjectLikeView(generics.GenericAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = ToggleProjectLikeSerializer

	def post(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		project_id = serializer.validated_data["project_id"]
		user = request.user

		with transaction.atomic():
			# Lock the project so two concurrent toggles for the same project cannot
			# both observe an absent Like and race into the unique constraint.
			try:
				project = Project.objects.select_for_update().get(project_id=project_id)
			except Project.DoesNotExist:
				return Response(
					{"detail": "Project not found."},
					status=status.HTTP_404_NOT_FOUND,
				)

			if project.user_id == user.user_id:
				return Response(
					{"detail": "You cannot like your own project."},
					status=status.HTTP_400_BAD_REQUEST,
				)

			like = Like.objects.filter(user=user, project__project_id=project_id).first()

			if like:
				like.delete()
				Notification.objects.filter(
					dedupe_key=(
						f"project:{project.project_id}:like:user:{user.user_id}"
					)
				).delete()
				return Response(
					{"detail": "Project unliked.", "liked": False},
					status=status.HTTP_200_OK,
				)

			Like.objects.create(user=user, project=project)
			notify(
				recipient=project.user,
				actor=user,
				event_type=Notification.TYPE_LIKE,
				message=f"{user.full_name} liked “{project.title}”.",
				url_path=f"/platform/projects/{project.project_id}",
				dedupe_key=(
					f"project:{project.project_id}:like:user:{user.user_id}"
				),
			)

		return Response(
			{"detail": "Project liked.", "liked": True},
			status=status.HTTP_201_CREATED,
		)
