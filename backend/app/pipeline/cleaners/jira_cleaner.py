"""Jira data cleaning and normalization."""

from datetime import datetime
from typing import Any


class JiraCleaner:
    """Clean and normalize Jira data for FlowSight."""

    def __init__(self):
        """Initialize Jira cleaner."""
        self.issue_cache = {}

    def clean_project(self, project: dict[str, Any]) -> dict[str, Any]:
        """Clean and validate project data."""
        return {
            "key": str(project.get("key", "UNKNOWN")),
            "name": project.get("name", "Unknown Project"),
            "project_type": project.get("project_type", "software"),
            "lead": project.get("lead", "Unknown"),
        }

    def clean_sprint(self, sprint: dict[str, Any]) -> dict[str, Any]:
        """Clean and normalize sprint data."""
        cleaned = {
            "id": str(sprint.get("id", "")),
            "name": sprint.get("name", "Unknown Sprint"),
            "state": sprint.get("state", "unknown"),
        }

        # Clean dates
        if sprint.get("start_date"):
            cleaned["start_date"] = self._normalize_date(sprint["start_date"])

        if sprint.get("end_date"):
            cleaned["end_date"] = self._normalize_date(sprint["end_date"])

        # Clean goal
        cleaned["goal"] = sprint.get("goal", "").strip()

        return cleaned

    def clean_issue(self, issue: dict[str, Any]) -> dict[str, Any]:
        """Clean and normalize issue data."""
        # Validate key
        key = issue.get("key", "")
        if not key or "-" not in key:
            key = f"UNKNOWN-{issue.get('id', '0')}"

        cleaned = {
            "key": key,
            "type": self._normalize_issue_type(issue.get("type", "Task")),
            "summary": issue.get("summary", "").strip(),
            "status": self._normalize_status(issue.get("status", "Unknown")),
            "priority": self._normalize_priority(issue.get("priority", "Medium")),
        }

        # Clean timestamps
        if issue.get("created"):
            cleaned["created"] = self._normalize_date(issue["created"])

        if issue.get("updated"):
            cleaned["updated"] = self._normalize_date(issue["updated"])

        # Clean assignee and reporter
        cleaned["assignee"] = self._clean_user(issue.get("assignee"))
        cleaned["reporter"] = self._clean_user(issue.get("reporter"))

        # Clean story points
        story_points = issue.get("story_points")
        if story_points is not None:
            try:
                cleaned["story_points"] = float(story_points)
            except (ValueError, TypeError):
                cleaned["story_points"] = None

        # Clean labels
        labels = issue.get("labels", [])
        cleaned["labels"] = [str(label).strip() for label in labels if label]

        # Clean time tracking
        if issue.get("time_tracking"):
            cleaned["time_tracking"] = self._clean_time_tracking(issue["time_tracking"])

        # Cache for relationship resolution
        self.issue_cache[cleaned["key"]] = cleaned

        return cleaned

    def _normalize_date(self, date_str: str) -> str:
        """Normalize date to ISO format."""
        try:
            # Jira returns ISO format, just validate and normalize
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            return dt.isoformat()
        except (ValueError, AttributeError):
            return datetime.now().isoformat()

    def _normalize_issue_type(self, issue_type: str) -> str:
        """Normalize issue type."""
        type_map = {
            "story": "Story",
            "bug": "Bug",
            "task": "Task",
            "epic": "Epic",
            "sub-task": "Sub-task",
            "subtask": "Sub-task",
        }
        return type_map.get(issue_type.lower(), issue_type)

    def _normalize_status(self, status: str) -> str:
        """Normalize status."""
        status_map = {
            "to do": "To Do",
            "todo": "To Do",
            "in progress": "In Progress",
            "in review": "In Review",
            "code review": "In Review",
            "done": "Done",
            "closed": "Done",
            "blocked": "Blocked",
        }
        return status_map.get(status.lower(), status)

    def _normalize_priority(self, priority: str) -> str:
        """Normalize priority."""
        priority_map = {
            "highest": "Highest",
            "high": "High",
            "medium": "Medium",
            "normal": "Medium",
            "low": "Low",
            "lowest": "Lowest",
        }
        return priority_map.get(priority.lower(), "Medium")

    def _clean_user(self, user: str | None) -> str | None:
        """Clean user identifier."""
        if not user:
            return None

        # Remove email domain if present
        user = str(user).strip()
        if "@" in user:
            return user  # Keep full email
        return user

    def _clean_time_tracking(self, time_tracking: dict) -> dict:
        """Clean time tracking data."""
        return {
            "original_estimate": time_tracking.get("original_estimate"),
            "remaining_estimate": time_tracking.get("remaining_estimate"),
            "time_spent": time_tracking.get("time_spent"),
        }

    def deduplicate_issues(self, issues: list[dict]) -> list[dict]:
        """Remove duplicate issues based on key."""
        seen = set()
        unique = []

        for issue in issues:
            key = issue.get("key")
            if key and key not in seen:
                seen.add(key)
                unique.append(issue)

        return unique

    def categorize_issues(self, issues: list[dict]) -> dict[str, list[dict]]:
        """Categorize issues by type and status."""
        categories = {
            "bugs": [],
            "stories": [],
            "tasks": [],
            "epics": [],
            "blocked": [],
            "in_progress": [],
            "done": [],
        }

        for issue in issues:
            # By type
            issue_type = issue.get("type", "").lower()
            if issue_type == "bug":
                categories["bugs"].append(issue)
            elif issue_type == "story":
                categories["stories"].append(issue)
            elif issue_type == "task":
                categories["tasks"].append(issue)
            elif issue_type == "epic":
                categories["epics"].append(issue)

            # By status
            status = issue.get("status", "").lower()
            if status == "blocked":
                categories["blocked"].append(issue)
            elif status == "in progress":
                categories["in_progress"].append(issue)
            elif status == "done":
                categories["done"].append(issue)

        return categories

    def enrich_with_metadata(self, data: dict[str, Any]) -> dict[str, Any]:
        """Add metadata and statistics to cleaned data."""
        issues = data.get("issues", [])

        # Calculate statistics
        total_issues = len(issues)
        total_story_points = sum(
            issue.get("story_points", 0) for issue in issues if issue.get("story_points")
        )

        # Categorize
        categories = self.categorize_issues(issues)

        # Count by priority
        priority_counts = {}
        for issue in issues:
            priority = issue.get("priority", "Unknown")
            priority_counts[priority] = priority_counts.get(priority, 0) + 1

        # Count by assignee
        assignee_counts = {}
        for issue in issues:
            assignee = issue.get("assignee", "Unassigned")
            if assignee:
                assignee_counts[assignee] = assignee_counts.get(assignee, 0) + 1

        # Add enrichment metadata
        data["enrichment"] = {
            "total_issues": total_issues,
            "total_story_points": total_story_points,
            "bugs_count": len(categories["bugs"]),
            "stories_count": len(categories["stories"]),
            "tasks_count": len(categories["tasks"]),
            "epics_count": len(categories["epics"]),
            "blocked_count": len(categories["blocked"]),
            "in_progress_count": len(categories["in_progress"]),
            "done_count": len(categories["done"]),
            "priority_distribution": priority_counts,
            "assignee_distribution": assignee_counts,
        }

        return data

    def clean_all(self, jira_data: dict[str, Any]) -> dict[str, Any]:
        """
        Clean all Jira data.

        Returns cleaned and normalized dataset.
        """
        print("Cleaning Jira data...")

        cleaned_data = {}

        # Clean project
        if "project" in jira_data:
            cleaned_data["project"] = self.clean_project(jira_data["project"])
            print("✓ Project cleaned")

        # Clean sprints
        if "sprints" in jira_data:
            cleaned_sprints = []
            for sprint in jira_data["sprints"]:
                cleaned_sprint = self.clean_sprint(sprint)
                cleaned_sprints.append(cleaned_sprint)

            cleaned_data["sprints"] = cleaned_sprints
            print(f"✓ {len(cleaned_sprints)} sprints cleaned")

        # Clean issues
        if "issues" in jira_data:
            cleaned_issues = []
            for issue in jira_data["issues"]:
                cleaned_issue = self.clean_issue(issue)
                cleaned_issues.append(cleaned_issue)

            # Deduplicate
            cleaned_issues = self.deduplicate_issues(cleaned_issues)

            cleaned_data["issues"] = cleaned_issues
            print(f"✓ {len(cleaned_issues)} issues cleaned")

        # Add enrichment metadata
        cleaned_data = self.enrich_with_metadata(cleaned_data)

        # Preserve original metadata and add cleaning metadata
        cleaned_data["metadata"] = {
            **jira_data.get("metadata", {}),
            "cleaned_at": datetime.now().isoformat(),
            "cleaning_version": "1.0.0",
        }

        print("✓ Jira data cleaning complete")

        return cleaned_data
