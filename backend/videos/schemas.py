from datetime import datetime
from typing import Optional
from accounts.schemas import UserOut
from shared import BaseSchema


class CategoryOut(BaseSchema):
    id: int
    name: str
    youtubePlaylistId: str
    youtubeCategoryId: str
    forSale: bool = False


class SaleProjectOut(BaseSchema):
    id: int
    name: str
    category: CategoryOut
    sale: Optional[UserOut] = None
    saleManager: UserOut
    createdAt: datetime


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
    youtubeVideoId: Optional[str] = None
    youtubeUrl: Optional[str] = None
    youtubeUploadStatus: str = 'idle'
    youtubeUploadProgress: int = 0


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


class SaleVideoListOut(BaseSchema):
    id: int
    title: str
    fileId: str
    status: str
    currentVersion: int
    uploader: UserOut
    saleProject: SaleProjectOut
    uploadedAt: datetime
    updatedAt: datetime
    thumbGradient: str
    notes: str
    youtubeVideoId: Optional[str] = None
    youtubeUrl: Optional[str] = None
    youtubeUploadStatus: str = 'idle'
    youtubeUploadProgress: int = 0


class SaleVideoDetailOut(SaleVideoListOut):
    versions: list[VideoVersionOut] = []
    history: list[HistoryEntryOut] = []
