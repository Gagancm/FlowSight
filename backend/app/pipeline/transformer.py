"""Transform extracted GitHub data into RawEvent format for FlowSight ingestion."""

from datetime import datetime
from typing import Any

from app.models.events import RawEvent


def transform_github_to_raw_events(github_data: dict[str, Any]) -> list[RawEvent]:
    """
    Transform extracted GitHub data into RawEvent format.

    This converts the detailed GitHub data structure into the normalized
    RawEvent format expected by FlowSight's ingestion agent.

    Args:
        github_data: Dictionary with commits, pull_requests, ci_runs, deployments

    Returns:
        List of RawEvent objects ready for ingestion
    """
    events: list[RawEvent] = []

    # Transform commits
    for commit in github_data.get("commits", []):
        events.append(
            RawEvent(
                source="git",
                type="commit",
                id=commit["sha"],
                timestamp=datetime.fromisoformat(commit["timestamp"].replace("Z", "+00:00")),
                branch=commit.get("branch"),
                author=commit.get("author"),
                status="committed",  # All commits are "committed"
                key=None,
                assignee=None,
                conclusion=None,
            )
        )

    # Transform pull requests
    for pr in github_data.get("pull_requests", []):
        # Map GitHub PR state to our status
        status = pr.get("state", "open")

        # Get first assignee from requested_reviewers if available
        requested_reviewers = pr.get("requested_reviewers", [])
        assignee = requested_reviewers[0] if requested_reviewers else None

        events.append(
            RawEvent(
                source="github",
                type="pull_request",
                id=str(pr["number"]),
                timestamp=datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00")),
                branch=pr.get("head_branch"),
                author=pr.get("author"),
                status=status,
                key=f"PR-{pr['number']}",  # Use PR-number as key
                assignee=assignee,
                conclusion=None,
            )
        )

    # Transform CI runs (workflow runs)
    for ci_run in github_data.get("ci_runs", []):
        # CI runs have both status and conclusion
        status = ci_run.get("status", "pending")
        conclusion = status  # In our data, status is the conclusion

        events.append(
            RawEvent(
                source="ci",
                type="workflow_run",
                id=ci_run["id"],
                timestamp=datetime.fromisoformat(
                    ci_run["started_at"].replace("Z", "+00:00")
                ),
                branch=None,  # CI runs don't have branch in our data
                author=None,  # CI runs don't have author
                status=status,
                key=None,
                assignee=None,
                conclusion=conclusion,
            )
        )

    # Transform deployments
    for deployment in github_data.get("deployments", []):
        status = deployment.get("status", "pending")

        events.append(
            RawEvent(
                source="github",
                type="deployment",
                id=deployment["id"],
                timestamp=datetime.fromisoformat(
                    deployment["created_at"].replace("Z", "+00:00")
                ),
                branch=None,
                author=deployment.get("deployed_by"),
                status=status,
                key=None,
                assignee=None,
                conclusion=status if status in ["success", "failure"] else None,
            )
        )

    return events


def save_raw_events(events: list[RawEvent], output_path: str) -> None:
    """
    Save RawEvent list to JSON file.

    Args:
        events: List of RawEvent objects
        output_path: Path to save JSON file
    """
    import json
    from pathlib import Path

    # Convert to dict format
    events_data = {
        "raw_events": [event.model_dump(mode="json") for event in events]
    }

    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, "w") as f:
        json.dump(events_data, f, indent=2, default=str)

    print(f"✓ Saved {len(events)} raw events to {output_path}")
