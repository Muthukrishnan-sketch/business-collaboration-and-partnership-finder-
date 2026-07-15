from fastapi import APIRouter, HTTPException

from app.core.supabase_client import get_supabase
from app.models.schemas import ProposalGenerateIn, ProposalOut
from app.services.ai_proposal import generate_collaboration_proposal, build_fallback_proposal

router = APIRouter(prefix="/proposals", tags=["proposals"])


@router.post("", response_model=ProposalOut)
def create_proposal(payload: ProposalGenerateIn):
    supabase = get_supabase()

    connection = (
        supabase.table("connections").select("*").eq("id", str(payload.connection_id)).single().execute()
    )
    if not connection.data:
        raise HTTPException(status_code=404, detail="Connection not found")

    a = supabase.table("businesses").select("*").eq("id", connection.data["requester_id"]).single().execute()
    b = supabase.table("businesses").select("*").eq("id", connection.data["recipient_id"]).single().execute()

    try:
        proposal_content = generate_collaboration_proposal(a.data, b.data, payload.context)
    except Exception as exc:
        # AI provider unavailable (rate limit, no credits, network, etc.) — fall back
        # to a simple template so the feature still works end-to-end. Swap back to
        # the AI-generated version once a provider key is reliably working.
        print(f"[proposals] AI generation failed, using fallback template: {exc}")
        proposal_content = build_fallback_proposal(a.data, b.data, payload.context)

    row = {
        "connection_id": str(payload.connection_id),
        "title": proposal_content["title"],
        "summary": proposal_content["summary"],
        "terms": proposal_content["terms"],
    }
    result = supabase.table("proposals").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to save proposal")
    return result.data[0]