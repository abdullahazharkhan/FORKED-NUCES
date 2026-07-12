import json
from itertools import chain

from django.db.models import Q
from django.db.models.functions import Lower
from django.utils import timezone
from rest_framework.utils.encoders import JSONEncoder

from interactions.models import Comment, Like
from moderation.models import Report
from notifications.models import Notification
from projects.models import Collaborator, CollaborationRequest, Issue, Project, Tag


EXPORT_SCHEMA_VERSION = 1
EXPORT_ITERATOR_CHUNK_SIZE = 200
_END = object()


def _encode_json(value):
    return json.dumps(
        value,
        cls=JSONEncoder,
        ensure_ascii=False,
        separators=(",", ":"),
    )


def _stream_json_array(values):
    yield "["
    first = True
    for value in values:
        if not first:
            yield ","
        yield _encode_json(value)
        first = False
    yield "]"


class _GroupedRows:
    """Consume rows ordered in the same parent order without retaining a group."""

    def __init__(self, rows):
        self._rows = iter(rows)
        self._current = next(self._rows, _END)

    def take(self, project_order_key):
        while self._current is not _END:
            current_order_key = (
                self._current["project__created_at"],
                self._current["project_id"],
            )
            if current_order_key < project_order_key:
                self._current = next(self._rows, _END)
                continue
            if current_order_key > project_order_key:
                break
            current = self._current
            self._current = next(self._rows, _END)
            yield current


def _safe_report_snapshot(target_type, target_snapshot):
    allowed_fields = {
        Report.TARGET_USER: ("label", "full_name", "nu_email"),
        Report.TARGET_PROJECT: ("label", "title", "owner_id"),
        Report.TARGET_ISSUE: ("label", "title", "project_id", "owner_id"),
        Report.TARGET_COMMENT: (
            "label",
            "project_id",
            "author_id",
            "comment_body",
        ),
    }
    snapshot = target_snapshot or {}
    return {
        key: snapshot[key]
        for key in allowed_fields.get(target_type, ())
        if key in snapshot
    }


def _stream_owned_projects(user):
    projects = iter(
        Project.objects.filter(user=user)
        .order_by("created_at", "project_id")
        .values(
            "project_id",
            "title",
            "description",
            "github_url",
            "created_at",
            "updated_at",
        )
        .iterator(chunk_size=EXPORT_ITERATOR_CHUNK_SIZE)
    )
    first_project = next(projects, _END)

    yield "["
    if first_project is _END:
        yield "]"
        return

    tags = _GroupedRows(
        Tag.objects.filter(project__user=user)
        .order_by("project__created_at", "project_id", Lower("tag"), "pk")
        .values("project__created_at", "project_id", "tag")
        .iterator(chunk_size=EXPORT_ITERATOR_CHUNK_SIZE)
    )
    issues = _GroupedRows(
        Issue.objects.filter(project__user=user)
        .order_by("project__created_at", "project_id", "created_at", "issue_id")
        .values(
            "project__created_at",
            "project_id",
            "issue_id",
            "status",
            "title",
            "description",
            "created_at",
            "updated_at",
        )
        .iterator(chunk_size=EXPORT_ITERATOR_CHUNK_SIZE)
    )

    is_first = True
    for project in chain((first_project,), projects):
        project_order_key = (project["created_at"], project["project_id"])
        if not is_first:
            yield ","
        project_header = {
            "project_id": project["project_id"],
            "title": project["title"],
            "description": project["description"],
            "github_url": project["github_url"],
            "created_at": project["created_at"],
            "updated_at": project["updated_at"],
        }
        yield _encode_json(project_header)[:-1]
        yield ',"tags":'
        yield from _stream_json_array(
            tag["tag"] for tag in tags.take(project_order_key)
        )
        yield ',"issues":'
        yield from _stream_json_array(
            {
                "issue_id": issue["issue_id"],
                "status": issue["status"],
                "title": issue["title"],
                "description": issue["description"],
                "created_at": issue["created_at"],
                "updated_at": issue["updated_at"],
            }
            for issue in issues.take(project_order_key)
        )
        yield "}"
        is_first = False
    yield "]"


def _collaboration_requests(user):
    rows = (
        CollaborationRequest.objects.filter(
            Q(user=user)
            | Q(created_by=user)
            | Q(resolved_by=user)
            | Q(issue__project__user=user)
        )
        .distinct()
        .order_by("created_at", "request_id")
        .values(
            "request_id",
            "issue_id",
            "issue__title",
            "issue__project_id",
            "issue__project__title",
            "issue__project__user_id",
            "user_id",
            "created_by_id",
            "resolved_by_id",
            "kind",
            "status",
            "message",
            "created_at",
            "updated_at",
            "responded_at",
        )
        .iterator(chunk_size=EXPORT_ITERATOR_CHUNK_SIZE)
    )
    for row in rows:
        roles = []
        if row["user_id"] == user.pk:
            roles.append("candidate")
        if row["created_by_id"] == user.pk:
            roles.append("creator")
        if row["resolved_by_id"] == user.pk:
            roles.append("resolver")
        if row["issue__project__user_id"] == user.pk:
            roles.append("project_owner")
        yield {
            "request_id": row["request_id"],
            "issue_id": row["issue_id"],
            "issue_title": row["issue__title"],
            "project_id": row["issue__project_id"],
            "project_title": row["issue__project__title"],
            "candidate_user_id": row["user_id"],
            "created_by_user_id": row["created_by_id"],
            "resolved_by_user_id": row["resolved_by_id"],
            "roles": roles,
            "kind": row["kind"],
            "status": row["status"],
            "message": row["message"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "responded_at": row["responded_at"],
        }


def _collaboration_credits(user):
    rows = (
        Collaborator.objects.filter(user=user)
        .order_by("issue__project_id", "issue_id", "pk")
        .values(
            "pk",
            "issue_id",
            "issue__title",
            "issue__status",
            "issue__project_id",
            "issue__project__title",
        )
        .iterator(chunk_size=EXPORT_ITERATOR_CHUNK_SIZE)
    )
    for row in rows:
        yield {
            "credit_id": row["pk"],
            "issue_id": row["issue_id"],
            "issue_title": row["issue__title"],
            "issue_status": row["issue__status"],
            "project_id": row["issue__project_id"],
            "project_title": row["issue__project__title"],
        }


def _comments(user):
    rows = (
        Comment.objects.filter(user=user)
        .order_by("created_at", "comment_id")
        .values(
            "comment_id",
            "project_id",
            "project__title",
            "comment_body",
            "created_at",
        )
        .iterator(chunk_size=EXPORT_ITERATOR_CHUNK_SIZE)
    )
    for row in rows:
        yield {
            "comment_id": row["comment_id"],
            "project_id": row["project_id"],
            "project_title": row["project__title"],
            "comment_body": row["comment_body"],
            "created_at": row["created_at"],
        }


def _likes(user):
    rows = (
        Like.objects.filter(user=user)
        .order_by("like_id")
        .values("like_id", "project_id", "project__title")
        .iterator(chunk_size=EXPORT_ITERATOR_CHUNK_SIZE)
    )
    for row in rows:
        yield {
            "like_id": row["like_id"],
            "project_id": row["project_id"],
            "project_title": row["project__title"],
        }


def _notifications(user):
    rows = (
        Notification.objects.filter(recipient=user)
        .order_by("created_at", "notification_id")
        .values(
            "notification_id",
            "event_type",
            "message",
            "url_path",
            "actor_id",
            "actor__full_name",
            "read_at",
            "created_at",
        )
        .iterator(chunk_size=EXPORT_ITERATOR_CHUNK_SIZE)
    )
    for row in rows:
        yield {
            "notification_id": row["notification_id"],
            "event_type": row["event_type"],
            "message": row["message"],
            "url_path": row["url_path"],
            "actor_user_id": row["actor_id"],
            "actor_full_name": row["actor__full_name"],
            "read_at": row["read_at"],
            "created_at": row["created_at"],
        }


def _reports(user):
    rows = (
        Report.objects.filter(reporter=user)
        .order_by("created_at", "report_id")
        .values(
            "report_id",
            "target_type",
            "target_id",
            "target_snapshot",
            "reason",
            "details",
            "status",
            "resolution_notes",
            "created_at",
            "updated_at",
            "resolved_at",
        )
        .iterator(chunk_size=EXPORT_ITERATOR_CHUNK_SIZE)
    )
    for row in rows:
        yield {
            "report_id": row["report_id"],
            "target_type": row["target_type"],
            "target_id": row["target_id"],
            "target_snapshot": _safe_report_snapshot(
                row["target_type"],
                row["target_snapshot"],
            ),
            "reason": row["reason"],
            "details": row["details"],
            "status": row["status"],
            "resolution_notes": row["resolution_notes"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "resolved_at": row["resolved_at"],
        }


def _stream_user_data_export(user, exported_at):
    account = {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "nu_email": user.nu_email,
        "github_username": user.github_username,
        "is_github_connected": user.is_github_connected,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "is_active": user.is_active,
        "is_email_verified": user.is_email_verified,
        "last_login": user.last_login,
        "password_changed_at": user.password_changed_at,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }
    skills = (
        user.skills.order_by(Lower("skill"), "pk")
        .values_list("skill", flat=True)
        .iterator(chunk_size=EXPORT_ITERATOR_CHUNK_SIZE)
    )

    yield "{"
    yield f'"schema_version":{_encode_json(EXPORT_SCHEMA_VERSION)}'
    yield f',"exported_at":{_encode_json(exported_at)}'
    yield f',"account":{_encode_json(account)}'
    yield ',"skills":'
    yield from _stream_json_array(skills)
    yield ',"owned_projects":'
    yield from _stream_owned_projects(user)
    yield ',"collaboration_requests":'
    yield from _stream_json_array(_collaboration_requests(user))
    yield ',"collaboration_credits":'
    yield from _stream_json_array(_collaboration_credits(user))
    yield ',"comments":'
    yield from _stream_json_array(_comments(user))
    yield ',"likes":'
    yield from _stream_json_array(_likes(user))
    yield ',"notifications":'
    yield from _stream_json_array(_notifications(user))
    yield ',"reports":'
    yield from _stream_json_array(_reports(user))
    yield "}"


def stream_user_data_export(user):
    """Return a bounded-memory iterator for the explicit, secret-free export."""
    return _stream_user_data_export(user, timezone.now())
