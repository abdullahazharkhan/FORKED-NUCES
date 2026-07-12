from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_user_id = serializers.IntegerField(
        source="actor.user_id",
        read_only=True,
        allow_null=True,
    )
    actor_full_name = serializers.CharField(
        source="actor.full_name",
        read_only=True,
        allow_null=True,
    )
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "notification_id",
            "event_type",
            "message",
            "url_path",
            "actor_user_id",
            "actor_full_name",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = fields

    def get_is_read(self, obj):
        return obj.read_at is not None
