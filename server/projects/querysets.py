from django.db.models import BooleanField, Count, Exists, OuterRef, Prefetch, Q, Value

from interactions.models import Comment, Like

from .limits import MAX_ISSUES_PER_PROJECT
from .models import Collaborator, Issue


def with_project_metrics(queryset):
    """Add the aggregate fields shared by project APIs and recommendations."""

    return queryset.annotate(
        likes_count=Count("likes", distinct=True),
        comments_count=Count("comments", distinct=True),
        open_issues=Count(
            "issues",
            filter=Q(issues__status="open"),
            distinct=True,
        ),
        closed_issues=Count(
            "issues",
            filter=Q(issues__status="closed"),
            distinct=True,
        ),
        issues_count=Count("issues", distinct=True),
    )


def with_project_api_data(queryset, user=None, *, include_issue_details=False):
    """Load project API data with a hard bound on nested issue details."""

    prefetches = ["tags"]
    if include_issue_details:
        prefetches.append(
            Prefetch(
                "issues",
                queryset=Issue.objects.order_by("-created_at", "-issue_id")[
                    :MAX_ISSUES_PER_PROJECT
                ],
                to_attr="bounded_issues",
            )
        )

    queryset = (
        with_project_metrics(queryset)
        .select_related("user")
        .prefetch_related(*prefetches)
    )

    if user is not None and getattr(user, "is_authenticated", False):
        return queryset.annotate(
            user_has_liked=Exists(
                Like.objects.filter(project_id=OuterRef("pk"), user_id=user.pk)
            ),
            user_has_collaborated=Exists(
                Collaborator.objects.filter(
                    issue__project_id=OuterRef("pk"),
                    user_id=user.pk,
                )
            ),
            user_has_commented=Exists(
                Comment.objects.filter(project_id=OuterRef("pk"), user_id=user.pk)
            ),
        )

    return queryset.annotate(
        user_has_liked=Value(False, output_field=BooleanField()),
        user_has_collaborated=Value(False, output_field=BooleanField()),
        user_has_commented=Value(False, output_field=BooleanField()),
    )
