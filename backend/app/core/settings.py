"""Application configuration settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "FlowSight Mock Tool"
    app_version: str = "0.1.0"
    debug: bool = False

    # CORS settings
    cors_origins: list[str] = ["*"]

    # API settings
    api_v1_prefix: str = "/api/v1"

    # Stub mode - returns mock responses without calling watsonx
    stub_mode: bool = True

    # watsonx Orchestrate settings
    watsonx_api_key: str = ""
    watsonx_url: str = "https://api.us-south.assistant.watson.cloud.ibm.com"
    watsonx_agent_id: str = ""
    watsonx_agent_env_id: str = ""  # Optional: agent environment ID

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
