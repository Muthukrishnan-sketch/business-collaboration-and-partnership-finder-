from functools import lru_cache

from supabase import create_client, Client

from app.core.config import settings


@lru_cache
def get_supabase() -> Client:
    """
    Returns a cached Supabase client using the service role key.
    Use ONLY on the backend — never expose the service role key to the frontend.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. "
            "Copy .env.example to .env and fill in your Supabase project credentials."
        )
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
