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
    # Create an IBM Cloud API key from: https://cloud.ibm.com/iam/apikeys
    watsonx_api_key: str = ""
    # Base URL - get from watsonx Orchestrate > Channels > Embedded agent > hostURL
    # Example: https://jp-tok.watson-orchestrate.cloud.ibm.com
    watsonx_url: str = ""
    # Instance ID from your watsonx Orchestrate service
    watsonx_instance_id: str = ""
    # Agent ID (from Manage agents > select agent > copy ID)
    watsonx_agent_id: str = ""
    # Agent environment ID: "draft" for testing, or deployment ID for live
    watsonx_agent_env_id: str = "draft"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Allow extra env vars (ETL pipeline settings, etc.)


settings = Settings()
