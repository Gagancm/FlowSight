#!/usr/bin/env python3
"""Extract Microsoft Teams data for FlowSight AI."""

import argparse
import os
import sys
from pathlib import Path

# Add backend root to path
backend_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_root))

from app.pipeline.teams_extractor import TeamsExtractor
from app.pipeline.teams_cleaner import TeamsCleaner
from app.pipeline.transformer import transform_teams_to_raw_events


def main():
    """Run Teams data extraction pipeline."""
    parser = argparse.ArgumentParser(
        description="Extract Microsoft Teams data for FlowSight AI"
    )
    parser.add_argument(
        "team_id",
        help="Microsoft Teams team ID"
    )
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        help="Output file path (default: data/teams_cleaned_<team_id>.json)",
    )
    parser.add_argument(
        "-t",
        "--token",
        help="Microsoft Graph API access token (or set TEAMS_TOKEN env var)",
    )
    parser.add_argument(
        "--include-meetings",
        action="store_true",
        help="Include calendar meetings in extraction",
    )

    args = parser.parse_args()

    # Set default output path
    if not args.output:
        args.output = f"data/teams_cleaned_{args.team_id[:8]}.json"

    # Get Teams token
    teams_token = args.token or os.getenv("TEAMS_TOKEN")
    if not teams_token:
        print("Error: Microsoft Graph API token required.")
        print("Set TEAMS_TOKEN environment variable or use --token flag.")
        sys.exit(1)

    # Extract data
    try:
        extractor = TeamsExtractor(access_token=teams_token)
        data = extractor.extract_all(
            team_id=args.team_id,
            output_path=args.output,
            include_meetings=args.include_meetings
        )

        # Clean data
        print("\nCleaning data...")
        cleaner = TeamsCleaner()
        cleaned_data = cleaner.clean_all(data)

        # Add raw events
        raw_events = transform_teams_to_raw_events(cleaned_data)
        cleaned_data["raw_events"] = [event.model_dump(mode="json") for event in raw_events]

        # Save updated data
        import json
        with open(args.output, "w") as f:
            json.dump(cleaned_data, f, indent=2)

        print(f"\n✅ Successfully extracted data from Microsoft Teams")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
