"""
Matching engine.

v0 (this scaffold): rule-based scoring using PostGIS proximity + a static
complementary-category map. This gets the product working end-to-end.

v1 (next step): replace/augment `category_fit_score` and `reasoning_tags`
with an LLM call (see services/ai_matching.py, to be added) that reasons
over business descriptions, review sentiment, and social data.
"""

from app.core.supabase_client import get_supabase

# Which categories are natural partners for each category.
# e.g. a wedding photographer pairs well with decorators, caterers, makeup artists.
COMPLEMENTARY_CATEGORIES: dict[str, list[str]] = {
    "photography": ["videography", "decor", "makeup_artist", "venue", "florist", "event_planner"],
    "videography": ["photography", "decor", "makeup_artist", "venue", "event_planner"],
    "catering": ["venue", "decor", "event_planner", "bakery", "florist"],
    "decor": ["photography", "videography", "catering", "florist", "venue", "event_planner"],
    "makeup_artist": ["photography", "videography", "salon", "event_planner"],
    "venue": ["catering", "decor", "dj_music", "event_planner", "photography"],
    "florist": ["photography", "decor", "catering", "venue"],
    "gym": ["nutritionist", "physiotherapist"],
    "nutritionist": ["gym", "physiotherapist"],
    "physiotherapist": ["gym", "nutritionist"],
    "event_planner": ["catering", "decor", "venue", "photography", "dj_music", "florist"],
    "dj_music": ["venue", "event_planner", "catering"],
    "bakery": ["catering", "event_planner"],
    "salon": ["makeup_artist", "photography"],
}


def compute_matches_for_business(source: dict, limit: int = 10, radius_km: float = 15) -> list[dict]:
    supabase = get_supabase()
    lat, lng = source["lat"], source["lng"]

    nearby = supabase.rpc(
        "nearby_businesses",
        {
            "origin_lat": lat,
            "origin_lng": lng,
            "radius_meters": int(radius_km * 1000),
            "target_category": None,
        },
    ).execute()

    candidates = [row for row in (nearby.data or []) if row["id"] != source["id"]]

    complementary = set(COMPLEMENTARY_CATEGORIES.get(source["category"], []))

    scored = []
    for c in candidates:
        proximity_score = max(0, 100 - (c["distance_meters"] / (radius_km * 1000)) * 100)
        category_fit_score = 100 if c["category"] in complementary else 30
        # Placeholder until sentiment/social pipelines are wired (services/ai_matching.py)
        sentiment_overlap_score = 70
        social_engagement_score = 60

        overall = (
            proximity_score * 0.35
            + category_fit_score * 0.35
            + sentiment_overlap_score * 0.15
            + social_engagement_score * 0.15
        )

        full_business = (
            supabase.table("businesses_with_coords").select("*").eq("id", c["id"]).single().execute()
        )

        scored.append(
            {
                "business": full_business.data,
                "overall_score": round(overall, 1),
                "proximity_score": round(proximity_score, 1),
                "category_fit_score": round(category_fit_score, 1),
                "sentiment_overlap_score": sentiment_overlap_score,
                "social_engagement_score": social_engagement_score,
                "reasoning_tags": _reasoning_tags(c, source, complementary),
                "distance_km": round(c["distance_meters"] / 1000, 2),
            }
        )

    scored.sort(key=lambda x: x["overall_score"], reverse=True)
    return scored[:limit]


def _reasoning_tags(candidate: dict, source: dict, complementary: set[str]) -> list[str]:
    tags = []
    if candidate["category"] in complementary:
        tags.append(f"Complements your {source['category'].replace('_', ' ')} business")
    if candidate["distance_meters"] < 5000:
        tags.append("Within 5km")
    return tags