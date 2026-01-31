"""Slack data cleaning and normalization."""

from datetime import datetime
from typing import Any
import re


class SlackCleaner:
    """Clean and normalize Slack data for FlowSight."""

    def __init__(self):
        """Initialize Slack cleaner."""
        self.user_cache = {}
        self.channel_cache = {}

    def clean_workspace(self, workspace_data: dict[str, Any]) -> dict[str, Any]:
        """Clean and validate workspace data."""
        return {
            "id": str(workspace_data.get("id", "unknown")),
            "name": workspace_data.get("name", "Unknown Workspace"),
            "domain": workspace_data.get("domain", "unknown"),
        }

    def clean_channel(self, channel: dict[str, Any]) -> dict[str, Any]:
        """Clean and normalize channel data."""
        cleaned = {
            "id": str(channel.get("id", "")),
            "name": channel.get("name", "unknown-channel"),
            "purpose": channel.get("purpose", ""),
            "is_private": bool(channel.get("is_private", False)),
            "num_members": int(channel.get("num_members", 0)),
        }

        # Cache for lookup
        self.channel_cache[cleaned["id"]] = cleaned["name"]

        return cleaned

    def clean_message(self, message: dict[str, Any]) -> dict[str, Any] | None:
        """
        Clean and normalize message data.

        Returns None if message should be filtered out.
        """
        # Filter invalid messages
        if not message.get("text"):
            return None

        # Validate timestamp
        try:
            timestamp = message.get("timestamp")
            if timestamp:
                datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            # Invalid timestamp, skip message
            return None

        # Extract user info
        user_id = message.get("user", "unknown")
        username = message.get("username", user_id)

        # Clean text - remove Slack formatting
        text = self._clean_text(message.get("text", ""))

        # Extract and clean mentions
        mentions = self._extract_mentions(message.get("text", ""))

        # Extract issue/PR references
        references = self._extract_references(message.get("text", ""))

        cleaned = {
            "ts": message.get("ts"),
            "user": user_id,
            "username": username,
            "text": text,
            "original_text": message.get("text", ""),  # Keep original for analysis
            "timestamp": message.get("timestamp"),
            "channel_id": message.get("channel_id"),
            "channel_name": self.channel_cache.get(message.get("channel_id"), "unknown"),
            "thread_ts": message.get("thread_ts"),
            "is_thread_reply": bool(message.get("thread_ts") and message.get("thread_ts") != message.get("ts")),
        }

        # Add optional fields
        if message.get("reactions"):
            cleaned["reactions"] = self._clean_reactions(message["reactions"])

        if mentions:
            cleaned["mentions"] = mentions

        if references:
            cleaned["references"] = references

        return cleaned

    def _clean_text(self, text: str) -> str:
        """Remove Slack formatting from text."""
        # Remove user mentions <@U123>
        text = re.sub(r"<@[\w]+>", "", text)

        # Remove channel mentions <#C123|channel-name>
        text = re.sub(r"<#[\w]+\|[\w-]+>", "", text)

        # Remove URLs <http://example.com|example>
        text = re.sub(r"<https?://[^|>]+\|([^>]+)>", r"\1", text)
        text = re.sub(r"<https?://[^>]+>", "", text)

        # Clean up whitespace
        text = " ".join(text.split())

        return text.strip()

    def _extract_mentions(self, text: str) -> list[str]:
        """Extract user mentions from text."""
        # Find all <@USER_ID> patterns
        mentions = re.findall(r"<@([\w]+)>", text)
        return list(set(mentions))  # Deduplicate

    def _extract_references(self, text: str) -> list[dict[str, str]]:
        """Extract issue/PR references from text."""
        references = []

        # GitHub PR references: PR-123, #123
        pr_refs = re.findall(r"(?:PR-|#)(\d+)", text)
        for pr_num in pr_refs:
            references.append({"type": "pull_request", "id": pr_num})

        # Jira issue references: PROJ-123, PAY-456
        jira_refs = re.findall(r"([A-Z]+-\d+)", text)
        for issue_key in jira_refs:
            references.append({"type": "issue", "id": issue_key})

        return references

    def _clean_reactions(self, reactions: list[dict]) -> list[dict]:
        """Clean and normalize reactions."""
        if not reactions:
            return []

        cleaned = []
        for reaction in reactions:
            cleaned.append({
                "name": reaction.get("name", "unknown"),
                "count": int(reaction.get("count", 0)),
                "users": reaction.get("users", []),
            })

        return cleaned

    def deduplicate_messages(self, messages: list[dict]) -> list[dict]:
        """Remove duplicate messages based on timestamp."""
        seen = set()
        unique = []

        for msg in messages:
            ts = msg.get("ts")
            if ts and ts not in seen:
                seen.add(ts)
                unique.append(msg)

        return unique

    def enrich_with_metadata(self, data: dict[str, Any]) -> dict[str, Any]:
        """Add metadata and statistics to cleaned data."""
        messages = data.get("messages", [])

        # Calculate statistics
        total_messages = len(messages)
        thread_count = len([m for m in messages if m.get("is_thread_reply")])
        unique_users = len(set(m.get("user") for m in messages if m.get("user")))

        # Extract top mentioned users
        all_mentions = []
        for msg in messages:
            all_mentions.extend(msg.get("mentions", []))

        mention_counts = {}
        for mention in all_mentions:
            mention_counts[mention] = mention_counts.get(mention, 0) + 1

        top_mentions = sorted(mention_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        # Extract referenced issues/PRs
        all_references = []
        for msg in messages:
            all_references.extend(msg.get("references", []))

        # Add enrichment metadata
        data["enrichment"] = {
            "total_messages": total_messages,
            "thread_replies": thread_count,
            "unique_users": unique_users,
            "top_mentioned_users": [{"user": u, "count": c} for u, c in top_mentions],
            "total_references": len(all_references),
            "pr_references": len([r for r in all_references if r["type"] == "pull_request"]),
            "issue_references": len([r for r in all_references if r["type"] == "issue"]),
        }

        return data

    def clean_all(self, slack_data: dict[str, Any]) -> dict[str, Any]:
        """
        Clean all Slack data.

        Returns cleaned and normalized dataset.
        """
        print("Cleaning Slack data...")

        cleaned_data = {}

        # Clean workspace (if present)
        if "workspace" in slack_data:
            cleaned_data["workspace"] = slack_data["workspace"]  # Already a string
            print("✓ Workspace cleaned")

        # Clean channels
        if "channels" in slack_data:
            cleaned_channels = []
            for channel in slack_data["channels"]:
                cleaned_channel = self.clean_channel(channel)
                cleaned_channels.append(cleaned_channel)

            cleaned_data["channels"] = cleaned_channels
            print(f"✓ {len(cleaned_channels)} channels cleaned")

        # Clean messages
        if "messages" in slack_data:
            cleaned_messages = []
            skipped = 0

            for message in slack_data["messages"]:
                cleaned_msg = self.clean_message(message)
                if cleaned_msg:
                    cleaned_messages.append(cleaned_msg)
                else:
                    skipped += 1

            # Deduplicate
            cleaned_messages = self.deduplicate_messages(cleaned_messages)

            cleaned_data["messages"] = cleaned_messages
            print(f"✓ {len(cleaned_messages)} messages cleaned ({skipped} skipped)")

        # Add enrichment metadata
        cleaned_data = self.enrich_with_metadata(cleaned_data)

        # Preserve original metadata and add cleaning metadata
        cleaned_data["metadata"] = {
            **slack_data.get("metadata", {}),
            "cleaned_at": datetime.now().isoformat(),
            "cleaning_version": "1.0.0",
        }

        print("✓ Slack data cleaning complete")

        return cleaned_data
