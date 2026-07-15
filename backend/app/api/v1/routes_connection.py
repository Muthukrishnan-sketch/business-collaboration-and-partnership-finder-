from uuid import UUID

from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError

from app.core.supabase_client import get_supabase
from app.models.schemas import ConnectionOut, ConnectionRequestIn

router = APIRouter(prefix="/connections", tags=["connections"])


@router.post("", response_model=ConnectionOut)
def create_connection(payload: ConnectionRequestIn, requester_id: UUID):
    supabase = get_supabase()
    row = {
        "requester_id": str(requester_id),
        "recipient_id": str(payload.recipient_id),
        "message": payload.message,
        "status": "pending",
    }
    try:
        result = supabase.table("connections").insert(row).execute()
    except APIError as exc:
        if exc.code == "23505":
            # A connection between these two businesses (in this direction)
            # already exists — return it instead of erroring, so re-sending
            # a request is a harmless no-op rather than a crash.
            existing = (
                supabase.table("connections")
                .select("*")
                .eq("requester_id", str(requester_id))
                .eq("recipient_id", str(payload.recipient_id))
                .single()
                .execute()
            )
            if existing.data:
                return existing.data
            raise HTTPException(status_code=409, detail="Connection already exists.")
        raise

    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create connection request")

    new_connection = result.data[0]
    _notify(
        supabase,
        business_id=str(payload.recipient_id),
        type_="connection_request",
        message="You have a new partnership request.",
        connection_id=new_connection["id"],
    )
    return new_connection


@router.patch("/{connection_id}/respond", response_model=ConnectionOut)
def respond_to_connection(connection_id: UUID, accept: bool):
    supabase = get_supabase()
    new_status = "accepted" if accept else "declined"
    result = (
        supabase.table("connections")
        .update({"status": new_status, "responded_at": "now()"})
        .eq("id", str(connection_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Connection not found")

    updated = result.data[0]
    if accept:
        _notify(
            supabase,
            business_id=updated["requester_id"],
            type_="connection_accepted",
            message="Your partnership request was accepted.",
            connection_id=updated["id"],
        )
    return updated


def _notify(supabase, business_id: str, type_: str, message: str, connection_id: str):
    supabase.table("notifications").insert(
        {
            "business_id": business_id,
            "type": type_,
            "message": message,
            "related_connection_id": connection_id,
        }
    ).execute()


@router.get("/inbox/{business_id}", response_model=list[ConnectionOut])
def get_inbox(business_id: UUID):
    supabase = get_supabase()
    result = (
        supabase.table("connections")
        .select("*")
        .eq("recipient_id", str(business_id))
        .eq("status", "pending")
        .execute()
    )
    return result.data or []


@router.get("/for-business/{business_id}", response_model=list[ConnectionOut])
def get_connections_for_business(business_id: UUID, status: str | None = None):
    """
    All connections involving this business, in either direction, optionally
    filtered by status (e.g. 'accepted'). Used to show active partnerships,
    not just pending inbound requests.
    """
    supabase = get_supabase()
    query = (
        supabase.table("connections")
        .select("*")
        .or_(f"requester_id.eq.{business_id},recipient_id.eq.{business_id}")
    )
    if status:
        query = query.eq("status", status)
    result = query.execute()
    return result.data or []