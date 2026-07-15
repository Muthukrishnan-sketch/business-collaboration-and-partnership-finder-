from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BusinessCategory(str, Enum):
    photography = "photography"
    videography = "videography"
    catering = "catering"
    decor = "decor"
    makeup_artist = "makeup_artist"
    venue = "venue"
    florist = "florist"
    gym = "gym"
    nutritionist = "nutritionist"
    physiotherapist = "physiotherapist"
    event_planner = "event_planner"
    dj_music = "dj_music"
    bakery = "bakery"
    salon = "salon"
    other = "other"


class ConnectionStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    blocked = "blocked"


class BusinessBase(BaseModel):
    name: str
    category: BusinessCategory
    secondary_categories: list[BusinessCategory] = Field(default_factory=list)
    description: Optional[str] = None
    lat: float
    lng: float
    address: Optional[str] = None
    city: Optional[str] = None
    instagram_handle: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None


class BusinessCreate(BusinessBase):
    pass


class BusinessOut(BusinessBase):
    id: UUID
    avg_rating: float = 0
    review_count: int = 0
    is_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class MatchCandidate(BaseModel):
    business: BusinessOut
    overall_score: float
    proximity_score: Optional[float] = None
    category_fit_score: Optional[float] = None
    sentiment_overlap_score: Optional[float] = None
    social_engagement_score: Optional[float] = None
    reasoning_tags: list[str] = Field(default_factory=list)
    distance_km: Optional[float] = None


class ConnectionRequestIn(BaseModel):
    recipient_id: UUID
    message: Optional[str] = None


class ConnectionOut(BaseModel):
    id: UUID
    requester_id: UUID
    recipient_id: UUID
    status: ConnectionStatus
    message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProposalGenerateIn(BaseModel):
    connection_id: UUID
    context: Optional[str] = None  # extra context to steer the AI proposal


class ProposalOut(BaseModel):
    id: UUID
    connection_id: UUID
    title: str
    summary: str
    terms: dict
    created_at: datetime


class MessageIn(BaseModel):
    sender_business_id: UUID
    content: str


class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_business_id: UUID
    type: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True