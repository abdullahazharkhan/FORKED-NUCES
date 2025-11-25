from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import Comment, Like
from .serializers import CommentCreateSerializer, CommentSerializer


class CommentCreateView(generics.CreateAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = CommentCreateSerializer

	def perform_create(self, serializer):
		serializer.save()


class ProjectCommentsListView(generics.ListAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = CommentSerializer

	def get_queryset(self):
		project_id = self.kwargs.get("project_id")
		return Comment.objects.filter(project__project_id=project_id).select_related("user")


class ToggleProjectLikeView(generics.GenericAPIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, *args, **kwargs):
		project_id = request.data.get("project_id")
		if not project_id:
			return Response(
				{"detail": "project_id is required."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		user = request.user
		like = Like.objects.filter(user=user, project__project_id=project_id).first()

		if like:
			like.delete()
			return Response(
				{"detail": "Project unliked.", "liked": False},
				status=status.HTTP_200_OK,
			)

		# Ensure project exists before creating like
		from projects.models import Project

		try:
			project = Project.objects.get(project_id=project_id)
		except Project.DoesNotExist:
			return Response(
				{"detail": "Project not found."},
				status=status.HTTP_404_NOT_FOUND,
			)

		Like.objects.create(user=user, project=project)
		return Response(
			{"detail": "Project liked.", "liked": True},
			status=status.HTTP_201_CREATED,
		)
