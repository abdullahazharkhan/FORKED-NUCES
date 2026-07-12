from rest_framework import serializers
from django.db import transaction

from drf_backend.fields import EarlyBoundedListField
from .limits import MAX_ISSUES_PER_PROJECT
from .models import CollaborationRequest, Project, Tag, Issue, Collaborator
from accounts.models import User


MAX_ISSUE_DESCRIPTION_LENGTH = 10_000
MAX_PROJECT_DESCRIPTION_LENGTH = 10_000
MAX_CLOSE_COLLABORATORS = 50
MAX_PROJECT_TAGS = 25


class TagSerializer(serializers.ModelSerializer):
	class Meta:
		model = Tag
		fields = ["tag"]


class IssueSerializer(serializers.ModelSerializer):
	class Meta:
		model = Issue
		fields = [
			"issue_id",
			"status",
			"title",
			"description",
			"created_at",
			"updated_at",
		]
		read_only_fields = ["issue_id", "created_at", "updated_at"]


class ProjectSerializer(serializers.ModelSerializer):
	tags = TagSerializer(many=True, read_only=True)
	owner_user_id = serializers.IntegerField(source="user.user_id", read_only=True)
	owner_full_name = serializers.CharField(source="user.full_name", read_only=True)
	owner_nu_email = serializers.EmailField(source="user.nu_email", read_only=True)
	owner_avatar_url = serializers.URLField(source="user.avatar_url", read_only=True)
	likes_count = serializers.IntegerField(read_only=True, default=0)
	comments_count = serializers.IntegerField(read_only=True, default=0)
	user_has_liked = serializers.BooleanField(read_only=True, default=False)
	user_has_collaborated = serializers.BooleanField(read_only=True, default=False)
	user_has_commented = serializers.BooleanField(read_only=True, default=False)
	issues_count = serializers.IntegerField(read_only=True, default=0)
	open_issues = serializers.IntegerField(read_only=True, default=0)
	closed_issues = serializers.IntegerField(read_only=True, default=0)

	class Meta:
		model = Project
		fields = [
			"project_id",
			"title",
			"description",
			"github_url",
			"created_at",
			"updated_at",
			"tags",
			"issues_count",
			"open_issues",
			"closed_issues",
			"owner_user_id",
			"owner_full_name",
			"owner_nu_email",
			"owner_avatar_url",
			"likes_count",
			"comments_count",
			"user_has_liked",
			"user_has_collaborated",
			"user_has_commented",
		]
		read_only_fields = [
			"project_id",
			"created_at",
			"updated_at",
			"tags",
			"issues_count",
			"open_issues",
			"closed_issues",
			"owner_user_id",
			"owner_full_name",
			"owner_nu_email",
			"owner_avatar_url",
			"likes_count",
			"comments_count",
			"user_has_liked",
			"user_has_collaborated",
			"user_has_commented",
		]


class ProjectDetailSerializer(ProjectSerializer):
	issues = IssueSerializer(source="bounded_issues", many=True, read_only=True)

	class Meta(ProjectSerializer.Meta):
		fields = [*ProjectSerializer.Meta.fields, "issues"]
		read_only_fields = [*ProjectSerializer.Meta.read_only_fields, "issues"]

class ProjectCreateSerializer(serializers.ModelSerializer):
	description = serializers.CharField(max_length=MAX_PROJECT_DESCRIPTION_LENGTH)
	tags = EarlyBoundedListField(
		child=serializers.CharField(max_length=100),
		allow_empty=True,
		write_only=True,
		required=False,
		max_length=MAX_PROJECT_TAGS,
	)

	class Meta:
		model = Project
		fields = ["title", "description", "github_url", "tags"]

	@transaction.atomic
	def create(self, validated_data):
		tag_list = validated_data.pop("tags", [])
		user = self.context["request"].user
		project = Project.objects.create(user=user, **validated_data)

		unique_tags = set([t.strip() for t in tag_list if t.strip()])
		Tag.objects.bulk_create(
			[Tag(project=project, tag=tag) for tag in unique_tags],
			ignore_conflicts=True,
		)
		return project


class ProjectUpdateSerializer(serializers.ModelSerializer):
	description = serializers.CharField(max_length=MAX_PROJECT_DESCRIPTION_LENGTH)
	tags = EarlyBoundedListField(
		child=serializers.CharField(max_length=100),
		allow_empty=True,
		write_only=True,
		required=False,
		max_length=MAX_PROJECT_TAGS,
	)

	class Meta:
		model = Project
		fields = ["title", "description", "github_url", "tags"]

	@transaction.atomic
	def update(self, instance, validated_data):
		tag_list = validated_data.pop("tags", None)

		for attr, value in validated_data.items():
			setattr(instance, attr, value)
		instance.save()

		if tag_list is not None:
			Tag.objects.filter(project=instance).delete()
			unique_tags = set([t.strip() for t in tag_list if t.strip()])
			Tag.objects.bulk_create(
				[Tag(project=instance, tag=tag) for tag in unique_tags],
				ignore_conflicts=True,
			)

		return instance


class IssueCreateSerializer(serializers.ModelSerializer):
	project_id = serializers.IntegerField(write_only=True)
	description = serializers.CharField(max_length=MAX_ISSUE_DESCRIPTION_LENGTH)

	class Meta:
		model = Issue
		fields = ["project_id", "title", "description"]

	def validate_project_id(self, value):
		request = self.context["request"]
		try:
			project = Project.objects.get(project_id=value, user=request.user)
		except Project.DoesNotExist:
			raise serializers.ValidationError("Project does not exist or is not owned by the user.")
		self.context["project"] = project
		return value

	@transaction.atomic
	def create(self, validated_data):
		project_id = validated_data.pop("project_id")
		request = self.context["request"]
		try:
			project = Project.objects.select_for_update().get(
				project_id=project_id,
				user=request.user,
			)
		except Project.DoesNotExist:
			raise serializers.ValidationError(
				{"project_id": "Project does not exist or is not owned by the user."}
			)

		if Issue.objects.filter(project=project).count() >= MAX_ISSUES_PER_PROJECT:
			raise serializers.ValidationError(
				{
					"project_id": (
						f"A project can contain at most {MAX_ISSUES_PER_PROJECT} issues."
					)
				}
			)
		return Issue.objects.create(project=project, **validated_data)


class IssueUpdateSerializer(serializers.ModelSerializer):
	description = serializers.CharField(max_length=MAX_ISSUE_DESCRIPTION_LENGTH)

	class Meta:
		model = Issue
		fields = ["title", "description"]


class CloseIssueInputSerializer(serializers.Serializer):
	issue_id = serializers.IntegerField(min_value=1)
	user_id = serializers.IntegerField(min_value=1, required=False)
	user_ids = EarlyBoundedListField(
		child=serializers.IntegerField(min_value=1),
		required=False,
		allow_empty=True,
		max_length=MAX_CLOSE_COLLABORATORS,
	)

	def validate(self, attrs):
		user_ids = attrs.get("user_ids")
		user_id = attrs.get("user_id")
		if user_ids is None:
			if user_id is not None:
				attrs["user_ids"] = [user_id]
			else:
				attrs["user_ids"] = []
		return attrs


class CollaborationRequestCreateSerializer(serializers.Serializer):
	user_id = serializers.IntegerField(min_value=1, required=False)
	message = serializers.CharField(
		max_length=1000,
		required=False,
		allow_blank=True,
		trim_whitespace=True,
		default="",
	)


class CollaborationRequestActionSerializer(serializers.Serializer):
	action = serializers.ChoiceField(
		choices=("accept", "reject", "withdraw", "cancel")
	)


class CollaborationRequestSerializer(serializers.ModelSerializer):
	issue_id = serializers.IntegerField(source="issue.issue_id", read_only=True)
	issue_title = serializers.CharField(source="issue.title", read_only=True)
	project_id = serializers.IntegerField(
		source="issue.project.project_id",
		read_only=True,
	)
	project_title = serializers.CharField(
		source="issue.project.title",
		read_only=True,
	)
	project_owner_id = serializers.IntegerField(
		source="issue.project.user_id",
		read_only=True,
	)
	user_id = serializers.IntegerField(source="user.user_id", read_only=True)
	user_full_name = serializers.CharField(source="user.full_name", read_only=True)
	user_nu_email = serializers.EmailField(source="user.nu_email", read_only=True)
	user_avatar_url = serializers.URLField(source="user.avatar_url", read_only=True)
	created_by_user_id = serializers.IntegerField(
		source="created_by.user_id",
		read_only=True,
	)
	resolved_by_user_id = serializers.IntegerField(
		source="resolved_by.user_id",
		read_only=True,
		allow_null=True,
	)

	class Meta:
		model = CollaborationRequest
		fields = [
			"request_id",
			"issue_id",
			"issue_title",
			"project_id",
			"project_title",
			"project_owner_id",
			"user_id",
			"user_full_name",
			"user_nu_email",
			"user_avatar_url",
			"created_by_user_id",
			"resolved_by_user_id",
			"kind",
			"status",
			"message",
			"created_at",
			"updated_at",
			"responded_at",
		]
		read_only_fields = fields


class ProjectListQuerySerializer(serializers.Serializer):
	ISSUE_STATUS_ALL = "all"
	ISSUE_STATUS_OPEN = "open"
	ISSUE_STATUS_CLOSED = "closed"
	ISSUE_STATUS_WITHOUT_OPEN = "without-open"

	ORDER_NEWEST = "newest"
	ORDER_OLDEST = "oldest"
	ORDER_UPDATED = "updated"
	ORDER_POPULAR = "popular"
	ORDER_DISCUSSED = "discussed"
	ORDER_NEEDS_HELP = "needs-help"

	search = serializers.CharField(
		max_length=120,
		required=False,
		allow_blank=True,
		trim_whitespace=True,
		default="",
	)
	tag = serializers.CharField(
		max_length=100,
		required=False,
		allow_blank=True,
		trim_whitespace=True,
		default="",
	)
	issue_status = serializers.ChoiceField(
		choices=(
			ISSUE_STATUS_ALL,
			ISSUE_STATUS_OPEN,
			ISSUE_STATUS_CLOSED,
			ISSUE_STATUS_WITHOUT_OPEN,
		),
		default=ISSUE_STATUS_ALL,
	)
	ordering = serializers.ChoiceField(
		choices=(
			ORDER_NEWEST,
			ORDER_OLDEST,
			ORDER_UPDATED,
			ORDER_POPULAR,
			ORDER_DISCUSSED,
			ORDER_NEEDS_HELP,
		),
		default=ORDER_NEWEST,
	)


class RecommendedProjectsQuerySerializer(serializers.Serializer):
	MODE_SPOTLIGHT = "spotlight"
	MODE_WITH_ISSUES = "with-issues"
	MODE_WITHOUT_ISSUES = "without-issues"
	MODE_SKILL_MATCH = "skill-match"
	MODE_NETWORK = "network"

	mode = serializers.ChoiceField(
		choices=(
			MODE_SPOTLIGHT,
			MODE_WITH_ISSUES,
			MODE_WITHOUT_ISSUES,
			MODE_SKILL_MATCH,
			MODE_NETWORK,
		),
		default=MODE_SPOTLIGHT,
	)
	limit = serializers.IntegerField(min_value=1, max_value=50, default=20)
	offset = serializers.IntegerField(min_value=0, max_value=10000, default=0)


class TopContributorsQuerySerializer(serializers.Serializer):
	limit = serializers.IntegerField(min_value=1, max_value=50, default=10)


class RecentActivityQuerySerializer(serializers.Serializer):
	limit = serializers.IntegerField(min_value=1, max_value=100, default=20)


class CollaboratorUserIssueSerializer(serializers.ModelSerializer):
	issues = serializers.SerializerMethodField()

	class Meta:
		model = User
		fields = ["user_id", "full_name", "nu_email", "avatar_url", "issues"]

	def get_issues(self, obj):
		prefetched_collaborations = getattr(obj, "scoped_issue_collaborations", None)
		if prefetched_collaborations is not None:
			issues = [collaboration.issue for collaboration in prefetched_collaborations]
		else:
			# Used by the global collaborator view, where all collaborated issues
			# are intentionally returned.
			issues = (
				Issue.objects.filter(collaborators__user=obj)
				.select_related("project")
				.distinct()
			)
		return [
			{
				"issue_id": issue.issue_id,
				"title": issue.title,
				"status": issue.status,
				"project_id": issue.project.project_id,
				"project_title": issue.project.title,
			}
			for issue in issues
		]


class IssueWithCollaboratorsSerializer(serializers.ModelSerializer):
	collaborators = serializers.SerializerMethodField()

	class Meta:
		model = Issue
		fields = [
			"issue_id",
			"status",
			"title",
			"description",
			"created_at",
			"updated_at",
			"collaborators",
		]

	def get_collaborators(self, obj):
		prefetched_collaborations = getattr(
			obj,
			"prefetched_collaborations",
			None,
		)
		if prefetched_collaborations is not None:
			users = [
				collaboration.user for collaboration in prefetched_collaborations
			]
		else:
			users = (
				User.objects.filter(issue_collaborations__issue=obj)
				.distinct()
			)
		return [
			{
				"user_id": user.user_id,
				"full_name": user.full_name,
				"nu_email": user.nu_email,
				"avatar_url": user.avatar_url,
			}
			for user in users
		]


