from rest_framework import serializers

from .models import Comment


class CommentCreateSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Comment
        fields = ["project_id", "comment_body"]

    def validate_project_id(self, value):
        from projects.models import Project

        try:
            project = Project.objects.get(project_id=value)
        except Project.DoesNotExist:
            raise serializers.ValidationError("Project does not exist.")
        self.context["project"] = project
        return value

    def create(self, validated_data):
        request = self.context["request"]
        project = self.context["project"]
        validated_data.pop("project_id", None)
        return Comment.objects.create(
            user=request.user,
            project=project,
            **validated_data,
        )


class CommentSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source="user.full_name", read_only=True)
    user_nu_email = serializers.EmailField(source="user.nu_email", read_only=True)

    class Meta:
        model = Comment
        fields = [
            "comment_id",
            "comment_body",
            "created_at",
            "user_full_name",
            "user_nu_email",
        ]
