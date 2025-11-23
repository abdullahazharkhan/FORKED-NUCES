from rest_framework import generics, permissions

from .models import Project, Issue
from .serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    IssueSerializer,
    IssueCreateSerializer,
)


class ProjectListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProjectCreateSerializer
        return ProjectSerializer


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "project_id"
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)


class AllProjectsListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.select_related("user").all()


class IssueCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IssueCreateSerializer

    def perform_create(self, serializer):
        serializer.save()


class IssueStatusUpdateView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IssueSerializer
    lookup_field = "issue_id"

    def get_queryset(self):
        # Only issues belonging to the current user's projects
        return Issue.objects.filter(project__user=self.request.user)

    def get_serializer(self, *args, **kwargs):
        # Restrict to status-only updates
        serializer = super().get_serializer(*args, **kwargs)
        serializer.fields.pop("title", None)
        serializer.fields.pop("description", None)
        return serializer