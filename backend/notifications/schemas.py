from datetime import datetime
from typing import Optional
from shared import BaseSchema


class NotificationOut(BaseSchema):
    id: int
    type: str
    title: str
    message: str
    read: bool
    createdAt: datetime
    videoId: Optional[int] = None
    videoTitle: Optional[str] = None


class UnreadCountOut(BaseSchema):
    count: int
