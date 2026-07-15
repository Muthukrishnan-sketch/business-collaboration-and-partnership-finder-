from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.core.supabase_client import get_supabase
from app.models.schemas import MessageIn, MessageOut

router = APIRouter(prefix="/connections", tags=["messages"])


def _get_or_create_conversation(supabase, connection_id: UUID) -> str:
    existing = (
        supabase.table("conversations")
        .select("*")
        .eq("connection_id", str(connection_id))
        .execute()
    )
    if existing.data:
        return existing.data[0]["id"]

    created = supabase.table("conversations").insert({"connection_id": str(connection_id)}).execute()
    if not created.data:
        raise HTTPException(status_code=400, detail="Failed to start conversation")
    return created.data[0]["id"]


@router.get("/{connection_id}/messages", response_model=list[MessageOut])
def get_messages(connection_id: UUID):
    supabase = get_supabase()
    conversation = (
        supabase.table("conversations")
        .select("*")
        .eq("connection_id", str(connection_id))
        .execute()
    )
    if not conversation.data:
        return []

    result = (
        supabase.table("messages")
        .select("*")
        .eq("conversation_id", conversation.data[0]["id"])
        .order("created_at")
        .execute()
    )
    return result.data or []


@router.post("/{connection_id}/messages", response_model=MessageOut)
def send_message(connection_id: UUID, payload: MessageIn):
    supabase = get_supabase()

    # Confirm the connection exists and is accepted before allowing messages.
    connection = supabase.table("connections").select("*").eq("id", str(connection_id)).single().execute()
    if not connection.data:
        raise HTTPException(status_code=404, detail="Connection not found")
    if connection.data["status"] != "accepted":
        raise HTTPException(status_code=400, detail="Can only message accepted partnerships")

    conversation_id = _get_or_create_conversation(supabase, connection_id)

    row = {
        "conversation_id": conversation_id,
        "sender_business_id": str(payload.sender_business_id),
        "type": "text",
        "content": payload.content,
    }
    result = supabase.table("messages").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to send message")
    return result.data[0]