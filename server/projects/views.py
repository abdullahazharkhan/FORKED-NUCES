from django.db import connection, transaction
from django.db.models import (
    CharField,
    Count,
    DurationField,
    ExpressionWrapper,
    F,
    FloatField,
    IntegerField,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    Value,
    Window,
)
from django.db.models.functions import Coalesce, Extract, Greatest, Lower, Now
from django.db.models.functions.window import Rank
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers as drf_serializers
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from interactions.models import Comment, Like
from notifications.models import Notification
from notifications.services import notify

from .models import CollaborationRequest, Collaborator, Issue, Project, Tag
from .querysets import with_project_api_data, with_project_metrics
from .serializers import (
    CloseIssueInputSerializer,
    CollaborationRequestActionSerializer,
    CollaborationRequestCreateSerializer,
    CollaborationRequestSerializer,
    CollaboratorUserIssueSerializer,
    IssueCreateSerializer,
    IssueSerializer,
    IssueUpdateSerializer,
    IssueWithCollaboratorsSerializer,
    ProjectCreateSerializer,
    ProjectDetailSerializer,
    ProjectListQuerySerializer,
    ProjectSerializer,
    ProjectUpdateSerializer,
    RecentActivityQuerySerializer,
    RecommendedProjectsQuerySerializer,
    TopContributorsQuerySerializer,
)


class ProjectListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return with_project_api_data(
            Project.objects.filter(user=self.request.user),
            self.request.user,
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProjectCreateSerializer
        return ProjectSerializer


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "project_id"

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ProjectUpdateSerializer
        return ProjectDetailSerializer

    def get_queryset(self):
        return with_project_api_data(
            Project.objects.filter(user=self.request.user),
            self.request.user,
            include_issue_details=True,
        )


class AllProjectsListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        params = ProjectListQuerySerializer(data=self.request.query_params)
        params.is_valid(raise_exception=True)
        filters = params.validated_data
        queryset = with_project_api_data(Project.objects.all(), self.request.user)

        search = filters["search"]
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(user__full_name__icontains=search)
                | Q(user__nu_email__icontains=search)
                | Q(tags__tag__icontains=search)
                | Q(issues__title__icontains=search)
            ).distinct()

        tag = filters["tag"]
        if tag:
            queryset = queryset.filter(tags__tag__iexact=tag)

        issue_status = filters["issue_status"]
        if issue_status == ProjectListQuerySerializer.ISSUE_STATUS_OPEN:
            queryset = queryset.filter(open_issues__gt=0)
        elif issue_status == ProjectListQuerySerializer.ISSUE_STATUS_CLOSED:
            queryset = queryset.filter(closed_issues__gt=0)
        elif issue_status == ProjectListQuerySerializer.ISSUE_STATUS_WITHOUT_OPEN:
            queryset = queryset.filter(open_issues=0)

        ordering = {
            ProjectListQuerySerializer.ORDER_NEWEST: ("-created_at", "-project_id"),
            ProjectListQuerySerializer.ORDER_OLDEST: ("created_at", "project_id"),
            ProjectListQuerySerializer.ORDER_UPDATED: ("-updated_at", "-project_id"),
            ProjectListQuerySerializer.ORDER_POPULAR: ("-likes_count", "-created_at", "-project_id"),
            ProjectListQuerySerializer.ORDER_DISCUSSED: ("-comments_count", "-created_at", "-project_id"),
            ProjectListQuerySerializer.ORDER_NEEDS_HELP: ("-open_issues", "-updated_at", "-project_id"),
        }[filters["ordering"]]
        return queryset.order_by(*ordering)


class PublicProjectDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectDetailSerializer
    lookup_field = "project_id"

    def get_queryset(self):
        return with_project_api_data(
            Project.objects.all(),
            self.request.user,
            include_issue_details=True,
        )


class IssueCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IssueCreateSerializer


class IssueStatusUpdateView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IssueSerializer
    lookup_field = "issue_id"

    def get_queryset(self):
        return Issue.objects.filter(project__user=self.request.user)

    def get_serializer(self, *args, **kwargs):
        serializer = super().get_serializer(*args, **kwargs)
        serializer.fields.pop("title", None)
        serializer.fields.pop("description", None)
        return serializer


class IssueUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IssueUpdateSerializer
    lookup_field = "issue_id"

    def get_queryset(self):
        return Issue.objects.filter(project__user=self.request.user)


class CloseIssueAndAddCollaboratorView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CloseIssueInputSerializer
    queryset = Issue.objects.none()

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue_id = serializer.validated_data["issue_id"]
        user_ids = serializer.validated_data.get("user_ids", [])

        try:
            issue = Issue.objects.select_related("project").get(issue_id=issue_id)
        except Issue.DoesNotExist:
            return Response(
                {"detail": "Issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if issue.project.user != request.user:
            return Response(
                {"detail": "You do not have permission to modify this issue."},
                status=status.HTTP_403_FORBIDDEN,
            )

        collaborator_users = list(
            User.objects.filter(user_id__in=set(user_ids)).order_by("user_id")
        )
        found_ids = {user.user_id for user in collaborator_users}
        missing_ids = sorted(set(user_ids) - found_ids)
        if missing_ids:
            return Response(
                {"detail": f"User with id {missing_ids[0]} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            # Every collaboration mutation takes locks in issue -> request order.
            # Re-check authorization and consent while those rows are locked so a
            # concurrent withdrawal/cancellation cannot race with attribution.
            issue = (
                Issue.objects.select_for_update(of=("self",))
                .select_related("project")
                .get(issue_id=issue.issue_id)
            )
            if issue.project.user_id != request.user.user_id:
                return Response(
                    {"detail": "You do not have permission to modify this issue."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if issue.status != Issue.STATUS_OPEN:
                return Response(
                    {"detail": "Only open issues can be closed."},
                    status=status.HTTP_409_CONFLICT,
                )

            accepted_ids = set(
                CollaborationRequest.objects.select_for_update()
                .filter(
                    issue=issue,
                    user_id__in=found_ids,
                    status=CollaborationRequest.STATUS_ACCEPTED,
                )
                .values_list("user_id", flat=True)
            )
            without_consent = sorted(found_ids - accepted_ids)
            if without_consent:
                return Response(
                    {
                        "detail": (
                            "Only contributors with an accepted collaboration "
                            "request can be credited. "
                            f"User {without_consent[0]} has not accepted."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            issue.status = Issue.STATUS_CLOSED
            issue.save(update_fields=["status", "updated_at"])
            Collaborator.objects.bulk_create(
                [
                    Collaborator(user=user, issue=issue)
                    for user in collaborator_users
                ],
                ignore_conflicts=True,
            )

            for collaborator_user in collaborator_users:
                notify(
                    recipient=collaborator_user,
                    actor=request.user,
                    event_type=Notification.TYPE_ISSUE_CLOSED,
                    message=(
                        f"You were credited for resolving “{issue.title}” in "
                        f"{issue.project.title}."
                    ),
                    url_path=f"/platform/projects/{issue.project_id}",
                    dedupe_key=(
                        f"issue:{issue.issue_id}:closed:credit:"
                        f"{collaborator_user.user_id}"
                    ),
                )

        return Response(
            {
                "detail": "Issue closed successfully.",
                "issue_id": issue.issue_id,
                "status": issue.status,
                "collaborator_user_ids": [user.user_id for user in collaborator_users],
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request, *args, **kwargs):
        mode = request.query_params.get("mode", "issues")
        if mode == "users":
            users = (
                User.objects.filter(issue_collaborations__isnull=False)
                .prefetch_related(
                    Prefetch(
                        "issue_collaborations",
                        queryset=Collaborator.objects.select_related(
                            "issue__project"
                        ),
                        to_attr="scoped_issue_collaborations",
                    )
                )
                .distinct()
                .order_by("user_id")
            )
            page = self.paginate_queryset(users)
            serializer = CollaboratorUserIssueSerializer(
                page if page is not None else users,
                many=True,
                context=self.get_serializer_context(),
            )
        else:
            issues = (
                Issue.objects.filter(collaborators__isnull=False)
                .prefetch_related(
                    Prefetch(
                        "collaborators",
                        queryset=Collaborator.objects.select_related("user"),
                        to_attr="prefetched_collaborations",
                    )
                )
                .distinct()
                .order_by("-created_at", "issue_id")
            )
            page = self.paginate_queryset(issues)
            serializer = IssueWithCollaboratorsSerializer(
                page if page is not None else issues,
                many=True,
                context=self.get_serializer_context(),
            )

        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)


def _collaboration_request_queryset():
    return CollaborationRequest.objects.select_related(
        "issue__project__user",
        "user",
        "created_by",
        "resolved_by",
    )


class IssueCollaborationRequestListCreateView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CollaborationRequestCreateSerializer

    def get_throttles(self):
        self.throttle_scope = (
            "collaboration_request" if self.request.method == "POST" else None
        )
        return super().get_throttles()

    def get_issue(self):
        return get_object_or_404(
            Issue.objects.select_related("project__user"),
            issue_id=self.kwargs["issue_id"],
        )

    def get(self, request, *args, **kwargs):
        issue = self.get_issue()
        requests = _collaboration_request_queryset().filter(issue=issue)
        if issue.project.user_id != request.user.user_id:
            requests = requests.filter(user=request.user)
        status_filter = request.query_params.get("status", "").strip().lower()
        if status_filter:
            valid_statuses = {
                choice for choice, _ in CollaborationRequest.STATUS_CHOICES
            }
            if status_filter not in valid_statuses:
                raise drf_serializers.ValidationError(
                    {"status": ["Unknown collaboration request status."]}
                )
            requests = requests.filter(status=status_filter)

        page = self.paginate_queryset(requests)
        serializer = CollaborationRequestSerializer(
            page if page is not None else requests,
            many=True,
            context=self.get_serializer_context(),
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        input_serializer = self.get_serializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        message = input_serializer.validated_data["message"]

        with transaction.atomic():
            issue = get_object_or_404(
                Issue.objects.select_for_update(of=("self",)).select_related(
                    "project__user"
                ),
                issue_id=self.kwargs["issue_id"],
            )
            if issue.status != Issue.STATUS_OPEN:
                return Response(
                    {"detail": "Collaboration is only available for open issues."},
                    status=status.HTTP_409_CONFLICT,
                )

            is_owner = issue.project.user_id == request.user.user_id
            requested_user_id = input_serializer.validated_data.get("user_id")
            if is_owner:
                if requested_user_id is None:
                    raise drf_serializers.ValidationError(
                        {"user_id": ["Select a user to invite."]}
                    )
                try:
                    contributor = User.objects.get(
                        user_id=requested_user_id,
                        is_active=True,
                        is_email_verified=True,
                    )
                except User.DoesNotExist as exc:
                    raise drf_serializers.ValidationError(
                        {"user_id": ["The selected active, verified user was not found."]}
                    ) from exc
                if contributor.user_id == request.user.user_id:
                    raise drf_serializers.ValidationError(
                        {"user_id": ["Project owners cannot invite themselves."]}
                    )
                request_kind = CollaborationRequest.KIND_INVITATION
            else:
                if requested_user_id is not None:
                    raise drf_serializers.ValidationError(
                        {"user_id": ["Only the project owner can invite another user."]}
                    )
                contributor = request.user
                request_kind = CollaborationRequest.KIND_APPLICATION

            collaboration_request = (
                CollaborationRequest.objects.select_for_update()
                .filter(issue=issue, user=contributor)
                .first()
            )
            created = collaboration_request is None
            if created:
                collaboration_request = CollaborationRequest.objects.create(
                    issue=issue,
                    user=contributor,
                    created_by=request.user,
                    kind=request_kind,
                    message=message,
                )
            elif collaboration_request.status == CollaborationRequest.STATUS_ACCEPTED:
                return Response(
                    {
                        "detail": "This user already has an accepted collaboration request.",
                        "request": CollaborationRequestSerializer(
                            collaboration_request,
                            context=self.get_serializer_context(),
                        ).data,
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            elif collaboration_request.status == CollaborationRequest.STATUS_PENDING:
                if collaboration_request.kind != request_kind:
                    return Response(
                        {
                            "detail": "A collaboration request is already awaiting a response.",
                            "request": CollaborationRequestSerializer(
                                collaboration_request,
                                context=self.get_serializer_context(),
                            ).data,
                        },
                        status=status.HTTP_409_CONFLICT,
                    )
                created = False
            else:
                collaboration_request.kind = request_kind
                collaboration_request.status = CollaborationRequest.STATUS_PENDING
                collaboration_request.message = message
                collaboration_request.created_by = request.user
                collaboration_request.resolved_by = None
                collaboration_request.responded_at = None
                collaboration_request.save(
                    update_fields=[
                        "kind",
                        "status",
                        "message",
                        "created_by",
                        "resolved_by",
                        "responded_at",
                        "updated_at",
                    ]
                )
                created = True

            if created:
                notification_recipient = (
                    issue.project.user
                    if request_kind == CollaborationRequest.KIND_APPLICATION
                    else contributor
                )
                notification_message = (
                    f"{contributor.full_name} applied to collaborate on "
                    f"“{issue.title}”."
                    if request_kind == CollaborationRequest.KIND_APPLICATION
                    else (
                        f"{issue.project.user.full_name} invited you "
                        f"to collaborate on “{issue.title}”."
                    )
                )
                notify(
                    recipient=notification_recipient,
                    actor=request.user,
                    event_type=Notification.TYPE_COLLABORATION_REQUEST,
                    message=notification_message,
                    url_path=f"/platform/projects/{issue.project_id}",
                    dedupe_key=(
                        f"collaboration-request:{collaboration_request.request_id}:"
                        "pending"
                    ),
                )

        collaboration_request = _collaboration_request_queryset().get(
            pk=collaboration_request.pk
        )
        return Response(
            CollaborationRequestSerializer(
                collaboration_request,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class CollaborationRequestActionView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CollaborationRequestActionSerializer
    throttle_scope = "collaboration_action"

    def patch(self, request, *args, **kwargs):
        input_serializer = self.get_serializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        action = input_serializer.validated_data["action"]

        request_stub = get_object_or_404(
            CollaborationRequest.objects.only("request_id", "issue_id"),
            request_id=self.kwargs["request_id"],
        )

        with transaction.atomic():
            # Match the create/close lock order to avoid a request<->issue
            # deadlock, then make the state decision from the locked rows.
            issue = (
                Issue.objects.select_for_update(of=("self",))
                .select_related("project__user")
                .get(issue_id=request_stub.issue_id)
            )
            collaboration_request = get_object_or_404(
                CollaborationRequest.objects.select_for_update(
                    of=("self",)
                ).select_related("user", "created_by"),
                request_id=request_stub.request_id,
            )
            owner_id = issue.project.user_id
            contributor_id = collaboration_request.user_id
            actor_id = request.user.user_id

            if issue.status != Issue.STATUS_OPEN:
                return Response(
                    {"detail": "Requests on a closed issue cannot be changed."},
                    status=status.HTTP_409_CONFLICT,
                )

            if action in {"accept", "reject"}:
                decision_maker_id = (
                    owner_id
                    if collaboration_request.kind
                    == CollaborationRequest.KIND_APPLICATION
                    else contributor_id
                )
                if actor_id != decision_maker_id:
                    return Response(
                        {"detail": "You cannot decide this collaboration request."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                if collaboration_request.status != CollaborationRequest.STATUS_PENDING:
                    return Response(
                        {"detail": "Only pending requests can be accepted or rejected."},
                        status=status.HTTP_409_CONFLICT,
                    )
                next_status = (
                    CollaborationRequest.STATUS_ACCEPTED
                    if action == "accept"
                    else CollaborationRequest.STATUS_REJECTED
                )
            elif action == "withdraw":
                if actor_id != contributor_id:
                    return Response(
                        {"detail": "Only the contributor can withdraw."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                if collaboration_request.status not in {
                    CollaborationRequest.STATUS_PENDING,
                    CollaborationRequest.STATUS_ACCEPTED,
                }:
                    return Response(
                        {"detail": "This request can no longer be withdrawn."},
                        status=status.HTTP_409_CONFLICT,
                    )
                next_status = CollaborationRequest.STATUS_WITHDRAWN
            else:
                if actor_id != owner_id:
                    return Response(
                        {"detail": "Only the project owner can cancel this request."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                if collaboration_request.status not in {
                    CollaborationRequest.STATUS_PENDING,
                    CollaborationRequest.STATUS_ACCEPTED,
                }:
                    return Response(
                        {"detail": "This request can no longer be cancelled."},
                        status=status.HTTP_409_CONFLICT,
                    )
                next_status = CollaborationRequest.STATUS_CANCELLED

            collaboration_request.status = next_status
            collaboration_request.resolved_by = request.user
            collaboration_request.responded_at = timezone.now()
            collaboration_request.save(
                update_fields=[
                    "status",
                    "resolved_by",
                    "responded_at",
                    "updated_at",
                ]
            )
            notification_recipient = (
                issue.project.user
                if actor_id == contributor_id
                else collaboration_request.user
            )
            notify(
                recipient=notification_recipient,
                actor=request.user,
                event_type=Notification.TYPE_COLLABORATION_DECISION,
                message=(
                    f"The collaboration request for “{issue.title}” "
                    f"is now {collaboration_request.status}."
                ),
                url_path=f"/platform/projects/{issue.project_id}",
                dedupe_key=(
                    f"collaboration-request:{collaboration_request.request_id}:"
                    f"status:{collaboration_request.status}"
                ),
            )

        collaboration_request = _collaboration_request_queryset().get(
            pk=collaboration_request.pk
        )
        return Response(
            CollaborationRequestSerializer(
                collaboration_request,
                context=self.get_serializer_context(),
            ).data
        )


class MyCollaborationRequestsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CollaborationRequestSerializer

    def get_queryset(self):
        return (
            _collaboration_request_queryset()
            .filter(
                Q(user=self.request.user)
                | Q(issue__project__user=self.request.user)
            )
            .distinct()
        )


class ProjectCollaboratorsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CollaboratorUserIssueSerializer

    def get_queryset(self):
        project_id = self.kwargs["project_id"]
        return (
            User.objects.filter(
                issue_collaborations__issue__project__project_id=project_id
            )
            .prefetch_related(
                Prefetch(
                    "issue_collaborations",
                    queryset=Collaborator.objects.filter(
                        issue__project__project_id=project_id
                    ).select_related("issue__project"),
                    to_attr="scoped_issue_collaborations",
                )
            )
            .distinct()
            .order_by("user_id")
        )


class UserCollaboratedProjectsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Project.objects.none()

    def list(self, request, *args, **kwargs):
        projects = (
            Project.objects.filter(
                issues__collaborators__user__user_id=self.kwargs["user_id"]
            )
            .select_related("user")
            .distinct()
        )
        page = self.paginate_queryset(projects)
        selected = page if page is not None else projects
        data = [
            {
                "project_id": project.project_id,
                "title": project.title,
                "owner_full_name": project.user.full_name,
                "owner_nu_email": project.user.nu_email,
            }
            for project in selected
        ]
        if page is not None:
            return self.get_paginated_response(data)
        return Response(data)


class UserProjectsListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return with_project_api_data(
            Project.objects.filter(user__user_id=self.kwargs["user_id"]),
            self.request.user,
        )


def _recommendation_queryset(user):
    queryset = (
        with_project_api_data(Project.objects.exclude(user=user), user)
        .annotate(
            engagement_score=ExpressionWrapper(
                F("likes_count") + F("comments_count"),
                output_field=IntegerField(),
            ),
            project_age=ExpressionWrapper(
                Now() - F("updated_at"),
                output_field=DurationField(),
            ),
        )
    )
    if connection.features.has_native_duration_field:
        return queryset.annotate(
            days_since_update=ExpressionWrapper(
                Extract("project_age", "epoch", output_field=FloatField())
                / Value(86400.0),
                output_field=FloatField(),
            )
        ).annotate(
            trending_score=ExpressionWrapper(
                F("engagement_score")
                / Greatest(F("days_since_update"), Value(1.0)),
                output_field=FloatField(),
            )
        )
    return queryset.annotate(
        days_since_update=Value(0.0, output_field=FloatField()),
        trending_score=Value(0.0, output_field=FloatField()),
    )


def _refresh_recommendation_scores(project):
    days_since_update = max(
        (timezone.now() - project.updated_at).total_seconds() / 86400.0,
        0.0,
    )
    project.days_since_update = days_since_update
    project.trending_score = project.engagement_score / max(days_since_update, 1.0)


class RecommendedProjectsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        params = RecommendedProjectsQuerySerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        mode = params.validated_data["mode"]
        limit = params.validated_data["limit"]
        offset = params.validated_data["offset"]
        queryset = _recommendation_queryset(request.user)

        if mode == RecommendedProjectsQuerySerializer.MODE_SPOTLIGHT:
            queryset = queryset.order_by(
                "-trending_score",
                "-engagement_score",
                "-updated_at",
                "project_id",
            )
        elif mode == RecommendedProjectsQuerySerializer.MODE_WITH_ISSUES:
            queryset = queryset.filter(open_issues__gt=0).order_by(
                "-open_issues",
                "-engagement_score",
                "-updated_at",
                "project_id",
            )
        elif mode == RecommendedProjectsQuerySerializer.MODE_WITHOUT_ISSUES:
            queryset = queryset.filter(open_issues=0).order_by(
                "-engagement_score",
                "-updated_at",
                "project_id",
            )
        elif mode == RecommendedProjectsQuerySerializer.MODE_SKILL_MATCH:
            user_skills = list(
                request.user.skills.annotate(normalized_skill=Lower("skill"))
                .values_list("normalized_skill", flat=True)
                .distinct()
            )
            if not user_skills:
                return Response(
                    {
                        "projects": [],
                        "mode": mode,
                        "limit": limit,
                        "offset": offset,
                        "total": 0,
                        "has_more": False,
                        "message": "Add skills to your profile to get personalised recommendations.",
                    }
                )

            matching_tags = (
                Tag.objects.filter(project_id=OuterRef("pk"))
                .annotate(normalized_tag=Lower("tag"))
                .filter(normalized_tag__in=user_skills)
                .values("project_id")
                .annotate(match_count=Count("pk"))
                .values("match_count")[:1]
            )
            queryset = (
                queryset.annotate(
                    skill_matches=Coalesce(
                        Subquery(matching_tags, output_field=IntegerField()),
                        Value(0),
                    )
                )
                .filter(skill_matches__gt=0)
                .order_by(
                    "-skill_matches",
                    "-engagement_score",
                    "-updated_at",
                    "project_id",
                )
            )
        else:
            collaborator_peer_ids = (
                Collaborator.objects.filter(
                    issue__collaborators__user_id=request.user.pk
                )
                .exclude(user_id=request.user.pk)
                .values("user_id")
            )
            like_peer_ids = (
                Like.objects.filter(project__likes__user_id=request.user.pk)
                .exclude(user_id=request.user.pk)
                .values("user_id")
            )
            queryset = queryset.filter(
                Q(user_id__in=Subquery(collaborator_peer_ids))
                | Q(user_id__in=Subquery(like_peer_ids))
            ).order_by(
                "-engagement_score",
                "-updated_at",
                "project_id",
            )

        total = queryset.count()
        if (
            mode == RecommendedProjectsQuerySerializer.MODE_SPOTLIGHT
            and not connection.features.has_native_duration_field
        ):
            candidate_limit = min(max((offset + limit) * 10, 100), 500)
            candidates = list(
                queryset.order_by(
                    "-engagement_score",
                    "-updated_at",
                    "project_id",
                )[:candidate_limit]
            )
            for project in candidates:
                _refresh_recommendation_scores(project)
            selected_projects = sorted(
                candidates,
                key=lambda project: (
                    -project.trending_score,
                    -project.engagement_score,
                    -project.updated_at.timestamp(),
                    project.project_id,
                ),
            )[offset : offset + limit]
        else:
            selected_projects = list(queryset[offset : offset + limit])
            for project in selected_projects:
                _refresh_recommendation_scores(project)
        projects = ProjectSerializer(
            selected_projects,
            many=True,
            context={"request": request},
        ).data
        for project_data, project in zip(projects, selected_projects):
            project_data.update(
                {
                    "open_issues": project.open_issues,
                    "closed_issues": project.closed_issues,
                    "engagement_score": project.engagement_score,
                    "trending_score": float(project.trending_score or 0),
                    "days_since_update": float(project.days_since_update or 0),
                }
            )
            if hasattr(project, "skill_matches"):
                project_data["skill_matches"] = project.skill_matches
        return Response(
            {
                "projects": projects,
                "mode": mode,
                "limit": limit,
                "offset": offset,
                "total": total,
                "has_more": offset + len(projects) < total,
            }
        )


class TopContributorsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        params = TopContributorsQuerySerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        limit = params.validated_data["limit"]
        contributors = (
            User.objects.annotate(
                projects_created=Count("projects", distinct=True),
                issues_collaborated=Count(
                    "issue_collaborations__issue",
                    distinct=True,
                ),
                comments_made=Count("comments", distinct=True),
            )
            .annotate(
                activity_score=ExpressionWrapper(
                    F("projects_created") * Value(3)
                    + F("issues_collaborated") * Value(2)
                    + F("comments_made"),
                    output_field=IntegerField(),
                )
            )
            .annotate(
                rank=Window(
                    expression=Rank(),
                    order_by=F("activity_score").desc(),
                )
            )
            .order_by("rank", "user_id")[:limit]
        )
        return Response(
            [
                {
                    "user_id": user.user_id,
                    "full_name": user.full_name,
                    "nu_email": user.nu_email,
                    "avatar_url": user.avatar_url,
                    "projects_created": user.projects_created,
                    "issues_collaborated": user.issues_collaborated,
                    "comments_made": user.comments_made,
                    "activity_score": user.activity_score,
                    "rank": user.rank,
                }
                for user in contributors
            ]
        )


class UserActivityStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id=None):
        target_user_id = request.user.user_id if user_id is None else user_id
        user = (
            User.objects.filter(user_id=target_user_id)
            .annotate(
                projects_created=Count("projects", distinct=True),
                issues_collaborated=Count(
                    "issue_collaborations__issue",
                    distinct=True,
                ),
                projects_collaborated=Count(
                    "issue_collaborations__issue__project",
                    distinct=True,
                ),
                likes_given=Count("likes", distinct=True),
                comments_made=Count("comments", distinct=True),
                skill_count=Count("skills", distinct=True),
            )
            .annotate(
                activity_score=ExpressionWrapper(
                    F("projects_created") * Value(3)
                    + F("issues_collaborated") * Value(2)
                    + F("comments_made"),
                    output_field=IntegerField(),
                )
            )
            .first()
        )
        if user is None:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            {
                "user_id": user.user_id,
                "full_name": user.full_name,
                "nu_email": user.nu_email,
                "avatar_url": user.avatar_url,
                "bio": user.bio,
                "github_username": user.github_username,
                "is_github_connected": user.is_github_connected,
                "member_since": user.created_at,
                "projects_created": user.projects_created,
                "issues_collaborated": user.issues_collaborated,
                "projects_collaborated": user.projects_collaborated,
                "likes_given": user.likes_given,
                "comments_made": user.comments_made,
                "skill_count": user.skill_count,
                "activity_score": user.activity_score,
            }
        )


class RecentActivityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        params = RecentActivityQuerySerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        limit = params.validated_data["limit"]
        projects = Project.objects.order_by().annotate(
            activity_type=Value("project", output_field=CharField()),
            entity_id=F("project_id"),
            entity_title=F("title"),
            actor_id=F("user_id"),
            full_name=F("user__full_name"),
            avatar_url=F("user__avatar_url"),
            activity_date=F("created_at"),
        ).values(
            "activity_type",
            "entity_id",
            "entity_title",
            "actor_id",
            "full_name",
            "avatar_url",
            "activity_date",
        )
        comments = Comment.objects.order_by().annotate(
            activity_type=Value("comment", output_field=CharField()),
            entity_id=F("comment_id"),
            entity_title=F("project__title"),
            actor_id=F("user_id"),
            full_name=F("user__full_name"),
            avatar_url=F("user__avatar_url"),
            activity_date=F("created_at"),
        ).values(
            "activity_type",
            "entity_id",
            "entity_title",
            "actor_id",
            "full_name",
            "avatar_url",
            "activity_date",
        )
        activities = projects.union(comments, all=True).order_by(
            "-activity_date",
            "activity_type",
            "-entity_id",
        )[:limit]
        return Response(
            [
                {
                    "activity_type": activity["activity_type"],
                    "entity_id": activity["entity_id"],
                    "entity_title": activity["entity_title"],
                    "user_id": activity["actor_id"],
                    "full_name": activity["full_name"],
                    "avatar_url": activity["avatar_url"],
                    "activity_date": activity["activity_date"],
                }
                for activity in activities
            ]
        )
