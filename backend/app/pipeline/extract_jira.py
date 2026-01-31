#!/usr/bin/env python3
"""Extract Jira data for FlowSight AI."""

import argparse
import os
import sys
from pathlib import Path

# Add backend root to path
backend_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_root))

from app.pipeline.jira_extractor import JiraExtractor
from app.pipeline.transformer import transform_jira_to_raw_events


def main():
    """Run Jira data extraction pipeline."""
    parser = argparse.ArgumentParser(
        description="Extract Jira project data for FlowSight AI"
    )
    parser.add_argument(
        "project_key",
        help="Jira project key (e.g., PROJ, PAY)"
    )
    parser.add_argument(
        "--jira-url",
        help="Jira instance URL (or set JIRA_URL env var)",
    )
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        help="Output file path (default: data/jira_cleaned_<project>.json)",
    )
    parser.add_argument(
        "--email",
        help="Jira account email (or set JIRA_EMAIL env var)",
    )
    parser.add_argument(
        "--token",
        help="Jira API token (or set JIRA_API_TOKEN env var)",
    )
    parser.add_argument(
        "--board-id",
        help="Board ID for extracting sprints (optional)",
    )

    args = parser.parse_args()

    # Set default output path
    if not args.output:
        args.output = f"data/jira_cleaned_{args.project_key.lower()}.json"

    # Get Jira credentials
    jira_url = args.jira_url or os.getenv("JIRA_URL")
    jira_email = args.email or os.getenv("JIRA_EMAIL")
    jira_token = args.token or os.getenv("JIRA_API_TOKEN")

    if not all([jira_url, jira_email, jira_token]):
        print("Error: Jira credentials required.")
        print("Set JIRA_URL, JIRA_EMAIL, and JIRA_API_TOKEN environment variables")
        print("or use --jira-url, --email, and --token flags.")
        sys.exit(1)

    # Extract data
    try:
        extractor = JiraExtractor(
            jira_url=jira_url,
            jira_email=jira_email,
            jira_api_token=jira_token
        )
        data = extractor.extract_all(
            project_key=args.project_key,
            board_id=args.board_id,
            output_path=args.output
        )

        # Add raw events
        raw_events = transform_jira_to_raw_events(data)
        data["raw_events"] = [event.model_dump(mode="json") for event in raw_events]

        # Save updated data
        import json
        with open(args.output, "w") as f:
            json.dump(data, f, indent=2)

        print(f"\n✅ Successfully extracted data from Jira project: {args.project_key}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
