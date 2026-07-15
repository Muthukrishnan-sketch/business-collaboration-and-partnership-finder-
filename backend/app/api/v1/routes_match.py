from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.core.supabase_client import get_supabase
from app.models.schemas import MatchCandidate
from app.services.matching import compute_matches_for_business

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("/{business_id}", response_model=list[MatchCandidate])
def get_matches(business_id: UUID, limit: int = 10, radius_km: float = 15):
    """
    Returns ranked partner recommendations for a given business.
    Combines: geospatial proximity (PostGIS), category complementarity rules,
    and (once wired) AI-generated compatibility reasoning.
    """
    supabase = get_supabase()
    source = (
        supabase.table("businesses_with_coords").select("*").eq("id", str(business_id)).single().execute()
    )
    if not source.data:
        raise HTTPException(status_code=404, detail="Business not found")

    return compute_matches_for_business(source.data, limit=limit, radius_km=radius_km)