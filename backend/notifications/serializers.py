from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    # video_id is the FK integer — use the _id suffix directly
    video_id    = serializers.IntegerField(read_only=True, allow_null=True)
    video_title = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message',
            'read', 'created_at',
            'video_id', 'video_title',
        ]

    def get_video_title(self, obj):
        # Prefer live title from FK, fall back to cached field
        if obj.video_id and obj.video:
            return obj.video.title
        return obj.video_title
