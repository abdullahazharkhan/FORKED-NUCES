from rest_framework import serializers

from .models import Project, Tag, Issue


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
		]
		read_only_fields = ["project_id", "created_at", "updated_at", "tags", "issues"]


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

