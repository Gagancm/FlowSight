"""Raw event models for ingestion."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class RawEvent(BaseModel):
    """A raw event from any source system (Git, GitHub, Jira, CI, etc.)."""

    source: Literal["git", "github", "jira", "ci", "slack"]
    type: str
    id: str
    timestamp: datetime
    # Optional fields depending on event type
    branch: str | None = None
    status: str | None = None
    author: str | None = None
    assignee: str | None = None
    conclusion: str | None = None
    key: str | None = None  # For Jira issues

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "source": "git",
                    "type": "commit",
                    "id": "a1b2c3",
                    "timestamp": "2026-01-30T14:00:00Z",
                    "branch": "main",
                },
                {
                    "source": "github",
                    "type": "pull_request",
                    "id": "42",
                    "timestamp": "2026-01-30T14:30:00Z",
                    "status": "open",
                    "author": "dev1",
                },
            ]
        }


class RawEventsPayload(BaseModel):
    """Payload containing multiple raw events."""

    raw_events: list[RawEvent] = Field(
        ..., description="List of raw events from various source systems"
    )
