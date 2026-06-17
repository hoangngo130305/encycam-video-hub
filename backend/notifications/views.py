from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """
    GET /api/notifications/
    Returns the current user's notifications, newest first.
    Query params: ?read=true|false  to filter by read status.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user).select_related('video')
        read_filter = self.request.query_params.get('read', '').strip().lower()
        if read_filter == 'true':
            qs = qs.filter(read=True)
        elif read_filter == 'false':
            qs = qs.filter(read=False)
        return qs.order_by('-created_at')


class NotificationMarkReadView(generics.UpdateAPIView):
    """
    PATCH /api/notifications/{id}/read/
    Marks a single notification as read.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    http_method_names = ['patch', 'head', 'options']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.read = True
        notification.save(update_fields=['read'])
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadView(APIView):
    """
    POST /api/notifications/read-all/
    Marks all of the current user's notifications as read.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(user=request.user, read=False).update(read=True)
        return Response({'detail': f'{updated} thông báo đã được đánh dấu đã đọc.'})


class NotificationUnreadCountView(APIView):
    """
    GET /api/notifications/unread-count/
    Returns the unread notification count for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, read=False).count()
        return Response({'count': count})
