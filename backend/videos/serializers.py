from rest_framework import serializers
from .models import Video, VideoVersion, Comment, HistoryEntry
from accounts.serializers import UserSerializer


class VideoVersionSerializer(serializers.ModelSerializer):
    # Frontend expects uploadedBy as a string (name), not a nested user object
    uploaded_by = serializers.SerializerMethodField()
    # file trả về absolute URL nhờ request context của DRF
    file = serializers.FileField(read_only=True, use_url=True)

    class Meta:
        model = VideoVersion
        fields = ['number', 'uploaded_at', 'uploaded_by', 'file', 'file_size', 'duration']

    def get_uploaded_by(self, obj):
        return obj.uploaded_by.name


class CommentSerializer(serializers.ModelSerializer):
    user     = UserSerializer(read_only=True)
    video_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'video_id', 'user', 'text', 'timestamp', 'resolved', 'created_at']
        read_only_fields = ['id', 'video_id', 'user', 'resolved', 'created_at']


class HistoryEntrySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = HistoryEntry
        fields = ['id', 'timestamp', 'user', 'action', 'from_status', 'to_status']


class VideoListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for video list — no versions/history/comments."""
    btv      = UserSerializer(read_only=True)
    reviewer = UserSerializer(read_only=True)

    class Meta:
        model = Video
        fields = [
            'id', 'title', 'file_id', 'status', 'current_version',
            'btv', 'reviewer',
            'uploaded_at', 'updated_at',
            'thumb_gradient', 'category', 'notes',
        ]


class VideoDetailSerializer(serializers.ModelSerializer):
    """Full video detail — includes nested versions, history, and comments count."""
    btv      = UserSerializer(read_only=True)
    reviewer = UserSerializer(read_only=True)
    versions = VideoVersionSerializer(many=True, read_only=True)
    history  = HistoryEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Video
        fields = [
            'id', 'title', 'file_id', 'status', 'current_version',
            'versions', 'btv', 'reviewer',
            'uploaded_at', 'updated_at',
            'notes', 'thumb_gradient', 'category',
            'history',
        ]


class VideoCreateSerializer(serializers.ModelSerializer):
    """Used when BTV uploads a new video."""
    category = serializers.ChoiceField(
        choices=['Tutorial', 'Review', 'Comparison', 'Other'],
        default='Tutorial',
    )
    thumb_gradient = serializers.CharField(required=False)

    class Meta:
        model = Video
        fields = ['title', 'notes', 'category', 'thumb_gradient']
