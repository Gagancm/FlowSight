#!/usr/bin/env python3
"""Extract Slack data for FlowSight AI."""

import argparse
import os
import sys
from pathlib import Path

# Add backend root to path
backend_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_root))

from app.pipeline.slack_extractor import SlackExtractor
from app.pipeline.transformer import transform_slack_to_raw_events


def main():
    """Run Slack data extraction pipeline."""
    parser = argparse.ArgumentParser(
        description="Extract Slack workspace data for FlowSight AI"
    )
    parser.add_argument(
        "workspace_name",
        help="Workspace name for output file naming"
    )
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        help="Output file path (default: data/slack_cleaned_<workspace>.json)",
    )
    parser.add_argument(
        "-t",
        "--token",
        help="Slack Bot User OAuth Token (or set SLACK_TOKEN env var)",
    )

    args = parser.parse_args()

    # Set default output path
    if not args.output:
        args.output = f"data/slack_cleaned_{args.workspace_name}.json"

    # Get Slack token
    slack_token = args.token or os.getenv("SLACK_TOKEN")
    if not slack_token:
        print("Error: Slack token required.")
        print("Set SLACK_TOKEN environment variable or use --token flag.")
        sys.exit(1)

    # Extract data
    try:
        extractor = SlackExtractor(slack_token=slack_token)
        data = extractor.extract_all(
            output_path=args.output,
            workspace_name=args.workspace_name
        )

        # Add raw events
        raw_events = transform_slack_to_raw_events(data)
        data["raw_events"] = [event.model_dump(mode="json") for event in raw_events]

        # Save updated data
        import json
        with open(args.output, "w") as f:
            json.dump(data, f, indent=2)

        print(f"\n✅ Successfully extracted data from Slack workspace: {args.workspace_name}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
