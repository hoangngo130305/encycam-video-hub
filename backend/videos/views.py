import os
import re
from django.conf import settings
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.http import StreamingHttpResponse, HttpResponseNotFound
from rest_framework import status, generics
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsBtv, IsReviewer, IsFinal
from audit.models import AuditEntry
from notifications.models import Notification
from .models import Video, VideoVersion, Comment, HistoryEntry, random_gradient
from .serializers import (
    VideoListSerializer, VideoDetailSerializer, VideoCreateSerializer,
    CommentSerializer, HistoryEntrySerializer,
)

User = get_user_model()


def _notify(user, ntype, title, message, video=None):
    """Helper: create a single Notification."""
    Notification.objects.create(
        user=user, type=ntype, title=title, message=message, video=video,
    )


def _notify_role(role, ntype, title, message, video=None):
    """Helper: create Notification for every user with the given role."""
    for user in User.objects.filter(role=role, locked=False):
        _notify(user, ntype, title, message, video)


def _format_file_size(size_bytes):
    if size_bytes >= 1024 ** 3:
        return f'{size_bytes / 1024 ** 3:.2f} GB'
    if size_bytes >= 1024 ** 2:
        return f'{size_bytes / 1024 ** 2:.0f} MB'
    return f'{size_bytes / 1024:.0f} KB'


# ---------------------------------------------------------------------------
# Video ViewSet
# ---------------------------------------------------------------------------

class VideoViewSet(ModelViewSet):
    """
    GET    /api/videos/                   – list (role-filtered, searchable)
    POST   /api/videos/                   – upload new video (BTV only)
    GET    /api/videos/{id}/              – detail
    PATCH  /api/videos/{id}/              – update metadata (BTV, own video)
    POST   /api/videos/{id}/start-review/ – reviewer starts review
    POST   /api/videos/{id}/send-to-final/– reviewer approves → send to final
    POST   /api/videos/{id}/request-revision/ – reviewer requests revision
    POST   /api/videos/{id}/approve/      – final approver approves
    POST   /api/videos/{id}/reject/       – final approver rejects
    POST   /api/videos/{id}/reupload/     – BTV re-uploads a new version
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        qs = Video.objects.select_related('btv', 'reviewer').prefetch_related(
            'versions', 'history__user', 'video_comments__user',
        )

        # Role-based base filter
        if user.role == 'btv':
            qs = qs.filter(btv=user)
        # reviewer / final / admin see all videos

        # Status filter
        status_filter = self.request.query_params.get('status', '').strip()
        if status_filter:
            qs = qs.filter(status=status_filter)

        # Search
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(file_id__icontains=search) |
                Q(btv__name__icontains=search)
            )

        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return VideoDetailSerializer
        if self.action in ('create', 'partial_update', 'update'):
            return VideoCreateSerializer
        return VideoListSerializer

    # -----------------------------------------------------------------------
    # CREATE – BTV uploads a new video
    # -----------------------------------------------------------------------
    def create(self, request, *args, **kwargs):
        if request.user.role != 'btv':
            return Response({'detail': 'Chỉ BTV mới có thể upload video.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = VideoCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Vui lòng đính kèm file video (.mp4).'}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.lower().endswith('.mp4'):
            return Response({'detail': 'Chỉ nhận file .mp4.'}, status=status.HTTP_400_BAD_REQUEST)
        if file.size > 4 * 1024 ** 3:
            return Response({'detail': 'File quá lớn (tối đa 4 GB).'}, status=status.HTTP_400_BAD_REQUEST)

        video = Video.objects.create(
            title=data['title'],
            notes=data.get('notes', ''),
            category=data.get('category', 'Tutorial'),
            thumb_gradient=data.get('thumb_gradient') or random_gradient(),
            btv=request.user,
            status='pending',
            current_version=1,
        )

        file_size = _format_file_size(file.size)
        VideoVersion.objects.create(
            video=video, number=1,
            uploaded_by=request.user,
            file=file, file_size=file_size,
        )

        HistoryEntry.objects.create(
            video=video, user=request.user,
            action='Upload v1',
            to_status='pending',
        )

        AuditEntry.objects.create(
            user=request.user,
            action=f'Upload mới "{video.title}" → v1',
            resource_type='video',
            resource_id=video.id,
        )

        # Confirm upload to the BTV themselves
        _notify(
            request.user, 'upload',
            'Upload thành công ✅',
            f'Video "{video.title}" đã được upload thành công và đang chờ Reviewer duyệt.',
            video=video,
        )

        # Notify all reviewers that a new video is ready
        _notify_role(
            'reviewer', 'upload',
            'Video mới cần review',
            f'{request.user.name} vừa upload "{video.title}", đang chờ review.',
            video=video,
        )

        return Response(VideoDetailSerializer(video).data, status=status.HTTP_201_CREATED)

    # -----------------------------------------------------------------------
    # PARTIAL UPDATE – BTV edits metadata of own video
    # -----------------------------------------------------------------------
    def partial_update(self, request, *args, **kwargs):
        video = self.get_object()
        if request.user.role != 'btv' and request.user.role != 'admin':
            return Response({'detail': 'Không có quyền chỉnh sửa video này.'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'btv' and video.btv != request.user:
            return Response({'detail': 'Bạn không sở hữu video này.'}, status=status.HTTP_403_FORBIDDEN)

        for field in ('title', 'notes', 'category', 'thumb_gradient'):
            val = request.data.get(field)
            if val is not None:
                setattr(video, field, val)
        video.save()
        return Response(VideoDetailSerializer(video).data)

    # -----------------------------------------------------------------------
    # ACTION: start-review (Reviewer)
    # -----------------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='start-review')
    def start_review(self, request, pk=None):
        if request.user.role != 'reviewer':
            return Response({'detail': 'Chỉ Reviewer mới có thể bắt đầu review.'}, status=status.HTTP_403_FORBIDDEN)

        video = self.get_object()
        if video.status != 'pending':
            return Response(
                {'detail': f'Chỉ có thể bắt đầu review video ở trạng thái "Chờ review" (hiện tại: {video.status}).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = video.status
        video.status = 'reviewing'
        video.reviewer = request.user
        video.save(update_fields=['status', 'reviewer', 'updated_at'])

        HistoryEntry.objects.create(
            video=video, user=request.user,
            action=f'Bắt đầu review v{video.current_version}',
            from_status=old_status, to_status='reviewing',
        )
        AuditEntry.objects.create(
            user=request.user,
            action=f'Bắt đầu review "{video.title}"',
            resource_type='video', resource_id=video.id,
        )
        _notify(
            video.btv, 'upload',
            'Video đang được review',
            f'Video "{video.title}" đã chuyển sang trạng thái đang review.',
            video=video,
        )
        return Response(VideoDetailSerializer(video).data)

    # -----------------------------------------------------------------------
    # ACTION: request-revision (Reviewer → BTV)
    # -----------------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='request-revision')
    def request_revision(self, request, pk=None):
        if request.user.role != 'reviewer':
            return Response({'detail': 'Chỉ Reviewer mới có thể yêu cầu sửa.'}, status=status.HTTP_403_FORBIDDEN)

        video = self.get_object()
        if video.status not in ('reviewing', 'needs_revision'):
            return Response(
                {'detail': 'Chỉ có thể yêu cầu sửa khi video đang ở trạng thái "Đang review".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        note = request.data.get('note', '').strip()
        if not note:
            return Response({'detail': 'Vui lòng nhập tóm tắt yêu cầu sửa.'}, status=status.HTTP_400_BAD_REQUEST)

        old_status = video.status
        video.status = 'needs_revision'
        video.save(update_fields=['status', 'updated_at'])

        HistoryEntry.objects.create(
            video=video, user=request.user,
            action=f'Yêu cầu sửa — {note}',
            from_status=old_status, to_status='needs_revision',
        )
        AuditEntry.objects.create(
            user=request.user,
            action=f'Yêu cầu sửa "{video.title}" — {note}',
            resource_type='video', resource_id=video.id,
        )
        _notify(
            video.btv, 'comment',
            'Reviewer yêu cầu sửa lại',
            f'Reviewer {request.user.name} yêu cầu sửa "{video.title}": {note}',
            video=video,
        )
        return Response(VideoDetailSerializer(video).data)

    # -----------------------------------------------------------------------
    # ACTION: send-to-final (Reviewer approves → final)
    # -----------------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='send-to-final')
    def send_to_final(self, request, pk=None):
        if request.user.role != 'reviewer':
            return Response({'detail': 'Chỉ Reviewer mới có thể chuyển lên Duyệt cuối.'}, status=status.HTTP_403_FORBIDDEN)

        video = self.get_object()
        if video.status not in ('reviewing', 'needs_revision'):
            return Response(
                {'detail': 'Chỉ có thể chuyển lên Duyệt cuối khi video đang review.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        open_comments = video.video_comments.filter(resolved=False).count()
        if open_comments > 0:
            return Response(
                {'detail': f'Còn {open_comments} comment chưa resolve. Hãy xử lý hết trước khi chuyển.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = video.status
        video.status = 'reviewed'
        video.save(update_fields=['status', 'updated_at'])

        HistoryEntry.objects.create(
            video=video, user=request.user,
            action='Approve review — chuyển Duyệt cuối',
            from_status=old_status, to_status='reviewed',
        )
        AuditEntry.objects.create(
            user=request.user,
            action=f'Approve "{video.title}" — chuyển Duyệt cuối',
            resource_type='video', resource_id=video.id,
        )
        # Confirm action to the Reviewer themselves
        _notify(
            request.user, 'approve',
            'Đã chuyển lên Duyệt cuối ✅',
            f'Video "{video.title}" đã được chuyển thành công lên bước Duyệt cuối.',
            video=video,
        )
        # Notify BTV that their video is progressing
        _notify(
            video.btv, 'approve',
            'Video đang chờ duyệt cuối',
            f'Video "{video.title}" đã qua review và đang chờ quyết định duyệt cuối.',
            video=video,
        )
        # Notify all final approvers
        _notify_role(
            'final', 'upload',
            'Chờ quyết định',
            f'"{video.title}" đã được Reviewer approve, đang chờ quyết định cuối.',
            video=video,
        )
        return Response(VideoDetailSerializer(video).data)

    # -----------------------------------------------------------------------
    # ACTION: approve (Final approver)
    # -----------------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        if request.user.role != 'final':
            return Response({'detail': 'Chỉ Duyệt cuối mới có thể approve.'}, status=status.HTTP_403_FORBIDDEN)

        video = self.get_object()
        if video.status != 'reviewed':
            return Response(
                {'detail': 'Chỉ có thể approve video ở trạng thái "Đã review".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        video.status = 'approved'
        video.save(update_fields=['status', 'updated_at'])

        HistoryEntry.objects.create(
            video=video, user=request.user,
            action='Approve cuối — Published ✅',
            from_status='reviewed', to_status='approved',
        )
        AuditEntry.objects.create(
            user=request.user,
            action=f'Approve "{video.title}" — published ✅',
            resource_type='video', resource_id=video.id,
        )
        _notify(
            video.btv, 'approve',
            'Video được duyệt ✅',
            f'Video "{video.title}" đã được duyệt cuối approve ✅',
            video=video,
        )
        if video.reviewer:
            _notify(
                video.reviewer, 'approve',
                'Video đã duyệt',
                f'Video "{video.title}" đã được duyệt cuối ✅',
                video=video,
            )
        return Response(VideoDetailSerializer(video).data)

    # -----------------------------------------------------------------------
    # ACTION: reject (Final approver)
    # -----------------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        if request.user.role != 'final':
            return Response({'detail': 'Chỉ Duyệt cuối mới có thể reject.'}, status=status.HTTP_403_FORBIDDEN)

        video = self.get_object()
        if video.status != 'reviewed':
            return Response(
                {'detail': 'Chỉ có thể reject video ở trạng thái "Đã review".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({'detail': 'Vui lòng nhập lý do từ chối.'}, status=status.HTTP_400_BAD_REQUEST)

        video.status = 'rejected'
        video.save(update_fields=['status', 'updated_at'])

        HistoryEntry.objects.create(
            video=video, user=request.user,
            action=f'Reject — Lý do: {reason}',
            from_status='reviewed', to_status='rejected',
        )
        AuditEntry.objects.create(
            user=request.user,
            action=f'Reject "{video.title}" — Lý do: {reason}',
            resource_type='video', resource_id=video.id,
        )
        _notify(
            video.btv, 'reject',
            'Video bị từ chối',
            f'Video "{video.title}" đã bị từ chối. Lý do: {reason}',
            video=video,
        )
        if video.reviewer:
            _notify(
                video.reviewer, 'reject',
                'Video bị từ chối',
                f'Video "{video.title}" đã bị Duyệt cuối từ chối.',
                video=video,
            )
        return Response(VideoDetailSerializer(video).data)

    # -----------------------------------------------------------------------
    # ACTION: reupload (BTV re-uploads a new version)
    # -----------------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='reupload',
            parser_classes=[MultiPartParser, FormParser])
    def reupload(self, request, pk=None):
        if request.user.role != 'btv':
            return Response({'detail': 'Chỉ BTV mới có thể re-upload.'}, status=status.HTTP_403_FORBIDDEN)

        video = self.get_object()
        if video.btv != request.user:
            return Response({'detail': 'Bạn không sở hữu video này.'}, status=status.HTTP_403_FORBIDDEN)
        if video.status not in ('needs_revision', 'rejected'):
            return Response(
                {'detail': 'Chỉ có thể re-upload khi video ở trạng thái "Cần sửa" hoặc "Từ chối".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Vui lòng đính kèm file video (.mp4).'}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.lower().endswith('.mp4'):
            return Response({'detail': 'Chỉ nhận file .mp4.'}, status=status.HTTP_400_BAD_REQUEST)
        if file.size > 4 * 1024 ** 3:
            return Response({'detail': 'File quá lớn (tối đa 4 GB).'}, status=status.HTTP_400_BAD_REQUEST)

        old_status = video.status
        new_version_num = video.current_version + 1
        file_size = _format_file_size(file.size)

        VideoVersion.objects.create(
            video=video,
            number=new_version_num,
            uploaded_by=request.user,
            file=file,
            file_size=file_size,
        )

        video.current_version = new_version_num
        video.status = 'reviewing'
        video.save(update_fields=['current_version', 'status', 'updated_at'])

        HistoryEntry.objects.create(
            video=video, user=request.user,
            action=f'Upload v{new_version_num} (re-upload)',
            from_status=old_status, to_status='reviewing',
        )
        AuditEntry.objects.create(
            user=request.user,
            action=f'Upload "{video.title}" → v{new_version_num}',
            resource_type='video', resource_id=video.id,
        )

        # Confirm re-upload to the BTV themselves
        _notify(
            request.user, 'upload',
            f'Re-upload v{new_version_num} thành công ✅',
            f'Video "{video.title}" đã được re-upload (v{new_version_num}) và đang chờ review.',
            video=video,
        )

        if video.reviewer:
            _notify(
                video.reviewer, 'upload',
                'Re-upload mới',
                f'{request.user.name} đã re-upload "{video.title}" → v{new_version_num}',
                video=video,
            )

        return Response(VideoDetailSerializer(video).data)


# ---------------------------------------------------------------------------
# Comments
# ---------------------------------------------------------------------------

class CommentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/videos/{video_pk}/comments/ – list all comments for a video
    POST /api/videos/{video_pk}/comments/ – add a comment (reviewer / final)
    """
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def _get_video(self):
        from django.shortcuts import get_object_or_404
        return get_object_or_404(Video, pk=self.kwargs['video_pk'])

    def get_queryset(self):
        return Comment.objects.filter(
            video_id=self.kwargs['video_pk']
        ).select_related('user').order_by('created_at')

    def create(self, request, *args, **kwargs):
        if request.user.role == 'btv':
            return Response(
                {'detail': 'BTV không thể thêm comment. Vui lòng re-upload để phản hồi.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        video = self._get_video()
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'Nội dung comment không được để trống.'}, status=status.HTTP_400_BAD_REQUEST)

        # Extract mm:ss timestamp if included in text
        ts_match = re.search(r'\b(\d{1,2}:\d{2})\b', text)
        timestamp = ts_match.group(1) if ts_match else request.data.get('timestamp', '')

        comment = Comment.objects.create(
            video=video,
            user=request.user,
            text=text,
            timestamp=timestamp,
        )

        AuditEntry.objects.create(
            user=request.user,
            action=f'Comment tại {timestamp or "—"} — "{text[:60]}"',
            resource_type='video',
            resource_id=video.id,
        )

        # Notify BTV about the new comment on their video
        _notify(
            video.btv, 'comment',
            'Comment mới',
            f'{request.user.name} đã comment vào "{video.title}"' +
            (f' tại {timestamp}' if timestamp else '') +
            f' — "{text[:80]}"',
            video=video,
        )

        # Handle @mention notifications
        mentions = re.findall(r'@(\w+)', text)
        if mentions:
            from django.db.models import Q as _Q
            mentioned_users = User.objects.filter(
                _Q(name__icontains=mentions[0]) |
                _Q(email__icontains=mentions[0])
            ).exclude(pk=request.user.pk)
            for mu in mentioned_users[:5]:
                _notify(
                    mu, 'mention',
                    'Được mention',
                    f'{request.user.name} đã mention bạn trong comment trên "{video.title}"',
                    video=video,
                )

        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class CommentResolveView(generics.UpdateAPIView):
    """
    PATCH /api/comments/{id}/resolve/ – mark comment as resolved
    Only reviewer or final can resolve comments.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CommentSerializer
    queryset = Comment.objects.select_related('user', 'video')
    http_method_names = ['patch', 'head', 'options']

    def partial_update(self, request, *args, **kwargs):
        if request.user.role not in ('reviewer', 'final', 'admin'):
            return Response(
                {'detail': 'Chỉ Reviewer hoặc Duyệt cuối mới có thể resolve comment.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        comment = self.get_object()
        if comment.resolved:
            return Response({'detail': 'Comment này đã được resolve rồi.'}, status=status.HTTP_400_BAD_REQUEST)
        comment.resolved = True
        comment.save(update_fields=['resolved'])
        return Response(CommentSerializer(comment).data)


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class DashboardView(APIView):
    """
    GET /api/dashboard/
    Returns role-specific KPIs and recent data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role
        all_videos = Video.objects.select_related('btv', 'reviewer')

        if role == 'btv':
            my_videos = all_videos.filter(btv=user)
            return Response({
                'role': role,
                'stats': {
                    'total':         my_videos.count(),
                    'reviewing':     my_videos.filter(status='reviewing').count(),
                    'needs_revision': my_videos.filter(status='needs_revision').count(),
                    'approved':      my_videos.filter(status='approved').count(),
                    'rejected':      my_videos.filter(status='rejected').count(),
                    'pending':       my_videos.filter(status='pending').count(),
                },
                'recent_videos': VideoListSerializer(my_videos.order_by('-updated_at')[:5], many=True).data,
                'recent_activity': _recent_audit(),
            })

        if role == 'reviewer':
            queue = all_videos.filter(status__in=('pending', 'reviewing', 'needs_revision'))
            return Response({
                'role': role,
                'stats': {
                    'pending':  all_videos.filter(status='pending').count(),
                    'reviewing': all_videos.filter(status='reviewing').count(),
                    'reviewed':  all_videos.filter(status__in=('reviewed', 'approved')).count(),
                    'timeout_count': 0,  # Extend with real timeout logic later
                },
                'queue': VideoListSerializer(queue.order_by('-uploaded_at')[:5], many=True).data,
                'recent_activity': _recent_audit(),
            })

        if role == 'final':
            waiting = all_videos.filter(status='reviewed')
            return Response({
                'role': role,
                'stats': {
                    'waiting_approve': waiting.count(),
                    'approved':  all_videos.filter(status='approved').count(),
                    'rejected':  all_videos.filter(status='rejected').count(),
                },
                'waiting_videos': VideoListSerializer(waiting.order_by('-updated_at')[:5], many=True).data,
                'recent_activity': _recent_audit(),
            })

        # Admin
        users_qs = User.objects.all()
        pending = all_videos.filter(status='pending')
        approved = all_videos.filter(status='approved')
        rejected = all_videos.filter(status='rejected')
        reviewing = all_videos.filter(status='reviewing')
        reviewed = all_videos.filter(status='reviewed')
        needs_rev = all_videos.filter(status='needs_revision')
        total = all_videos.count()

        return Response({
            'role': role,
            'stats': {
                'total_videos': total,
                'pending':   pending.count(),
                'reviewing': reviewing.count(),
                'reviewed':  reviewed.count(),
                'approved':  approved.count(),
                'rejected':  rejected.count(),
                'needs_revision': needs_rev.count(),
                'active_users': users_qs.filter(locked=False).count(),
                'locked_users': users_qs.filter(locked=True).count(),
                'total_users':  users_qs.count(),
            },
            'status_distribution': {
                'pending':        pending.count(),
                'reviewing':      reviewing.count(),
                'reviewed':       reviewed.count(),
                'approved':       approved.count(),
                'rejected':       rejected.count(),
                'needs_revision': needs_rev.count(),
            },
            'recent_videos': VideoListSerializer(all_videos.order_by('-updated_at')[:6], many=True).data,
            'recent_activity': _recent_audit(),
        })


def _recent_audit():
    from audit.serializers import AuditEntrySerializer
    from audit.models import AuditEntry
    entries = AuditEntry.objects.select_related('user').order_by('-timestamp')[:5]
    return AuditEntrySerializer(entries, many=True).data


# ---------------------------------------------------------------------------
# Media serving with HTTP Range support (enables video seeking)
# ---------------------------------------------------------------------------

def serve_media_with_range(request, path):
    """Serve media files with HTTP Range request support so videos can be seeked."""
    file_path = os.path.join(settings.MEDIA_ROOT, path)

    if not os.path.isfile(file_path):
        return HttpResponseNotFound()

    file_size = os.path.getsize(file_path)
    ext = os.path.splitext(file_path)[1].lower()
    content_type = 'video/mp4' if ext == '.mp4' else 'application/octet-stream'

    range_header = request.META.get('HTTP_RANGE', '').strip()
    if range_header:
        m = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if m:
            first = int(m.group(1))
            last = int(m.group(2)) if m.group(2) else file_size - 1
            last = min(last, file_size - 1)
            length = last - first + 1

            def _partial():
                with open(file_path, 'rb') as f:
                    f.seek(first)
                    remaining = length
                    while remaining > 0:
                        chunk = f.read(min(65536, remaining))
                        if not chunk:
                            break
                        remaining -= len(chunk)
                        yield chunk

            resp = StreamingHttpResponse(_partial(), status=206, content_type=content_type)
            resp['Content-Length'] = length
            resp['Content-Range'] = f'bytes {first}-{last}/{file_size}'
            resp['Accept-Ranges'] = 'bytes'
            return resp

    def _full():
        with open(file_path, 'rb') as f:
            while True:
                chunk = f.read(65536)
                if not chunk:
                    break
                yield chunk

    resp = StreamingHttpResponse(_full(), content_type=content_type)
    resp['Content-Length'] = file_size
    resp['Accept-Ranges'] = 'bytes'
    return resp
