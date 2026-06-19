from typing import Optional
from fastapi import APIRouter, HTTPException, Depends

from notifications.models import Notification
from notifications.schemas import NotificationOut, UnreadCountOut
from fastapi_auth import require_auth
from accounts.models import User

router = APIRouter(tags=["notifications"])


@router.get("/notifications/", response_model=list[NotificationOut])
def list_notifications(read: Optional[str] = None, user: User = Depends(require_auth)):
    qs = Notification.objects.filter(user=user).select_related('video')
    if read == 'true':
        qs = qs.filter(read=True)
    elif read == 'false':
        qs = qs.filter(read=False)
    qs = qs.order_by('-created_at')
    return [
        NotificationOut(
            id=n.id,
            type=n.type,
            title=n.title,
            message=n.message,
            read=n.read,
            createdAt=n.created_at,
            videoId=n.video_id,
            videoTitle=n.video.title if n.video_id and n.video else n.video_title,
        )
        for n in qs
    ]


@router.patch("/notifications/{notification_id}/read/", response_model=NotificationOut)
def mark_read(notification_id: int, user: User = Depends(require_auth)):
    try:
        n = Notification.objects.get(pk=notification_id, user=user)
    except Notification.DoesNotExist:
        raise HTTPException(status_code=404, detail="Thông báo không tồn tại.")
    n.read = True
    n.save(update_fields=['read'])
    return NotificationOut(
        id=n.id, type=n.type, title=n.title, message=n.message,
        read=n.read, createdAt=n.created_at,
        videoId=n.video_id, videoTitle=n.video_title,
    )


@router.post("/notifications/read-all/")
def mark_all_read(user: User = Depends(require_auth)):
    updated = Notification.objects.filter(user=user, read=False).update(read=True)
    return {"detail": f"{updated} thông báo đã được đánh dấu đã đọc."}


@router.get("/notifications/unread-count/", response_model=UnreadCountOut)
def unread_count(user: User = Depends(require_auth)):
    count = Notification.objects.filter(user=user, read=False).count()
    return UnreadCountOut(count=count)
