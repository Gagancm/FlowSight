"""Microsoft Teams data cleaning and normalization."""

from datetime import datetime
from typing import Any
import re


class TeamsCleaner:
    """Clean and normalize Teams data for FlowSight."""

    def __init__(self):
        """Initialize Teams cleaner."""
        self.channel_cache = {}

    def clean_team(self, team: dict[str, Any]) -> dict[str, Any]:
        """Clean and validate team data."""
        return {
            "id": str(team.get("id", "unknown")),
            "name": team.get("name", "Unknown Team"),
            "description": team.get("description", "").strip(),
        }

    def clean_channel(self, channel: dict[str, Any]) -> dict[str, Any]:
        """Clean and normalize channel data."""
        cleaned = {
            "id": str(channel.get("id", "")),
            "name": channel.get("name", "unknown-channel"),
            "description": channel.get("description", "").strip(),
            "membership_type": channel.get("membership_type", "standard"),
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
        if not message.get("body"):
            return None

        # Validate timestamp
        try:
            timestamp = message.get("created_datetime")
            if timestamp:
                datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return None

        # Clean HTML from body
        text = self._clean_html(message.get("body", ""))

        # Extract mentions
        mentions = message.get("mentions", [])
        cleaned_mentions = [m for m in mentions if m]

        # Extract references
        references = self._extract_references(text)

        cleaned = {
            "id": message.get("id"),
            "from": message.get("from", "Unknown"),
            "created_datetime": message.get("created_datetime"),
            "body": text,
            "original_body": message.get("body", ""),  # Keep original HTML
            "importance": message.get("importance", "normal"),
            "channel_name": message.get("channel_name", "unknown"),
        }

        # Add optional fields
        if cleaned_mentions:
            cleaned["mentions"] = cleaned_mentions

        if references:
            cleaned["references"] = references

        return cleaned

    def clean_meeting(self, meeting: dict[str, Any]) -> dict[str, Any] | None:
        """Clean and normalize meeting data."""
        # Validate required fields
        if not meeting.get("id") or not meeting.get("subject"):
            return None

        # Validate timestamps
        try:
            start_time = meeting.get("start_time")
            end_time = meeting.get("end_time")

            if start_time:
                datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            if end_time:
                datetime.fromisoformat(end_time.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return None

        # Calculate duration
        duration_minutes = None
        if start_time and end_time:
            try:
                start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
                duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
            except:
                pass

        cleaned = {
            "id": meeting.get("id"),
            "subject": meeting.get("subject", "").strip(),
            "start_time": start_time,
            "end_time": end_time,
            "duration_minutes": duration_minutes,
            "organizer": meeting.get("organizer", "Unknown"),
            "attendees": meeting.get("attendees", []),
            "attendee_count": len(meeting.get("attendees", [])),
        }

        # Add optional fields
        if meeting.get("online_meeting_url"):
            cleaned["online_meeting_url"] = meeting["online_meeting_url"]

        return cleaned

    def _clean_html(self, html_text: str) -> str:
        """Remove HTML tags from text."""
        # Remove HTML tags
        text = re.sub(r"<[^>]+>", "", html_text)

        # Decode HTML entities
        text = text.replace("&nbsp;", " ")
        text = text.replace("&amp;", "&")
        text = text.replace("&lt;", "<")
        text = text.replace("&gt;", ">")
        text = text.replace("&quot;", '"')

        # Clean up whitespace
        text = " ".join(text.split())

        return text.strip()

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

    def deduplicate_messages(self, messages: list[dict]) -> list[dict]:
        """Remove duplicate messages based on ID."""
        seen = set()
        unique = []

        for msg in messages:
            msg_id = msg.get("id")
            if msg_id and msg_id not in seen:
                seen.add(msg_id)
                unique.append(msg)

        return unique

    def deduplicate_meetings(self, meetings: list[dict]) -> list[dict]:
        """Remove duplicate meetings based on ID."""
        seen = set()
        unique = []

        for meeting in meetings:
            meeting_id = meeting.get("id")
            if meeting_id and meeting_id not in seen:
                seen.add(meeting_id)
                unique.append(meeting)

        return unique

    def enrich_with_metadata(self, data: dict[str, Any]) -> dict[str, Any]:
        """Add metadata and statistics to cleaned data."""
        messages = data.get("messages", [])
        meetings = data.get("meetings", [])

        # Calculate message statistics
        total_messages = len(messages)
        unique_senders = len(set(m.get("from") for m in messages if m.get("from")))

        # Extract importance distribution
        importance_counts = {}
        for msg in messages:
            importance = msg.get("importance", "normal")
            importance_counts[importance] = importance_counts.get(importance, 0) + 1

        # Calculate meeting statistics
        total_meetings = len(meetings)
        total_attendees = sum(m.get("attendee_count", 0) for m in meetings)
        avg_attendees = total_attendees / total_meetings if total_meetings > 0 else 0

        # Extract referenced issues/PRs
        all_references = []
        for msg in messages:
            all_references.extend(msg.get("references", []))

        # Add enrichment metadata
        data["enrichment"] = {
            "total_messages": total_messages,
            "unique_senders": unique_senders,
            "importance_distribution": importance_counts,
            "total_meetings": total_meetings,
            "total_attendees": total_attendees,
            "avg_attendees_per_meeting": round(avg_attendees, 1),
            "total_references": len(all_references),
            "pr_references": len([r for r in all_references if r["type"] == "pull_request"]),
            "issue_references": len([r for r in all_references if r["type"] == "issue"]),
        }

        return data

    def clean_all(self, teams_data: dict[str, Any]) -> dict[str, Any]:
        """
        Clean all Teams data.

        Returns cleaned and normalized dataset.
        """
        print("Cleaning Teams data...")

        cleaned_data = {}

        # Clean team
        if "team" in teams_data:
            cleaned_data["team"] = self.clean_team(teams_data["team"])
            print("✓ Team cleaned")

        # Clean channels
        if "channels" in teams_data:
            cleaned_channels = []
            for channel in teams_data["channels"]:
                cleaned_channel = self.clean_channel(channel)
                cleaned_channels.append(cleaned_channel)

            cleaned_data["channels"] = cleaned_channels
            print(f"✓ {len(cleaned_channels)} channels cleaned")

        # Clean messages
        if "messages" in teams_data:
            cleaned_messages = []
            skipped = 0

            for message in teams_data["messages"]:
                cleaned_msg = self.clean_message(message)
                if cleaned_msg:
                    cleaned_messages.append(cleaned_msg)
                else:
                    skipped += 1

            # Deduplicate
            cleaned_messages = self.deduplicate_messages(cleaned_messages)

            cleaned_data["messages"] = cleaned_messages
            print(f"✓ {len(cleaned_messages)} messages cleaned ({skipped} skipped)")

        # Clean meetings
        if "meetings" in teams_data:
            cleaned_meetings = []
            skipped = 0

            for meeting in teams_data["meetings"]:
                cleaned_meeting = self.clean_meeting(meeting)
                if cleaned_meeting:
                    cleaned_meetings.append(cleaned_meeting)
                else:
                    skipped += 1

            # Deduplicate
            cleaned_meetings = self.deduplicate_meetings(cleaned_meetings)

            cleaned_data["meetings"] = cleaned_meetings
            print(f"✓ {len(cleaned_meetings)} meetings cleaned ({skipped} skipped)")

        # Add enrichment metadata
        cleaned_data = self.enrich_with_metadata(cleaned_data)

        # Preserve original metadata and add cleaning metadata
        cleaned_data["metadata"] = {
            **teams_data.get("metadata", {}),
            "cleaned_at": datetime.now().isoformat(),
            "cleaning_version": "1.0.0",
        }

        print("✓ Teams data cleaning complete")

        return cleaned_data
