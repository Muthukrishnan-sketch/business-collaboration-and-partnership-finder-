from collections import Counter

from fastapi import APIRouter

from app.core.supabase_client import get_supabase

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def get_summary():
    """
    Aggregate stats computed in Python over small result sets — fine at this
    scale (portfolio/demo data volume). If this grows large, move to a
    Postgres view or RPC that aggregates in the database instead.
    """
    supabase = get_supabase()

    businesses = supabase.table("businesses").select("id, category, is_verified").execute().data or []
    connections = supabase.table("connections").select("id, status").execute().data or []
    proposals = supabase.table("proposals").select("id").execute().data or []

    category_counts = Counter(b["category"] for b in businesses)
    status_counts = Counter(c["status"] for c in connections)

    return {
        "total_businesses": len(businesses),
        "verified_businesses": sum(1 for b in businesses if b["is_verified"]),
        "pending_verification": sum(1 for b in businesses if not b["is_verified"]),
        "businesses_by_category": dict(category_counts),
        "total_connections": len(connections),
        "connections_by_status": dict(status_counts),
        "total_proposals_generated": len(proposals),
    }