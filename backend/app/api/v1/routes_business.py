from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.core.supabase_client import get_supabase
from app.models.schemas import BusinessCreate, BusinessOut

router = APIRouter(prefix="/businesses", tags=["businesses"])


@router.post("", response_model=BusinessOut)
def create_business(payload: BusinessCreate, owner_user_id: str = Query(...)):
    """
    Create a business profile. `owner_user_id` comes from the authenticated
    session (Clerk/Auth.js) — passed as a query param here for scaffold simplicity;
    replace with a proper auth dependency before shipping.
    """
    supabase = get_supabase()
    row = {
        "owner_user_id": owner_user_id,
        "name": payload.name,
        "category": payload.category.value,
        "secondary_categories": [c.value for c in payload.secondary_categories],
        "description": payload.description,
        "location": f"POINT({payload.lng} {payload.lat})",
        "address": payload.address,
        "city": payload.city,
        "instagram_handle": payload.instagram_handle,
        "website": payload.website,
        "phone": payload.phone,
    }
    result = supabase.table("businesses").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create business")

    # Re-fetch via the view so the response includes lat/lng as plain floats
    # (the raw insert result only has the PostGIS `location` geography value,
    # which doesn't match the BusinessOut response schema).
    new_id = result.data[0]["id"]
    view_result = (
        supabase.table("businesses_with_coords").select("*").eq("id", new_id).single().execute()
    )
    return view_result.data


@router.get("/{business_id}", response_model=BusinessOut)
def get_business(business_id: UUID):
    supabase = get_supabase()
    result = (
        supabase.table("businesses_with_coords").select("*").eq("id", str(business_id)).single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")
    return result.data


@router.get("", response_model=list[BusinessOut])
def list_businesses(category: str | None = None, city: str | None = None, limit: int = 20):
    supabase = get_supabase()
    query = supabase.table("businesses_with_coords").select("*").limit(limit)
    if category:
        query = query.eq("category", category)
    if city:
        query = query.eq("city", city)
    result = query.execute()
    return result.data or []


@router.patch("/{business_id}/verify", response_model=BusinessOut)
def verify_business(business_id: UUID, verified: bool = True):
    """
    Admin approval action. NOTE: not yet restricted to admin users specifically —
    same open-trust model as the rest of the scaffold until backend auth is added.
    """
    supabase = get_supabase()
    result = (
        supabase.table("businesses").update({"is_verified": verified}).eq("id", str(business_id)).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")

    view_result = (
        supabase.table("businesses_with_coords").select("*").eq("id", str(business_id)).single().execute()
    )
    return view_result.data


@router.delete("/{business_id}")
def delete_business(business_id: UUID):
    supabase = get_supabase()
    result = supabase.table("businesses").delete().eq("id", str(business_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"deleted": True}