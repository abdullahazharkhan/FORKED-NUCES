from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import connection, transaction

from accounts.models import User

from .models import Project, Issue, Collaborator, Tag
from .serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
    IssueSerializer,
    IssueCreateSerializer,
    IssueUpdateSerializer,
    CollaboratorUserIssueSerializer,
    IssueWithCollaboratorsSerializer,
    CloseIssueInputSerializer,
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

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ProjectUpdateSerializer
        return ProjectSerializer

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)


class AllProjectsListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.select_related("user").all()

class PublicProjectDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectSerializer
    lookup_field = "project_id"
    queryset = Project.objects.select_related("user").prefetch_related("tags", "issues")

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


class IssueUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IssueUpdateSerializer
    lookup_field = "issue_id"

    def get_queryset(self):
        # Only issues belonging to projects owned by the current user
        return Issue.objects.filter(project__user=self.request.user)


class CloseIssueAndAddCollaboratorView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    serializer_class = CloseIssueInputSerializer
    queryset = Issue.objects.none()

    def post(self, request, *args, **kwargs):
        print("=== CloseIssue POST called ===")
        print(f"Request data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue_id = serializer.validated_data["issue_id"]
        user_ids = serializer.validated_data.get("user_ids", [])
        
        print(f"Validated issue_id: {issue_id}")
        print(f"Validated user_ids: {user_ids}")

        try:
            issue = Issue.objects.select_related("project").get(issue_id=issue_id)
        except Issue.DoesNotExist:
            return Response(
                {"detail": "Issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Only the owner of the issue's project can close it and add collaborators
        if issue.project.user != request.user:
            return Response(
                {"detail": "You do not have permission to modify this issue."},
                status=status.HTTP_403_FORBIDDEN,
            )

        collaborator_ids = []
        collaborator_users = []
        for user_id in user_ids:
            print(f"Processing user_id: {user_id}")
            try:
                user = User.objects.get(user_id=user_id)
                print(f"Found user: {user.full_name}")
            except User.DoesNotExist:
                return Response(
                    {"detail": f"User with id {user_id} not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            collaborator_users.append(user)
            collaborator_ids.append(user.user_id)

        # Close the issue and add collaborators atomically
        with transaction.atomic():
            issue.status = Issue.STATUS_CLOSED
            issue.save(update_fields=["status", "updated_at"])
            print(f"Issue {issue_id} closed")

            # Create collaborator entries (idempotent via unique_together)
            for collaborator_user in collaborator_users:
                collab, created = Collaborator.objects.get_or_create(user=collaborator_user, issue=issue)
                print(f"Collaborator created={created} for user={collaborator_user.full_name}, issue={issue.issue_id}")

        # Verify what's in the database
        all_collabs = Collaborator.objects.filter(issue=issue)
        print(f"Total collaborators for issue {issue_id}: {all_collabs.count()}")
        for c in all_collabs:
            print(f"  - user_id={c.user_id}, issue_id={c.issue_id}")

        return Response(
            {
                "detail": "Issue closed successfully.",
                "issue_id": issue.issue_id,
                "status": issue.status,
                "collaborator_user_ids": collaborator_ids,
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request, *args, **kwargs):
        mode = request.query_params.get("mode", "issues")

        if mode == "users":
            # Users with their collaborated issues
            users = (
                User.objects.filter(issue_collaborations__isnull=False)
                .distinct()
            )
            serializer = CollaboratorUserIssueSerializer(users, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Default: issues with their collaborators
        issues = Issue.objects.filter(collaborators__isnull=False).distinct()
        serializer = IssueWithCollaboratorsSerializer(issues, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectCollaboratorsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CollaboratorUserIssueSerializer

    def get_queryset(self):
        project_id = self.kwargs.get("project_id")
        # All users who have collaborated on any issue under this project
        return (
            User.objects.filter(issue_collaborations__issue__project__project_id=project_id)
            .distinct()
        )


class UserCollaboratedProjectsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Project.objects.none()

    def list(self, request, *args, **kwargs):
        user_id = self.kwargs.get("user_id")
        projects = (
            Project.objects.filter(issues__collaborators__user__user_id=user_id)
            .select_related("user")
            .distinct()
        )
        data = [
            {
                "project_id": project.project_id,
                "title": project.title,
                "owner_full_name": project.user.full_name,
                "owner_nu_email": project.user.nu_email,
            }
            for project in projects
        ]
        return Response(data)

class UserProjectsListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        user_id = self.kwargs.get("user_id")
        return Project.objects.select_related("user").filter(user__user_id=user_id)


# ============================================================
# Views using PostgreSQL DB Views (created in migration 0007)
# ============================================================

class RecommendedProjectsView(APIView):
    """
    GET /projects/recommended/?mode=spotlight|with-issues|skill-match|network
    Uses DB views for fast pre-computed recommendations.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        mode = request.query_params.get("mode", "spotlight")
        user_id = request.user.user_id

        with connection.cursor() as cursor:
            if mode == "spotlight":
                cursor.execute("""
                    SELECT project_id, title, description, github_url,
                        owner_id, owner_full_name, owner_nu_email, owner_avatar_url,
                        likes_count, comments_count, open_issues, closed_issues,
                        engagement_score, trending_score, days_since_update,
                        created_at, updated_at
                    FROM trending_projects_view
                    WHERE owner_id != %s
                    ORDER BY trending_score DESC
                    LIMIT 20
                """, [user_id])

            elif mode == "with-issues":
                cursor.execute("""
                    SELECT project_id, title, description, github_url,
                        owner_id, owner_full_name, owner_nu_email, owner_avatar_url,
                        likes_count, comments_count, open_issues, closed_issues,
                        engagement_score, 0 AS trending_score, days_since_update,
                        created_at, updated_at
                    FROM projects_needing_help_view
                    WHERE owner_id != %s
                    ORDER BY open_issues DESC
                    LIMIT 20
                """, [user_id])

            elif mode == "skill-match":
                cursor.execute(
                    "SELECT LOWER(skill) FROM accounts_skill WHERE user_id = %s",
                    [user_id]
                )
                user_skills = [row[0] for row in cursor.fetchall()]

                if not user_skills:
                    return Response({
                        "projects": [],
                        "mode": mode,
                        "message": "Add skills to your profile to get personalised recommendations.",
                    })

                placeholders = ",".join(["%s"] * len(user_skills))
                cursor.execute(f"""
                    SELECT DISTINCT
                        p.project_id, p.title, p.description, p.github_url,
                        p.owner_id, p.owner_full_name, p.owner_nu_email, p.owner_avatar_url,
                        p.likes_count, p.comments_count, p.open_issues, p.closed_issues,
                        p.engagement_score, 0 AS trending_score, p.days_since_update,
                        p.created_at, p.updated_at,
                        COUNT(ptf.tag) AS skill_matches
                    FROM project_summary_view p
                    JOIN project_tags_flat_view ptf ON p.project_id = ptf.project_id
                    WHERE ptf.tag IN ({placeholders})
                    AND p.owner_id != %s
                    GROUP BY
                        p.project_id, p.title, p.description, p.github_url,
                        p.owner_id, p.owner_full_name, p.owner_nu_email, p.owner_avatar_url,
                        p.likes_count, p.comments_count, p.open_issues, p.closed_issues,
                        p.engagement_score, p.days_since_update, p.created_at, p.updated_at
                    ORDER BY skill_matches DESC, p.engagement_score DESC
                    LIMIT 20
                """, user_skills + [user_id])

            elif mode == "network":
                cursor.execute("""
                    SELECT DISTINCT
                        p.project_id, p.title, p.description, p.github_url,
                        p.owner_id, p.owner_full_name, p.owner_nu_email, p.owner_avatar_url,
                        p.likes_count, p.comments_count, p.open_issues, p.closed_issues,
                        p.engagement_score, 0 AS trending_score, p.days_since_update,
                        p.created_at, p.updated_at
                    FROM project_summary_view p
                    WHERE p.project_id IN (
                        SELECT project_id FROM get_user_network_projects(%s)
                    )
                    ORDER BY p.engagement_score DESC
                    LIMIT 20
                """, [user_id])

            else:
                cursor.execute("""
                    SELECT project_id, title, description, github_url,
                        owner_id, owner_full_name, owner_nu_email, owner_avatar_url,
                        likes_count, comments_count, open_issues, closed_issues,
                        engagement_score, 0 AS trending_score, days_since_update,
                        created_at, updated_at
                    FROM project_summary_view
                    WHERE owner_id != %s
                    ORDER BY created_at DESC
                    LIMIT 20
                """, [user_id])

            columns = [col[0] for col in cursor.description]
            projects = [dict(zip(columns, row)) for row in cursor.fetchall()]

        # Attach tags to each project
        for project in projects:
            tags = Tag.objects.filter(
                project_id=project["project_id"]
            ).values_list("tag", flat=True)
            project["tags"] = list(tags)

        return Response({"projects": projects, "mode": mode})


class TopContributorsView(APIView):
    """
    GET /projects/top-contributors/?limit=10
    Uses top_contributors_view with RANK() window function.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        limit = min(int(request.query_params.get("limit", 10)), 50)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT user_id, full_name, nu_email, avatar_url,
                    projects_created, issues_collaborated, comments_made,
                    activity_score, rank
                FROM top_contributors_view
                LIMIT %s
            """, [limit])
            columns = [col[0] for col in cursor.description]
            contributors = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return Response(contributors)


class UserActivityStatsView(APIView):
    """
    GET /projects/user-stats/              → current user
    GET /projects/user-stats/<user_id>/   → specific user
    Uses user_activity_view.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id=None):
        target_user_id = user_id or request.user.user_id

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT user_id, full_name, nu_email, avatar_url, bio,
                    github_username, is_github_connected, member_since,
                    projects_created, issues_collaborated, projects_collaborated,
                    likes_given, comments_made, skill_count, activity_score
                FROM user_activity_view
                WHERE user_id = %s
            """, [target_user_id])
            row = cursor.fetchone()

        if not row:
            return Response({"detail": "User not found."}, status=404)

        columns = [col[0] for col in cursor.description]
        return Response(dict(zip(columns, row)))


class RecentActivityView(APIView):
    """
    GET /projects/recent-activity/?limit=20
    Uses recent_activity_view (UNION ALL of projects + comments).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        limit = min(int(request.query_params.get("limit", 20)), 100)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT activity_type, entity_id, entity_title,
                    user_id, full_name, avatar_url, activity_date
                FROM recent_activity_view
                ORDER BY activity_date DESC
                LIMIT %s
            """, [limit])
            columns = [col[0] for col in cursor.description]
            activities = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return Response(activities)