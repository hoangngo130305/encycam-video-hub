import os
import re
from typing import Optional
from django.conf import settings as django_settings
from django.db.models import Q
from django.core.files.uploadedfile import InMemoryUploadedFile
from fastapi import APIRouter, HTTPException, Depends, File, Form, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from accounts.models import User
from accounts.schemas import UserOut
from audit.models import AuditEntry
from notifications.models import Notification
from videos.models import Video, VideoVersion, Comment, HistoryEntry, Category, random_gradient
from videos.schemas import (
    VideoListOut, VideoDetailOut, VideoVersionOut,
    CommentOut, HistoryEntryOut,
    CommentCreateIn, RevisionNoteIn, RejectReasonIn,
    CategoryOut,
)
from fastapi_auth import require_auth
import telegram_service as tg

router = APIRouter(tags=["videos"])


# ── category CRUD ─────────────────────────────────────────────────────────────

class CategoryIn(BaseModel):
    name: str
    youtubePlaylistId: str = ''
    youtubeCategoryId: str = '22'


def _make_category(c: Category) -> CategoryOut:
    return CategoryOut(
        id=c.id,
        name=c.name,
        youtubePlaylistId=c.youtube_playlist_id,
        youtubeCategoryId=c.youtube_category_id,
    )


@router.get('/categories/', response_model=list[CategoryOut])
def list_categories(user: User = Depends(require_auth)):
    return [_make_category(c) for c in Category.objects.all()]


@router.post('/categories/', response_model=CategoryOut, status_code=201)
def create_category(body: CategoryIn, user: User = Depends(require_auth)):
    if not user.has_role('admin'):
        raise HTTPException(403, 'Chỉ Admin mới được tạo danh mục.')
    if not body.name.strip():
        raise HTTPException(400, 'Tên danh mục không được để trống.')
    if Category.objects.filter(name=body.name.strip()).exists():
        raise HTTPException(400, 'Danh mục này đã tồn tại.')
    cat = Category.objects.create(
        name=body.name.strip(),
        youtube_playlist_id=body.youtubePlaylistId.strip(),
        youtube_category_id=body.youtubeCategoryId.strip() or '22',
    )
    return _make_category(cat)


@router.put('/categories/{cat_id}/', response_model=CategoryOut)
def update_category(cat_id: int, body: CategoryIn, user: User = Depends(require_auth)):
    if not user.has_role('admin'):
        raise HTTPException(403, 'Chỉ Admin mới được sửa danh mục.')
    try:
        cat = Category.objects.get(pk=cat_id)
    except Category.DoesNotExist:
        raise HTTPException(404, 'Danh mục không tồn tại.')
    if not body.name.strip():
        raise HTTPException(400, 'Tên danh mục không được để trống.')
    if Category.objects.filter(name=body.name.strip()).exclude(pk=cat_id).exists():
        raise HTTPException(400, 'Tên danh mục đã được dùng bởi danh mục khác.')
    cat.name = body.name.strip()
    cat.youtube_playlist_id = body.youtubePlaylistId.strip()
    cat.youtube_category_id = body.youtubeCategoryId.strip() or '22'
    cat.save()
    return _make_category(cat)


@router.delete('/categories/{cat_id}/', status_code=204)
def delete_category(cat_id: int, user: User = Depends(require_auth)):
    if not user.has_role('admin'):
        raise HTTPException(403, 'Chỉ Admin mới được xoá danh mục.')
    try:
        cat = Category.objects.get(pk=cat_id)
    except Category.DoesNotExist:
        raise HTTPException(404, 'Danh mục không tồn tại.')
    cat.delete()


class VideoUpdateIn(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    category: Optional[str] = None
    thumb_gradient: Optional[str] = None


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


def _media_url(request: Request, file_path: str) -> Optional[str]:
    if not file_path:
        return None
    scheme = request.headers.get('x-forwarded-proto', request.url.scheme)
    host = request.headers.get('x-forwarded-host', request.headers.get('host', '127.0.0.1:8000'))
    return f"{scheme}://{host}/media/{file_path}"


def _wrap_file(upload: UploadFile):
    """Wrap FastAPI UploadFile as Django InMemoryUploadedFile."""
    f = upload.file
    f.seek(0, 2)
    size = f.tell()
    f.seek(0)
    return InMemoryUploadedFile(
        file=f,
        field_name='file',
        name=upload.filename or 'upload.mp4',
        content_type=upload.content_type or 'video/mp4',
        size=size,
        charset=None,
    ), size


def _video_qs():
    return Video.objects.select_related('btv', 'reviewer').prefetch_related(
        'versions__uploaded_by', 'history__user', 'video_comments__user',
    )


def _get_video_or_404(video_id: int) -> Video:
    try:
        return _video_qs().get(pk=video_id)
    except Video.DoesNotExist:
        raise HTTPException(status_code=404, detail="Video không tồn tại.")


def _make_version(request: Request, ver: VideoVersion) -> VideoVersionOut:
    return VideoVersionOut(
        number=ver.number,
        uploadedAt=ver.uploaded_at,
        uploadedBy=ver.uploaded_by.name,
        file=_media_url(request, ver.file.name if ver.file else None),
        fileSize=ver.file_size,
        duration=ver.duration,
    )


def _make_history(h: HistoryEntry) -> HistoryEntryOut:
    return HistoryEntryOut(
        id=h.id,
        timestamp=h.timestamp,
        user=UserOut.model_validate(h.user),
        action=h.action,
        fromStatus=h.from_status,
        toStatus=h.to_status,
    )


def _make_comment(c: Comment) -> CommentOut:
    return CommentOut(
        id=c.id,
        videoId=c.video_id,
        user=UserOut.model_validate(c.user),
        text=c.text,
        timestamp=c.timestamp,
        resolved=c.resolved,
        createdAt=c.created_at,
    )


def _make_video_list(v: Video) -> VideoListOut:
    return VideoListOut(
        id=v.id,
        title=v.title,
        fileId=v.file_id,
        status=v.status,
        currentVersion=v.current_version,
        btv=UserOut.model_validate(v.btv),
        reviewer=UserOut.model_validate(v.reviewer) if v.reviewer else None,
        uploadedAt=v.uploaded_at,
        updatedAt=v.updated_at,
        thumbGradient=v.thumb_gradient,
        category=v.category,
        notes=v.notes,
        youtubeVideoId=v.youtube_video_id or None,
        youtubeUrl=v.youtube_url or None,
        youtubeUploadStatus=v.youtube_upload_status,
        youtubeUploadProgress=v.youtube_upload_progress,
    )


def _make_video_detail(request: Request, v: Video) -> VideoDetailOut:
    return VideoDetailOut(
        id=v.id,
        title=v.title,
        fileId=v.file_id,
        status=v.status,
        currentVersion=v.current_version,
        btv=UserOut.model_validate(v.btv),
        reviewer=UserOut.model_validate(v.reviewer) if v.reviewer else None,
        uploadedAt=v.uploaded_at,
        updatedAt=v.updated_at,
        thumbGradient=v.thumb_gradient,
        category=v.category,
        notes=v.notes,
        youtubeVideoId=v.youtube_video_id or None,
        youtubeUrl=v.youtube_url or None,
        youtubeUploadStatus=v.youtube_upload_status,
        youtubeUploadProgress=v.youtube_upload_progress,
        versions=[_make_version(request, ver) for ver in v.versions.all()],
        history=[_make_history(h) for h in v.history.all()],
    )


# ── video list / create ───────────────────────────────────────────────────────

@router.get("/videos/", response_model=list[VideoListOut])
def list_videos(
    status: Optional[str] = None,
    search: Optional[str] = None,
    category: Optional[str] = None,
    user: User = Depends(require_auth),
):
    qs = _video_qs()
    if user.has_role('btv') and not user.has_role('reviewer', 'final', 'admin'):
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
    return [_make_video_list(v) for v in qs]


@router.post("/videos/", response_model=VideoDetailOut)
def create_video(
    request: Request,
    title: str = Form(...),
    notes: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    thumb_gradient: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user: User = Depends(require_auth),
):
    if not user.has_role('btv'):
        raise HTTPException(status_code=403, detail="Chỉ BTV mới có thể upload video.")
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Vui lòng đính kèm file video (.mp4).")
    if not file.filename.lower().endswith('.mp4'):
        raise HTTPException(status_code=400, detail="Chỉ nhận file .mp4.")

    django_file, size = _wrap_file(file)
    if size > 4 * 1024 ** 3:
        raise HTTPException(status_code=400, detail="File quá lớn (tối đa 4 GB).")

    video = Video.objects.create(
        title=title,
        notes=notes or "",
        category=category or "ENCY CAM",
        thumb_gradient=thumb_gradient or random_gradient(),
        btv=user, status='pending', current_version=1,
    )
    VideoVersion.objects.create(
        video=video, number=1, uploaded_by=user,
        file=django_file, file_size=_format_size(size),
    )
    HistoryEntry.objects.create(video=video, user=user, action='Upload v1', to_status='pending')
    _audit(user, f'Upload mới "{video.title}" → v1', video)
    _notify(user, 'upload', 'Upload thành công ✅',
            f'Video "{video.title}" đã được upload thành công và đang chờ Reviewer duyệt.', video)
    _notify_role('reviewer', 'upload', 'Video mới cần review',
                 f'{user.name} vừa upload "{video.title}", đang chờ review.', video)
    tg.notify_upload(video.id, video.title, user.name, video.category)
    video.refresh_from_db()
    return _make_video_detail(request, _get_video_or_404(video.id))


# ── video detail / update ─────────────────────────────────────────────────────

@router.get("/videos/{video_id}/", response_model=VideoDetailOut)
def get_video(request: Request, video_id: int, user: User = Depends(require_auth)):
    return _make_video_detail(request, _get_video_or_404(video_id))


@router.patch("/videos/{video_id}/", response_model=VideoDetailOut)
def update_video(
    request: Request,
    video_id: int,
    body: VideoUpdateIn,
    user: User = Depends(require_auth),
):
    if not user.has_role('btv', 'admin'):
        raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa video này.")
    video = _get_video_or_404(video_id)
    if user.has_role('btv') and not user.has_role('admin') and video.btv_id != user.id:
        raise HTTPException(status_code=403, detail="Bạn không sở hữu video này.")
    for field in ('title', 'notes', 'category', 'thumb_gradient'):
        val = getattr(body, field)
        if val is not None:
            setattr(video, field, val)
    video.save()
    return _make_video_detail(request, _get_video_or_404(video_id))


# ── workflow actions ──────────────────────────────────────────────────────────

@router.post("/videos/{video_id}/start-review/", response_model=VideoDetailOut)
def start_review(request: Request, video_id: int, user: User = Depends(require_auth)):
    if not user.has_role('reviewer'):
        raise HTTPException(status_code=403, detail="Chỉ Reviewer mới có thể bắt đầu review.")
    video = _get_video_or_404(video_id)
    if video.status != 'pending':
        raise HTTPException(status_code=400,
            detail=f'Chỉ có thể review video ở trạng thái "Chờ review" (hiện tại: {video.status}).')
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
    return _make_video_detail(request, _get_video_or_404(video_id))


@router.post("/videos/{video_id}/request-revision/", response_model=VideoDetailOut)
def request_revision(
    request: Request,
    video_id: int,
    body: RevisionNoteIn,
    user: User = Depends(require_auth),
):
    if not user.has_role('reviewer'):
        raise HTTPException(status_code=403, detail="Chỉ Reviewer mới có thể yêu cầu sửa.")
    video = _get_video_or_404(video_id)
    if video.status not in ('reviewing', 'needs_revision'):
        raise HTTPException(status_code=400,
            detail='Chỉ có thể yêu cầu sửa khi video đang ở trạng thái "Đang review".')
    if not body.note.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập tóm tắt yêu cầu sửa.")
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
    tg.notify_revision(video.id, video.title, user.name, body.note, video.btv)
    return _make_video_detail(request, _get_video_or_404(video_id))


@router.post("/videos/{video_id}/send-to-final/", response_model=VideoDetailOut)
def send_to_final(request: Request, video_id: int, user: User = Depends(require_auth)):
    if not user.has_role('reviewer'):
        raise HTTPException(status_code=403, detail="Chỉ Reviewer mới có thể chuyển lên Duyệt cuối.")
    video = _get_video_or_404(video_id)
    if video.status not in ('reviewing', 'needs_revision'):
        raise HTTPException(status_code=400, detail="Chỉ có thể chuyển lên Duyệt cuối khi video đang review.")
    open_comments = video.video_comments.filter(resolved=False).count()
    if open_comments:
        raise HTTPException(status_code=400,
            detail=f'Còn {open_comments} comment chưa resolve. Hãy xử lý hết trước khi chuyển.')
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
    tg.notify_send_to_final(video.id, video.title, user.name, video.category)
    return _make_video_detail(request, _get_video_or_404(video_id))


@router.post("/videos/{video_id}/approve/", response_model=VideoDetailOut)
def approve_video(request: Request, video_id: int, user: User = Depends(require_auth)):
    if not user.has_role('final', 'admin'):
        raise HTTPException(status_code=403, detail="Chỉ Duyệt cuối hoặc Admin mới có thể approve.")
    video = _get_video_or_404(video_id)
    if video.status != 'reviewed':
        raise HTTPException(status_code=400, detail='Chỉ có thể approve video ở trạng thái "Đã review".')
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
    # Tự động đăng lên YouTube trong background
    try:
        from youtube_service import upload_async
        upload_async(video.id)
    except Exception:
        pass  # Không block approve nếu YouTube lỗi
    tg.notify_approved(video.id, video.title, user.name, video.btv, video.reviewer)
    return _make_video_detail(request, _get_video_or_404(video_id))


@router.post("/videos/{video_id}/reject/", response_model=VideoDetailOut)
def reject_video(
    request: Request,
    video_id: int,
    body: RejectReasonIn,
    user: User = Depends(require_auth),
):
    if not user.has_role('final', 'admin'):
        raise HTTPException(status_code=403, detail="Chỉ Duyệt cuối hoặc Admin mới có thể reject.")
    video = _get_video_or_404(video_id)
    if video.status != 'reviewed':
        raise HTTPException(status_code=400, detail='Chỉ có thể reject video ở trạng thái "Đã review".')
    if not body.reason.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập lý do từ chối.")
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
    tg.notify_rejected(video.id, video.title, user.name, body.reason, video.btv, video.reviewer)
    return _make_video_detail(request, _get_video_or_404(video_id))


@router.get("/videos/{video_id}/download/")
def download_video(video_id: int, user: User = Depends(require_auth)):
    if not user.has_role('admin', 'final'):
        raise HTTPException(status_code=403, detail="Chỉ Admin hoặc Duyệt cuối mới có thể tải video về máy.")
    video = _get_video_or_404(video_id)
    if video.status != 'approved':
        raise HTTPException(status_code=403, detail="Chỉ có thể tải video đã được duyệt cuối (Approved).")
    try:
        ver = video.versions.get(number=video.current_version)
    except VideoVersion.DoesNotExist:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên bản video hiện tại.")
    if not ver.file or not ver.file.name:
        raise HTTPException(status_code=404, detail="Video chưa có file.")
    try:
        file_path = ver.file.path
    except ValueError:
        raise HTTPException(status_code=404, detail="File video không có đường dẫn hợp lệ.")
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File video không tồn tại trên server.")
    _audit(user, f'Tải xuống "{video.title}" v{video.current_version}', video)
    safe_title = re.sub(r'[^\w\s\-]', '', video.title).strip()[:80]
    filename = f"{video.file_id}_{safe_title}_v{video.current_version}.mp4"
    return FileResponse(path=file_path, media_type='video/mp4', filename=filename)


@router.post("/videos/{video_id}/reupload/", response_model=VideoDetailOut)
def reupload_video(
    request: Request,
    video_id: int,
    notes: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user: User = Depends(require_auth),
):
    if not user.has_role('btv'):
        raise HTTPException(status_code=403, detail="Chỉ BTV mới có thể re-upload.")
    video = _get_video_or_404(video_id)
    if video.btv_id != user.id:
        raise HTTPException(status_code=403, detail="Bạn không sở hữu video này.")
    if video.status not in ('needs_revision', 'rejected'):
        raise HTTPException(status_code=400,
            detail='Chỉ có thể re-upload khi video ở trạng thái "Cần sửa" hoặc "Từ chối".')
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Vui lòng đính kèm file video (.mp4).")
    if not file.filename.lower().endswith('.mp4'):
        raise HTTPException(status_code=400, detail="Chỉ nhận file .mp4.")

    django_file, size = _wrap_file(file)
    if size > 4 * 1024 ** 3:
        raise HTTPException(status_code=400, detail="File quá lớn (tối đa 4 GB).")

    old = video.status
    new_ver = video.current_version + 1
    VideoVersion.objects.create(
        video=video, number=new_ver, uploaded_by=user,
        file=django_file, file_size=_format_size(size),
    )
    video.current_version = new_ver
    video.status = 'reviewing'
    update_fields = ['current_version', 'status', 'updated_at']
    if category:
        video.category = category
        update_fields.append('category')
    if notes is not None:
        video.notes = notes
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
    return _make_video_detail(request, _get_video_or_404(video_id))


# ── comments ──────────────────────────────────────────────────────────────────

@router.get("/videos/{video_id}/comments/", response_model=list[CommentOut])
def list_comments(video_id: int, user: User = Depends(require_auth)):
    qs = Comment.objects.filter(video_id=video_id).select_related('user').order_by('created_at')
    return [_make_comment(c) for c in qs]


@router.post("/videos/{video_id}/comments/", response_model=CommentOut)
def create_comment(video_id: int, body: CommentCreateIn, user: User = Depends(require_auth)):
    if user.has_role('btv') and not user.has_role('reviewer', 'final', 'admin'):
        raise HTTPException(status_code=403,
            detail="BTV không thể thêm comment. Vui lòng re-upload để phản hồi.")
    try:
        video = Video.objects.select_related('btv').get(pk=video_id)
    except Video.DoesNotExist:
        raise HTTPException(status_code=404, detail="Video không tồn tại.")
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Nội dung comment không được để trống.")
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
    return _make_comment(comment)


@router.patch("/comments/{comment_id}/resolve/", response_model=CommentOut)
def resolve_comment(comment_id: int, user: User = Depends(require_auth)):
    if not user.has_role('reviewer', 'final', 'admin'):
        raise HTTPException(status_code=403,
            detail="Chỉ Reviewer hoặc Duyệt cuối mới có thể resolve comment.")
    try:
        comment = Comment.objects.select_related('user').get(pk=comment_id)
    except Comment.DoesNotExist:
        raise HTTPException(status_code=404, detail="Comment không tồn tại.")
    if comment.resolved:
        raise HTTPException(status_code=400, detail="Comment này đã được resolve rồi.")
    comment.resolved = True
    comment.save(update_fields=['resolved'])
    return _make_comment(comment)


# ── dashboard ─────────────────────────────────────────────────────────────────

def _recent_audit_data() -> list:
    from audit.models import AuditEntry as AE
    from audit.schemas import AuditEntryOut
    entries = AE.objects.select_related('user').order_by('-timestamp')[:5]
    return [AuditEntryOut.model_validate(e).model_dump() for e in entries]


@router.get("/dashboard/")
def dashboard(user: User = Depends(require_auth)):
    all_v = Video.objects.select_related('btv', 'reviewer')

    if user.has_role('btv') and not user.has_role('reviewer', 'final', 'admin'):
        my = all_v.filter(btv=user)
        data = {
            "role": user.role,
            "stats": {
                "total": my.count(),
                "reviewing": my.filter(status='reviewing').count(),
                "needsRevision": my.filter(status='needs_revision').count(),
                "approved": my.filter(status='approved').count(),
                "rejected": my.filter(status='rejected').count(),
                "pending": my.filter(status='pending').count(),
            },
            "recentVideos": [_make_video_list(v).model_dump() for v in my.order_by('-updated_at')[:5]],
            "recentActivity": _recent_audit_data(),
        }
        return JSONResponse(content=jsonable_encoder(data))

    if user.has_role('reviewer') and not user.has_role('final', 'admin'):
        queue = all_v.filter(status__in=('pending', 'reviewing', 'needs_revision'))
        data = {
            "role": user.role,
            "stats": {
                "pending": all_v.filter(status='pending').count(),
                "reviewing": all_v.filter(status='reviewing').count(),
                "reviewed": all_v.filter(status__in=('reviewed', 'approved')).count(),
                "timeoutCount": 0,
            },
            "queue": [_make_video_list(v).model_dump() for v in queue.order_by('-uploaded_at')[:5]],
            "recentActivity": _recent_audit_data(),
        }
        return JSONResponse(content=jsonable_encoder(data))

    if user.has_role('final') and not user.has_role('admin'):
        waiting = all_v.filter(status='reviewed')
        data = {
            "role": user.role,
            "stats": {
                "waitingApprove": waiting.count(),
                "approved": all_v.filter(status='approved').count(),
                "rejected": all_v.filter(status='rejected').count(),
            },
            "waitingVideos": [_make_video_list(v).model_dump() for v in waiting.order_by('-updated_at')[:5]],
            "recentActivity": _recent_audit_data(),
        }
        return JSONResponse(content=jsonable_encoder(data))

    # admin
    users_qs = User.objects.all()
    data = {
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
        "recentVideos": [_make_video_list(v).model_dump() for v in all_v.order_by('-updated_at')[:6]],
        "recentActivity": _recent_audit_data(),
    }
    return JSONResponse(content=jsonable_encoder(data))
