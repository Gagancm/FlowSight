"""Microsoft Teams data extraction pipeline."""

import json
from datetime import datetime
from typing import Any
from pathlib import Path

import requests


class TeamsExtractor:
    """Extract data from Microsoft Teams API (Graph API) and format for FlowSight."""

    def __init__(self, access_token: str | None = None):
        """Initialize Teams extractor.

        Args:
            access_token: Microsoft Graph API access token
        """
        self.base_url = "https://graph.microsoft.com/v1.0"
        self.headers = {
            "Authorization": f"Bearer {access_token}" if access_token else "",
            "Content-Type": "application/json",
        }

    def _get(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        """Make GET request to Microsoft Graph API."""
        url = f"{self.base_url}/{endpoint}"
        response = requests.get(url, headers=self.headers, params=params or {})
        response.raise_for_status()
        return response.json()

    def extract_team_info(self, team_id: str) -> dict[str, Any]:
        """Extract team information."""
        team = self._get(f"teams/{team_id}")
        return {
            "id": team["id"],
            "name": team.get("displayName", "Unknown Team"),
            "description": team.get("description", ""),
        }

    def extract_channels(self, team_id: str) -> list[dict[str, Any]]:
        """Extract channels from a team."""
        channels_data = self._get(f"teams/{team_id}/channels")

        channels = []
        for channel in channels_data.get("value", []):
            channels.append({
                "id": channel["id"],
                "name": channel["displayName"],
                "description": channel.get("description", ""),
                "membership_type": channel.get("membershipType", "standard"),
            })

        return channels

    def extract_messages(
        self, team_id: str, channel_id: str, limit: int = 50
    ) -> list[dict[str, Any]]:
        """Extract messages from a channel."""
        messages_data = self._get(
            f"teams/{team_id}/channels/{channel_id}/messages",
            params={"$top": limit}
        )

        messages = []
        for msg in messages_data.get("value", []):
            # Skip deleted messages
            if msg.get("deletedDateTime"):
                continue

            message = {
                "id": msg["id"],
                "from": msg.get("from", {}).get("user", {}).get("displayName", "Unknown"),
                "created_datetime": msg["createdDateTime"],
                "body": msg.get("body", {}).get("content", ""),
                "importance": msg.get("importance", "normal"),
                "mentions": [
                    mention.get("mentioned", {}).get("user", {}).get("displayName")
                    for mention in msg.get("mentions", [])
                ],
            }

            messages.append(message)

        return messages

    def extract_meetings(
        self, team_id: str | None = None, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Extract calendar events/meetings.

        Note: This requires calendar permissions and may need user context.
        """
        # Get user's calendar events
        try:
            events_data = self._get(
                "me/calendar/events",
                params={"$top": limit, "$orderby": "start/dateTime desc"}
            )

            meetings = []
            for event in events_data.get("value", []):
                # Filter for online meetings
                if not event.get("isOnlineMeeting"):
                    continue

                meeting = {
                    "id": event["id"],
                    "subject": event["subject"],
                    "start_time": event["start"]["dateTime"],
                    "end_time": event["end"]["dateTime"],
                    "organizer": event.get("organizer", {}).get("emailAddress", {}).get("name", "Unknown"),
                    "attendees": [
                        att.get("emailAddress", {}).get("name")
                        for att in event.get("attendees", [])
                    ],
                    "online_meeting_url": event.get("onlineMeeting", {}).get("joinUrl"),
                }

                meetings.append(meeting)

            return meetings

        except Exception as e:
            print(f"⚠ Warning: Could not extract meetings: {e}")
            return []

    def extract_all(
        self,
        team_id: str,
        output_path: str | None = None,
        include_meetings: bool = False,
    ) -> dict[str, Any]:
        """Extract all Teams data and save to file.

        Args:
            team_id: Microsoft Teams team ID
            output_path: Optional path to save JSON output
            include_meetings: Whether to include calendar meetings

        Returns:
            Complete dataset in FlowSight format
        """
        print(f"Extracting data from Microsoft Teams...")

        # Extract all data
        team = self.extract_team_info(team_id)
        print(f"✓ Team info extracted: {team['name']}")

        channels = self.extract_channels(team_id)
        print(f"✓ {len(channels)} channels extracted")

        # Extract messages from channels
        messages = []
        for channel in channels[:5]:  # Limit to 5 channels to avoid rate limits
            try:
                channel_messages = self.extract_messages(team_id, channel["id"])
                for msg in channel_messages:
                    msg["channel_name"] = channel["name"]
                messages.extend(channel_messages)
            except Exception as e:
                print(f"  ⚠ Warning: Failed to extract from channel {channel['name']}: {e}")

        print(f"✓ {len(messages)} messages extracted")

        # Extract meetings if requested
        meetings = []
        if include_meetings:
            meetings = self.extract_meetings(team_id)
            print(f"✓ {len(meetings)} meetings extracted")

        # Build final dataset
        dataset = {
            "team": team,
            "channels": channels,
            "messages": messages,
            "meetings": meetings,
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "total_channels": len(channels),
                "total_messages": len(messages),
                "total_meetings": len(meetings),
            },
        }

        # Save to file if path provided
        if output_path:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            with open(output_file, "w") as f:
                json.dump(dataset, f, indent=2)
            print(f"✓ Data saved to {output_path}")

        return dataset
