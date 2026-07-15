from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.core.supabase_client import get_supabase
from app.models.notification_schemas import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/{business_id}", response_model=list[NotificationOut])
def list_notifications(business_id: UUID, unread_only: bool = False):
    supabase = get_supabase()
    query = (
        supabase.table("notifications")
        .select("*")
        .eq("business_id", str(business_id))
        .order("created_at", desc=True)
    )
    if unread_only:
        query = query.eq("is_read", False)
    result = query.execute()
    return result.data or []


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: UUID):
    supabase = get_supabase()
    result = (
        supabase.table("notifications")
        .update({"is_read": True})
        .eq("id", str(notification_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return result.data[0]


@router.patch("/{business_id}/read-all")
def mark_all_read(business_id: UUID):
    supabase = get_supabase()
    supabase.table("notifications").update({"is_read": True}).eq("business_id", str(business_id)).eq(
        "is_read", False
    ).execute()
    return {"marked_read": True}