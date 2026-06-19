import re
from django.db.models import Q
from ninja import Router, File, Form, Schema
from ninja.files import UploadedFile
from typing import Optional

from accounts.models import User
from audit.models import AuditEntry
from notifications.models import Notification
from videos.models import Video, VideoVersion, Comment, HistoryEntry, random_gradient
from videos.schemas import (
    VideoListOut, VideoDetailOut, VideoVersionOut,
    CommentOut, HistoryEntryOut,
    CommentCreateIn, RevisionNoteIn, RejectReasonIn,
)

router = Router(tags=["videos"])


class VideoUploadForm(Schema):
    title: str
    notes: Optional[str] = None
    category: Optional[str] = None
    thumb_gradient: Optional[str] = None


class VideoReuploadForm(Schema):
    notes: Optional[str] = None
    category: Optional[str] = None


# ── helpers ───────────────────────────────────────────────────────────────────

def _format_size(size_bytes: int) -> str:
    if size_bytes >= 1024 ** 3:
        return f'{size_bytes / 1024 ** 3:.2f} GB'
    if size_bytes >= 1024 ** 2:
        return f'{size_bytes / 1024 ** 2:.0f} MB'
    return f'{size_bytes / 1024:.0f} KB'


def _notify(user: User, ntype: str, title: str, message: str, video=None) -> None:
    Notification.objects.create(user=user, type=ntype, title=title, message=message, video=video)


def _notify_role(role: str, ntype: str, title: str, message: str, video=None) -> None:
    for u in User.objects.filter(role=role, locked=False):
        _notify(u, ntype, title, message, video)


def _audit(actor: User, action: str, video: Video) -> None:
    AuditEntry.objects.create(
        user=actor, action=action, resource_type='video', resource_id=video.id,
    )


def _media_url(request, file_path: str) -> Optional[str]:
    if not file_path:
        return None
    scheme = request.META.get('HTTP_X_FORWARDED_PROTO', request.scheme)
    host = request.META.get('HTTP_X_FORWARDED_HOST', request.get_host())
    return f"{scheme}://{host}/media/{file_path}"


def _serialize_version(request, ver: VideoVersion) -> dict:
    return {
        "number": ver.number,
        "uploadedAt": ver.uploaded_at,
        "uploadedBy": ver.uploaded_by.name,
        "file": _media_url(request, ver.file.name if ver.file else None),
        "fileSize": ver.file_size,
        "duration": ver.duration,
    }


def _serialize_history(entry: HistoryEntry) -> dict:
    return {
        "id": entry.id,
        "timestamp": entry.timestamp,
        "user": entry.user,
        "action": entry.action,
        "fromStatus": entry.from_status,
        "toStatus": entry.to_status,
    }


def _serialize_comment(c: Comment) -> dict:
    return {
        "id": c.id,
        "videoId": c.video_id,
        "user": c.user,
        "text": c.text,
        "timestamp": c.timestamp,
        "resolved": c.resolved,
        "createdAt": c.created_at,
    }


def _video_qs():
    return Video.objects.select_related('btv', 'reviewer').prefetch_related(
        'versions__uploaded_by', 'history__user', 'video_comments__user',
    )


def _video_list_out(v: Video) -> dict:
    return {
        "id": v.id, "title": v.title, "fileId": v.file_id,
        "status": v.status, "currentVersion": v.current_version,
        "btv": v.btv, "reviewer": v.reviewer,
        "uploadedAt": v.uploaded_at, "updatedAt": v.updated_at,
        "thumbGradient": v.thumb_gradient, "category": v.category, "notes": v.notes,
    }


def _video_detail_out(request, v: Video) -> dict:
    d = _video_list_out(v)
    d["versions"] = [_serialize_version(request, ver) for ver in v.versions.all()]
    d["history"] = [_serialize_history(h) for h in v.history.all()]
    return d


def _get_video_or_404(video_id: int):
    try:
        return _video_qs().get(pk=video_id)
    except Video.DoesNotExist:
        from ninja.errors import HttpError
        raise HttpError(404, "Video không tồn tại.")


# ── video list / create ───────────────────────────────────────────────────────

@router.get("/videos/", response=list[VideoListOut])
def list_videos(request, status: Optional[str] = None, search: Optional[str] = None, category: Optional[str] = None):
    user: User = request.auth
    qs = _video_qs()

    if user.role == 'btv':
        qs = qs.filter(btv=user)
    if status and status.strip():
        qs = qs.filter(status=status)
    if category and category.strip():
        qs = qs.filter(category=category)
    if search and search.strip():
        qs = qs.filter(
            Q(title__icontains=search) |
            Q(file_id__icontains=search) |
            Q(btv__name__icontains=search)
        )
    return [_video_list_out(v) for v in qs]


@router.post("/videos/", response=VideoDetailOut)
def create_video(
    request,
    data: Form[VideoUploadForm],
    file: UploadedFile = File(None),
):
    from ninja.errors import HttpError
    user: User = request.auth
    if user.role != 'btv':
        raise HttpError(403, "Chỉ BTV mới có thể upload video.")
    if not file:
        raise HttpError(400, "Vui lòng đính kèm file video (.mp4).")
    if not file.name.lower().endswith('.mp4'):
        raise HttpError(400, "Chỉ nhận file .mp4.")
    if file.size > 4 * 1024 ** 3:
        raise HttpError(400, "File quá lớn (tối đa 4 GB).")

    video = Video.objects.create(
        title=data.title,
        notes=data.notes or "",
        category=data.category or "ENCY CAM",
        thumb_gradient=data.thumb_gradient or random_gradient(),
        btv=user, status='pending', current_version=1,
    )
    VideoVersion.objects.create(
        video=video, number=1, uploaded_by=user,
        file=file, file_size=_format_size(file.size),
    )
    HistoryEntry.objects.create(video=video, user=user, action='Upload v1', to_status='pending')
    _audit(user, f'Upload mới "{video.title}" → v1', video)

    _notify(user, 'upload', 'Upload thành công ✅',
            f'Video "{video.title}" đã được upload thành công và đang chờ Reviewer duyệt.', video)
    _notify_role('reviewer', 'upload', 'Video mới cần review',
                 f'{user.name} vừa upload "{video.title}", đang chờ review.', video)

    video.refresh_from_db()
    return _video_detail_out(request, _get_video_or_404(video.id))


# ── video detail / update ─────────────────────────────────────────────────────

@router.get("/videos/{video_id}/", response=VideoDetailOut)
def get_video(request, video_id: int):
    return _video_detail_out(request, _get_video_or_404(video_id))


class VideoUpdateIn(Schema):
    title: Optional[str] = None
    notes: Optional[str] = None
    category: Optional[str] = None
    thumb_gradient: Optional[str] = None


@router.patch("/videos/{video_id}/", response=VideoDetailOut)
def update_video(request, video_id: int, body: VideoUpdateIn):
    from ninja.errors import HttpError
    user: User = request.auth
    video = _get_video_or_404(video_id)

    if user.role not in ('btv', 'admin'):
        raise HttpError(403, "Không có quyền chỉnh sửa video này.")
    if user.role == 'btv' and video.btv_id != user.id:
        raise HttpError(403, "Bạn không sở hữu video này.")

    for field in ('title', 'notes', 'category', 'thumb_gradient'):
        val = getattr(body, field)
        if val is not None:
            setattr(video, field, val)
    video.save()
    return _video_detail_out(request, _get_video_or_404(video_id))


# ── workflow actions ──────────────────────────────────────────────────────────

@router.post("/videos/{video_id}/start-review/", response=VideoDetailOut)
def start_review(request, video_id: int):
    from ninja.errors import HttpError
    user: User = request.auth
    if user.role != 'reviewer':
        raise HttpError(403, "Chỉ Reviewer mới có thể bắt đầu review.")

    video = _get_video_or_404(video_id)
    if video.status != 'pending':
        raise HttpError(400, f'Chỉ có thể review video ở trạng thái "Chờ review" (hiện tại: {video.status}).')

    old = video.status
    video.status = 'reviewing'
    video.reviewer = user
    video.save(update_fields=['status', 'reviewer', 'updated_at'])

    HistoryEntry.objects.create(video=video, user=user,
        action=f'Bắt đầu review v{video.current_version}',
        from_status=old, to_status='reviewing')
    _audit(user, f'Bắt đầu review "{video.title}"', video)
    _notify(video.btv, 'upload', 'Video đang được review',
            f'Video "{video.title}" đã chuyển sang trạng thái đang review.', video)
    return _video_detail_out(request, _get_video_or_404(video_id))


@router.post("/videos/{video_id}/request-revision/", response=VideoDetailOut)
def request_revision(request, video_id: int, body: RevisionNoteIn):
    from ninja.errors import HttpError
    user: User = request.auth
    if user.role != 'reviewer':
        raise HttpError(403, "Chỉ Reviewer mới có thể yêu cầu sửa.")

    video = _get_video_or_404(video_id)
    if video.status not in ('reviewing', 'needs_revision'):
        raise HttpError(400, 'Chỉ có thể yêu cầu sửa khi video đang ở trạng thái "Đang review".')
    if not body.note.strip():
        raise HttpError(400, "Vui lòng nhập tóm tắt yêu cầu sửa.")

    old = video.status
    video.status = 'needs_revision'
    video.save(update_fields=['status', 'updated_at'])

    HistoryEntry.objects.create(video=video, user=user,
        action=f'Yêu cầu sửa — {body.note}',
        from_status=old, to_status='needs_revision')
    _audit(user, f'Yêu cầu sửa "{video.title}" — {body.note}', video)
    _notify(user, 'comment', 'Đã gửi yêu cầu sửa lại ✅',
            f'Đã gửi yêu cầu sửa "{video.title}" tới BTV. Nội dung: {body.note}', video)
    _notify(video.btv, 'comment', 'Reviewer yêu cầu sửa lại',
            f'Reviewer {user.name} yêu cầu sửa "{video.title}": {body.note}', video)
    return _video_detail_out(request, _get_video_or_404(video_id))


@router.post("/videos/{video_id}/send-to-final/", response=VideoDetailOut)
def send_to_final(request, video_id: int):
    from ninja.errors import HttpError
    user: User = request.auth
    if user.role != 'reviewer':
        raise HttpError(403, "Chỉ Reviewer mới có thể chuyển lên Duyệt cuối.")

    video = _get_video_or_404(video_id)
    if video.status not in ('reviewing', 'needs_revision'):
        raise HttpError(400, "Chỉ có thể chuyển lên Duyệt cuối khi video đang review.")

    open_comments = video.video_comments.filter(resolved=False).count()
    if open_comments:
        raise HttpError(400, f'Còn {open_comments} comment chưa resolve. Hãy xử lý hết trước khi chuyển.')

    old = video.status
    video.status = 'reviewed'
    video.save(update_fields=['status', 'updated_at'])

    HistoryEntry.objects.create(video=video, user=user,
        action='Approve review — chuyển Duyệt cuối',
        from_status=old, to_status='reviewed')
    _audit(user, f'Approve "{video.title}" — chuyển Duyệt cuối', video)
    _notify(user, 'approve', 'Đã chuyển lên Duyệt cuối ✅',
            f'Video "{video.title}" đã được chuyển thành công lên bước Duyệt cuối.', video)
    _notify(video.btv, 'approve', 'Video đang chờ duyệt cuối',
            f'Video "{video.title}" đã qua review và đang chờ quyết định duyệt cuối.', video)
    _notify_role('final', 'upload', 'Chờ quyết định',
                 f'"{video.title}" đã được Reviewer approve, đang chờ quyết định cuối.', video)
    return _video_detail_out(request, _get_video_or_404(video_id))


@router.post("/videos/{video_id}/approve/", response=VideoDetailOut)
def approve_video(request, video_id: int):
    from ninja.errors import HttpError
    user: User = request.auth
    if user.role != 'final':
        raise HttpError(403, "Chỉ Duyệt cuối mới có thể approve.")

    video = _get_video_or_404(video_id)
    if video.status != 'reviewed':
        raise HttpError(400, 'Chỉ có thể approve video ở trạng thái "Đã review".')

    video.status = 'approved'
    video.save(update_fields=['status', 'updated_at'])

    HistoryEntry.objects.create(video=video, user=user,
        action='Approve cuối — Published ✅',
        from_status='reviewed', to_status='approved')
    _audit(user, f'Approve "{video.title}" — published ✅', video)
    _notify(video.btv, 'approve', 'Video được duyệt ✅',
            f'Video "{video.title}" đã được duyệt cuối approve ✅', video)
    if video.reviewer:
        _notify(video.reviewer, 'approve', 'Video đã duyệt',
                f'Video "{video.title}" đã được duyệt cuối ✅', video)
    return _video_detail_out(request, _get_video_or_404(video_id))


@router.post("/videos/{video_id}/reject/", response=VideoDetailOut)
def reject_video(request, video_id: int, body: RejectReasonIn):
    from ninja.errors import HttpError
    user: User = request.auth
    if user.role != 'final':
        raise HttpError(403, "Chỉ Duyệt cuối mới có thể reject.")

    video = _get_video_or_404(video_id)
    if video.status != 'reviewed':
        raise HttpError(400, 'Chỉ có thể reject video ở trạng thái "Đã review".')
    if not body.reason.strip():
        raise HttpError(400, "Vui lòng nhập lý do từ chối.")

    video.status = 'rejected'
    video.save(update_fields=['status', 'updated_at'])

    HistoryEntry.objects.create(video=video, user=user,
        action=f'Reject — Lý do: {body.reason}',
        from_status='reviewed', to_status='rejected')
    _audit(user, f'Reject "{video.title}" — Lý do: {body.reason}', video)
    _notify(video.btv, 'reject', 'Video bị từ chối',
            f'Video "{video.title}" đã bị từ chối. Lý do: {body.reason}', video)
    if video.reviewer:
        _notify(video.reviewer, 'reject', 'Video bị từ chối',
                f'Video "{video.title}" đã bị Duyệt cuối từ chối.', video)
    return _video_detail_out(request, _get_video_or_404(video_id))


@router.post("/videos/{video_id}/reupload/", response=VideoDetailOut)
def reupload_video(
    request,
    video_id: int,
    data: Form[VideoReuploadForm],
    file: UploadedFile = File(None),
):
    from ninja.errors import HttpError
    user: User = request.auth
    if user.role != 'btv':
        raise HttpError(403, "Chỉ BTV mới có thể re-upload.")

    video = _get_video_or_404(video_id)
    if video.btv_id != user.id:
        raise HttpError(403, "Bạn không sở hữu video này.")
    if video.status not in ('needs_revision', 'rejected'):
        raise HttpError(400, 'Chỉ có thể re-upload khi video ở trạng thái "Cần sửa" hoặc "Từ chối".')
    if not file:
        raise HttpError(400, "Vui lòng đính kèm file video (.mp4).")
    if not file.name.lower().endswith('.mp4'):
        raise HttpError(400, "Chỉ nhận file .mp4.")
    if file.size > 4 * 1024 ** 3:
        raise HttpError(400, "File quá lớn (tối đa 4 GB).")

    old = video.status
    new_ver = video.current_version + 1
    VideoVersion.objects.create(
        video=video, number=new_ver, uploaded_by=user,
        file=file, file_size=_format_size(file.size),
    )
    video.current_version = new_ver
    video.status = 'reviewing'
    update_fields = ['current_version', 'status', 'updated_at']
    if data.category:
        video.category = data.category
        update_fields.append('category')
    if data.notes is not None:
        video.notes = data.notes
        update_fields.append('notes')
    video.save(update_fields=update_fields)

    HistoryEntry.objects.create(video=video, user=user,
        action=f'Upload v{new_ver} (re-upload)',
        from_status=old, to_status='reviewing')
    _audit(user, f'Upload "{video.title}" → v{new_ver}', video)
    _notify(user, 'upload', f'Re-upload v{new_ver} thành công ✅',
            f'Video "{video.title}" đã được re-upload (v{new_ver}) và đang chờ review.', video)
    if video.reviewer:
        _notify(video.reviewer, 'upload', 'Re-upload mới',
                f'{user.name} đã re-upload "{video.title}" → v{new_ver}', video)
    return _video_detail_out(request, _get_video_or_404(video_id))


# ── comments ──────────────────────────────────────────────────────────────────

@router.get("/videos/{video_id}/comments/", response=list[CommentOut])
def list_comments(request, video_id: int):
    qs = Comment.objects.filter(video_id=video_id).select_related('user').order_by('created_at')
    return [_serialize_comment(c) for c in qs]


@router.post("/videos/{video_id}/comments/", response=CommentOut)
def create_comment(request, video_id: int, body: CommentCreateIn):
    from ninja.errors import HttpError
    user: User = request.auth
    if user.role == 'btv':
        raise HttpError(403, "BTV không thể thêm comment. Vui lòng re-upload để phản hồi.")

    try:
        video = Video.objects.select_related('btv').get(pk=video_id)
    except Video.DoesNotExist:
        raise HttpError(404, "Video không tồn tại.")

    text = body.text.strip()
    if not text:
        raise HttpError(400, "Nội dung comment không được để trống.")

    ts_match = re.search(r'\b(\d{1,2}:\d{2})\b', text)
    timestamp = ts_match.group(1) if ts_match else (body.timestamp or "")

    comment = Comment.objects.create(video=video, user=user, text=text, timestamp=timestamp)
    AuditEntry.objects.create(
        user=user,
        action=f'Comment tại {timestamp or "—"} — "{text[:60]}"',
        resource_type='video', resource_id=video.id,
    )
    _notify(video.btv, 'comment', 'Comment mới',
            f'{user.name} đã comment vào "{video.title}"'
            + (f' tại {timestamp}' if timestamp else '')
            + f' — "{text[:80]}"', video)

    mentions = re.findall(r'@(\w+)', text)
    if mentions:
        mentioned = User.objects.filter(
            Q(name__icontains=mentions[0]) | Q(email__icontains=mentions[0])
        ).exclude(pk=user.pk)
        for mu in mentioned[:5]:
            _notify(mu, 'mention', 'Được mention',
                    f'{user.name} đã mention bạn trong comment trên "{video.title}"', video)

    return _serialize_comment(comment)


@router.patch("/comments/{comment_id}/resolve/", response=CommentOut)
def resolve_comment(request, comment_id: int):
    from ninja.errors import HttpError
    user: User = request.auth
    if user.role not in ('reviewer', 'final', 'admin'):
        raise HttpError(403, "Chỉ Reviewer hoặc Duyệt cuối mới có thể resolve comment.")

    try:
        comment = Comment.objects.select_related('user').get(pk=comment_id)
    except Comment.DoesNotExist:
        raise HttpError(404, "Comment không tồn tại.")
    if comment.resolved:
        raise HttpError(400, "Comment này đã được resolve rồi.")

    comment.resolved = True
    comment.save(update_fields=['resolved'])
    return _serialize_comment(comment)


# ── dashboard ─────────────────────────────────────────────────────────────────

def _recent_audit_data() -> list:
    from audit.models import AuditEntry as AE
    from audit.schemas import AuditEntryOut
    entries = AE.objects.select_related('user').order_by('-timestamp')[:5]
    return [AuditEntryOut.model_validate(e).model_dump() for e in entries]


@router.get("/dashboard/")
def dashboard(request):
    user: User = request.auth
    all_v = Video.objects.select_related('btv', 'reviewer')
    _recent_audit = _recent_audit_data

    if user.role == 'btv':
        my = all_v.filter(btv=user)
        return {
            "role": user.role,
            "stats": {
                "total": my.count(),
                "reviewing": my.filter(status='reviewing').count(),
                "needsRevision": my.filter(status='needs_revision').count(),
                "approved": my.filter(status='approved').count(),
                "rejected": my.filter(status='rejected').count(),
                "pending": my.filter(status='pending').count(),
            },
            "recentVideos": _video_list_out_many(my.order_by('-updated_at')[:5]),
            "recentActivity": _recent_audit(),
        }

    if user.role == 'reviewer':
        queue = all_v.filter(status__in=('pending', 'reviewing', 'needs_revision'))
        return {
            "role": user.role,
            "stats": {
                "pending": all_v.filter(status='pending').count(),
                "reviewing": all_v.filter(status='reviewing').count(),
                "reviewed": all_v.filter(status__in=('reviewed', 'approved')).count(),
                "timeoutCount": 0,
            },
            "queue": _video_list_out_many(queue.order_by('-uploaded_at')[:5]),
            "recentActivity": _recent_audit(),
        }

    if user.role == 'final':
        waiting = all_v.filter(status='reviewed')
        return {
            "role": user.role,
            "stats": {
                "waitingApprove": waiting.count(),
                "approved": all_v.filter(status='approved').count(),
                "rejected": all_v.filter(status='rejected').count(),
            },
            "waitingVideos": _video_list_out_many(waiting.order_by('-updated_at')[:5]),
            "recentActivity": _recent_audit(),
        }

    # admin
    users_qs = User.objects.all()
    return {
        "role": user.role,
        "stats": {
            "totalVideos": all_v.count(),
            "pending": all_v.filter(status='pending').count(),
            "reviewing": all_v.filter(status='reviewing').count(),
            "reviewed": all_v.filter(status='reviewed').count(),
            "approved": all_v.filter(status='approved').count(),
            "rejected": all_v.filter(status='rejected').count(),
            "needsRevision": all_v.filter(status='needs_revision').count(),
            "activeUsers": users_qs.filter(locked=False).count(),
            "lockedUsers": users_qs.filter(locked=True).count(),
            "totalUsers": users_qs.count(),
        },
        "statusDistribution": {
            "pending": all_v.filter(status='pending').count(),
            "reviewing": all_v.filter(status='reviewing').count(),
            "reviewed": all_v.filter(status='reviewed').count(),
            "approved": all_v.filter(status='approved').count(),
            "rejected": all_v.filter(status='rejected').count(),
            "needsRevision": all_v.filter(status='needs_revision').count(),
        },
        "recentVideos": _video_list_out_many(all_v.order_by('-updated_at')[:6]),
        "recentActivity": _recent_audit(),
    }


def _video_list_out_many(qs) -> list:
    return [VideoListOut.model_validate(v).model_dump() for v in qs]
