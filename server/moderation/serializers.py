from django.contrib.auth import get_user_model
from rest_framework import serializers

from interactions.models import Comment
from projects.models import Issue, Project
from .models import Report


User = get_user_model()


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["target_type", "target_id", "reason", "details"]
        extra_kwargs = {
            "details": {
                "required": False,
                "allow_blank": True,
                "max_length": 2000,
                "trim_whitespace": True,
            }
        }

    def validate(self, attrs):
        target_type = attrs["target_type"]
        target_id = attrs["target_id"]
        model_map = {
            Report.TARGET_USER: (User, "user_id"),
            Report.TARGET_PROJECT: (Project, "project_id"),
            Report.TARGET_ISSUE: (Issue, "issue_id"),
            Report.TARGET_COMMENT: (Comment, "comment_id"),
        }
        model, id_field = model_map[target_type]
        target = model.objects.filter(**{id_field: target_id}).first()
        if target is None:
            raise serializers.ValidationError(
                {"target_id": ["The reported resource does not exist."]}
            )

        reporter = self.context["request"].user
        if target_type == Report.TARGET_USER and target.pk == reporter.pk:
            raise serializers.ValidationError(
                {"target_id": ["You cannot report your own account."]}
            )

        snapshot = {"label": str(target)}
        owner_id = None
        if target_type == Report.TARGET_USER:
            owner_id = target.user_id
            snapshot.update(
                {"full_name": target.full_name, "nu_email": target.nu_email}
            )
        elif target_type == Report.TARGET_PROJECT:
            owner_id = target.user_id
            snapshot.update({"title": target.title, "owner_id": owner_id})
        elif target_type == Report.TARGET_ISSUE:
            owner_id = target.project.user_id
            snapshot.update(
                {
                    "title": target.title,
                    "project_id": target.project_id,
                    "owner_id": owner_id,
                }
            )
        else:
            owner_id = target.user_id
            snapshot.update(
                {
                    "project_id": target.project_id,
                    "author_id": owner_id,
                    "comment_body": target.comment_body[:500],
                }
            )
        if owner_id == reporter.user_id:
            raise serializers.ValidationError(
                {"target_id": ["You cannot report your own content."]}
            )
        if attrs["reason"] == Report.REASON_OTHER and not attrs.get(
            "details", ""
        ).strip():
            raise serializers.ValidationError(
                {"details": ["Please describe the concern when selecting Other."]}
            )
        attrs["target_snapshot"] = snapshot
        return attrs

    def create(self, validated_data):
        return Report.objects.create(
            reporter=self.context["request"].user,
            **validated_data,
        )


class ReportSerializer(serializers.ModelSerializer):
    reporter_user_id = serializers.IntegerField(
        source="reporter.user_id",
        read_only=True,
        allow_null=True,
    )
    reporter_nu_email = serializers.EmailField(
        source="reporter.nu_email",
        read_only=True,
        allow_null=True,
    )
    assigned_to_user_id = serializers.IntegerField(
        source="assigned_to.user_id",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Report
        fields = [
            "report_id",
            "reporter_user_id",
            "reporter_nu_email",
            "target_type",
            "target_id",
            "target_snapshot",
            "reason",
            "details",
            "status",
            "assigned_to_user_id",
            "resolution_notes",
            "created_at",
            "updated_at",
            "resolved_at",
        ]
        read_only_fields = fields


class ReportReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=(
            Report.STATUS_REVIEWING,
            Report.STATUS_ACTIONED,
            Report.STATUS_DISMISSED,
        )
    )
    resolution_notes = serializers.CharField(
        max_length=4000,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
        default="",
    )
