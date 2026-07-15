from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings, get_cors_origins
from app.api.v1 import (
    routes_business,
    routes_match,
    routes_connection,
    routes_proposal,
    routes_message,
    routes_notification,
    routes_analytics,
)

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_business.router, prefix=settings.API_V1_PREFIX)
app.include_router(routes_match.router, prefix=settings.API_V1_PREFIX)
app.include_router(routes_connection.router, prefix=settings.API_V1_PREFIX)
app.include_router(routes_proposal.router, prefix=settings.API_V1_PREFIX)
app.include_router(routes_message.router, prefix=settings.API_V1_PREFIX)
app.include_router(routes_notification.router, prefix=settings.API_V1_PREFIX)
app.include_router(routes_analytics.router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}