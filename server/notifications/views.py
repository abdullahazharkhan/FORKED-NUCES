from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        queryset = Notification.objects.filter(
            recipient=self.request.user
        ).select_related("actor")
        unread = self.request.query_params.get("unread", "").strip().lower()
        if unread in {"1", "true", "yes"}:
            queryset = queryset.filter(read_at__isnull=True)
        return queryset


class NotificationUnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True,
        ).count()
        return Response({"unread_count": count})


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, notification_id):
        updated = Notification.objects.filter(
            notification_id=notification_id,
            recipient=request.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        if not updated and not Notification.objects.filter(
            notification_id=notification_id,
            recipient=request.user,
        ).exists():
            return Response(
                {"detail": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"notification_id": notification_id, "is_read": True})


class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return Response({"updated": updated})
