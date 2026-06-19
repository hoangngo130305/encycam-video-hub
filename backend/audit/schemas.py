from datetime import datetime
from typing import Optional
from shared import BaseSchema
from accounts.schemas import UserOut


class AuditEntryOut(BaseSchema):
    id: int
    timestamp: datetime
    user: UserOut
    action: str
    resourceType: str
    resourceId: Optional[int] = None
    details: Optional[str] = None
