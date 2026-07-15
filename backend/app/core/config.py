from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "Threadwork API"
    ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""

    # Auth (Clerk / Auth.js)
    CLERK_JWKS_URL: str = ""
    CLERK_ISSUER: str = ""

    # AI providers
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Maps
    GOOGLE_MAPS_API_KEY: str = ""

    # Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    # CORS — comma-separated list, e.g. "http://localhost:3000,https://threadwork.vercel.app"
    FRONTEND_ORIGINS: str = "http://localhost:3000"


settings = Settings()


def get_cors_origins() -> list[str]:
    return [origin.strip() for origin in settings.FRONTEND_ORIGINS.split(",") if origin.strip()]