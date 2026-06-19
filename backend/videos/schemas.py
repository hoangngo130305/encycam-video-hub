from datetime import datetime
from typing import Optional
from accounts.schemas import UserOut
from shared import BaseSchema


class VideoVersionOut(BaseSchema):
    number: int
    uploadedAt: datetime
    uploadedBy: str
    file: Optional[str]
    fileSize: str
    duration: str


class CommentOut(BaseSchema):
    id: int
    videoId: int
    user: UserOut
    text: str
    timestamp: Optional[str] = None
    resolved: bool
    createdAt: datetime


class HistoryEntryOut(BaseSchema):
    id: int
    timestamp: datetime
    user: UserOut
    action: str
    fromStatus: Optional[str] = None
    toStatus: Optional[str] = None


class VideoListOut(BaseSchema):
    id: int
    title: str
    fileId: str
    status: str
    currentVersion: int
    btv: UserOut
    reviewer: Optional[UserOut] = None
    uploadedAt: datetime
    updatedAt: datetime
    thumbGradient: str
    category: str
    notes: str


class VideoDetailOut(VideoListOut):
    versions: list[VideoVersionOut] = []
    history: list[HistoryEntryOut] = []


class CommentCreateIn(BaseSchema):
    text: str
    timestamp: Optional[str] = None


class RevisionNoteIn(BaseSchema):
    note: str


class RejectReasonIn(BaseSchema):
    reason: str
