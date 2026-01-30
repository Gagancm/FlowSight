"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.mock import router as mock_router
from app.core.settings import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "FlowSight Mock Tool API - Provides mock project events and workflow graphs "
        "for the FlowSight AI Workflow Intelligence system. This API is designed to be "
        "imported into IBM watsonx Orchestrate as an OpenAPI tool."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(mock_router, prefix=settings.api_v1_prefix)

# Also mount health check at root level
app.include_router(mock_router, prefix="", include_in_schema=False)


@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint with API information."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/healthz",
    }
