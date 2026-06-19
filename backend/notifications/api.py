from typing import Optional
from ninja import Router
from notifications.models import Notification
from notifications.schemas import NotificationOut, UnreadCountOut

router = Router(tags=["notifications"])


@router.get("/notifications/", response=list[NotificationOut])
def list_notifications(request, read: Optional[str] = None):
    qs = Notification.objects.filter(user=request.auth).select_related('video')
    if read == 'true':
        qs = qs.filter(read=True)
    elif read == 'false':
        qs = qs.filter(read=False)
    # None means no filter
    qs = qs.order_by('-created_at')

    result = []
    for n in qs:
        result.append({
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "read": n.read,
            "createdAt": n.created_at,
            "videoId": n.video_id,
            "videoTitle": n.video.title if n.video_id and n.video else n.video_title,
        })
    return result


@router.patch("/notifications/{notification_id}/read/", response=NotificationOut)
def mark_read(request, notification_id: int):
    try:
        n = Notification.objects.get(pk=notification_id, user=request.auth)
    except Notification.DoesNotExist:
        from ninja.errors import HttpError
        raise HttpError(404, "Thông báo không tồn tại.")
    n.read = True
    n.save(update_fields=['read'])
    return {
        "id": n.id, "type": n.type, "title": n.title, "message": n.message,
        "read": n.read, "createdAt": n.created_at,
        "videoId": n.video_id, "videoTitle": n.video_title,
    }


@router.post("/notifications/read-all/")
def mark_all_read(request):
    updated = Notification.objects.filter(user=request.auth, read=False).update(read=True)
    return {"detail": f"{updated} thông báo đã được đánh dấu đã đọc."}


@router.get("/notifications/unread-count/", response=UnreadCountOut)
def unread_count(request):
    count = Notification.objects.filter(user=request.auth, read=False).count()
    return {"count": count}
