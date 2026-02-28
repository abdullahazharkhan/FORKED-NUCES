from rest_framework import serializers
from django.db import transaction

from .models import Project, Tag, Issue, Collaborator
from accounts.models import User
from interactions.models import Comment


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
	issues = IssueSerializer(many=True, read_only=True)
	owner_user_id = serializers.IntegerField(source="user.user_id", read_only=True)
	owner_full_name = serializers.CharField(source="user.full_name", read_only=True)
	owner_nu_email = serializers.EmailField(source="user.nu_email", read_only=True)
	likes_count = serializers.IntegerField(source="likes.count", read_only=True)
	user_has_liked = serializers.SerializerMethodField()
	user_has_collaborated = serializers.SerializerMethodField()
	user_has_commented = serializers.SerializerMethodField()

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
			"issues",
			"owner_user_id",
			"owner_full_name",
			"owner_nu_email",
			"likes_count",
			"user_has_liked",
			"user_has_collaborated",
			"user_has_commented",
		]
		read_only_fields = [
			"project_id",
			"created_at",
			"updated_at",
			"tags",
			"issues",
			"owner_user_id",
			"owner_full_name",
			"owner_nu_email",
			"likes_count",
			"user_has_liked",
			"user_has_collaborated",
			"user_has_commented",
		]

	def get_user_has_liked(self, obj):
		request = self.context.get("request")
		user = getattr(request, "user", None)
		if not user or not user.is_authenticated:
			return False
		return obj.likes.filter(user=user).exists()

	def get_user_has_collaborated(self, obj):
		request = self.context.get("request")
		user = getattr(request, "user", None)
		if not user or not user.is_authenticated:
			return False
		# Check if user is a collaborator on any issue in this project
		return Collaborator.objects.filter(issue__project=obj, user=user).exists()

	def get_user_has_commented(self, obj):
		request = self.context.get("request")
		user = getattr(request, "user", None)
		if not user or not user.is_authenticated:
			return False
		# Check if user has commented on this project
		return Comment.objects.filter(project=obj, user=user).exists()


class ProjectCreateSerializer(serializers.ModelSerializer):
	tags = serializers.ListField(
		child=serializers.CharField(max_length=100),
		allow_empty=True,
		write_only=True,
		required=False,
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
	tags = serializers.ListField(
		child=serializers.CharField(max_length=100),
		allow_empty=True,
		write_only=True,
		required=False,
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

	def create(self, validated_data):
		validated_data.pop("project_id")
		project = self.context["project"]
		return Issue.objects.create(project=project, **validated_data)


class IssueUpdateSerializer(serializers.ModelSerializer):
	class Meta:
		model = Issue
		fields = ["title", "description"]


class CloseIssueInputSerializer(serializers.Serializer):
	issue_id = serializers.IntegerField()
	user_id = serializers.IntegerField(required=False)
	user_ids = serializers.ListField(
		child=serializers.IntegerField(), required=False, allow_empty=True
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


class CollaboratorUserIssueSerializer(serializers.ModelSerializer):
	issues = serializers.SerializerMethodField()

	class Meta:
		model = User
		fields = ["user_id", "full_name", "nu_email", "avatar_url", "issues"]

	def get_issues(self, obj):
		# All issues this user has collaborated on
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


