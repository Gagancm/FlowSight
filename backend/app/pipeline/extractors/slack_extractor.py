"""Slack data extraction pipeline."""

import json
from datetime import datetime
from typing import Any
from pathlib import Path

import requests


class SlackExtractor:
    """Extract data from Slack API and format for FlowSight."""

    def __init__(self, slack_token: str | None = None):
        """Initialize Slack extractor.

        Args:
            slack_token: Slack Bot User OAuth Token
        """
        self.base_url = "https://slack.com/api"
        self.headers = {
            "Authorization": f"Bearer {slack_token}" if slack_token else "",
            "Content-Type": "application/json",
        }

    def _get(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        """Make GET request to Slack API."""
        url = f"{self.base_url}/{endpoint}"
        response = requests.get(url, headers=self.headers, params=params or {})
        response.raise_for_status()
        data = response.json()

        if not data.get("ok"):
            raise Exception(f"Slack API error: {data.get('error', 'Unknown error')}")

        return data

    def extract_workspace_info(self) -> dict[str, str]:
        """Extract workspace information."""
        team_info = self._get("team.info")
        return {
            "id": team_info["team"]["id"],
            "name": team_info["team"]["name"],
            "domain": team_info["team"]["domain"],
        }

    def extract_channels(self, limit: int = 100) -> list[dict[str, Any]]:
        """Extract channels from workspace."""
        channels_data = self._get(
            "conversations.list",
            params={"exclude_archived": "true", "limit": limit, "types": "public_channel,private_channel"}
        )

        channels = []
        for channel in channels_data.get("channels", []):
            channels.append({
                "id": channel["id"],
                "name": f"#{channel['name']}",
                "purpose": channel.get("purpose", {}).get("value", ""),
                "is_private": channel.get("is_private", False),
                "num_members": channel.get("num_members", 0),
            })

        return channels

    def extract_messages(
        self, channel_id: str, limit: int = 100
    ) -> list[dict[str, Any]]:
        """Extract messages from a channel."""
        messages_data = self._get(
            "conversations.history",
            params={"channel": channel_id, "limit": limit}
        )

        messages = []
        for msg in messages_data.get("messages", []):
            # Skip bot messages and system messages
            if msg.get("subtype") in ["bot_message", "channel_join", "channel_leave"]:
                continue

            # Get user info
            user_id = msg.get("user", "unknown")
            try:
                user_info = self._get("users.info", params={"user": user_id})
                username = user_info["user"]["real_name"]
            except:
                username = user_id

            # Get reactions
            reactions = []
            for reaction in msg.get("reactions", []):
                reactions.append({
                    "name": reaction["name"],
                    "count": reaction["count"],
                    "users": reaction.get("users", [])
                })

            # Extract mentions
            text = msg.get("text", "")
            mentions = []
            # Simple mention extraction (looks for <@USER_ID>)
            import re
            user_mentions = re.findall(r"<@(\w+)>", text)
            mentions.extend(user_mentions)

            message = {
                "ts": msg["ts"],
                "user": user_id,
                "username": username,
                "text": text,
                "timestamp": datetime.fromtimestamp(float(msg["ts"])).isoformat() + "Z",
                "thread_ts": msg.get("thread_ts"),
                "reactions": reactions if reactions else None,
                "mentions": mentions if mentions else None,
            }

            messages.append(message)

        return messages

    def extract_all_messages(
        self, channel_ids: list[str] | None = None, messages_per_channel: int = 50
    ) -> list[dict[str, Any]]:
        """Extract messages from multiple channels."""
        if not channel_ids:
            # Get all channels
            channels = self.extract_channels()
            channel_ids = [ch["id"] for ch in channels]

        all_messages = []
        for channel_id in channel_ids[:10]:  # Limit to 10 channels to avoid rate limits
            try:
                messages = self.extract_messages(channel_id, limit=messages_per_channel)
                # Add channel info to each message
                for msg in messages:
                    msg["channel_id"] = channel_id
                all_messages.extend(messages)
            except Exception as e:
                print(f"  ⚠ Warning: Failed to extract from channel {channel_id}: {e}")

        return all_messages

    def extract_all(
        self, output_path: str | None = None, workspace_name: str | None = None
    ) -> dict[str, Any]:
        """Extract all Slack data and save to file.

        Args:
            output_path: Optional path to save JSON output
            workspace_name: Optional workspace name for identification

        Returns:
            Complete dataset in FlowSight format
        """
        print(f"Extracting data from Slack workspace...")

        # Extract all data
        workspace = self.extract_workspace_info()
        print(f"✓ Workspace info extracted: {workspace['name']}")

        channels = self.extract_channels()
        print(f"✓ {len(channels)} channels extracted")

        # Extract messages from channels
        channel_ids = [ch["id"] for ch in channels]
        messages = self.extract_all_messages(channel_ids, messages_per_channel=50)
        print(f"✓ {len(messages)} messages extracted")

        # Build final dataset
        dataset = {
            "workspace": workspace["name"],
            "channels": channels,
            "messages": messages,
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "total_channels": len(channels),
                "total_messages": len(messages),
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
