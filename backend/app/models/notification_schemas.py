from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: UUID
    business_id: UUID
    type: str
    message: str
    related_connection_id: Optional[UUID] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True