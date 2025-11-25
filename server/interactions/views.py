from rest_framework import generics, permissions

from .models import Comment
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
