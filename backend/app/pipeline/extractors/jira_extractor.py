"""Jira data extraction pipeline."""

import json
from datetime import datetime
from typing import Any
from pathlib import Path

import requests
from requests.auth import HTTPBasicAuth


class JiraExtractor:
    """Extract data from Jira API and format for FlowSight."""

    def __init__(
        self,
        jira_url: str,
        jira_email: str | None = None,
        jira_api_token: str | None = None,
    ):
        """Initialize Jira extractor.

        Args:
            jira_url: Jira instance URL (e.g., https://your-domain.atlassian.net)
            jira_email: Email for authentication
            jira_api_token: API token for authentication
        """
        self.base_url = jira_url.rstrip("/")
        self.auth = HTTPBasicAuth(jira_email, jira_api_token) if jira_email and jira_api_token else None
        self.headers = {"Accept": "application/json"}

    def _get(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        """Make GET request to Jira API."""
        url = f"{self.base_url}/rest/api/3/{endpoint}"
        response = requests.get(
            url, headers=self.headers, auth=self.auth, params=params or {}
        )
        response.raise_for_status()
        return response.json()

    def extract_project_info(self, project_key: str) -> dict[str, Any]:
        """Extract project information."""
        project = self._get(f"project/{project_key}")
        return {
            "key": project["key"],
            "name": project["name"],
            "project_type": project.get("projectTypeKey", "software"),
            "lead": project.get("lead", {}).get("displayName", "Unknown"),
        }

    def extract_sprints(self, board_id: str, limit: int = 10) -> list[dict[str, Any]]:
        """Extract sprints from a board."""
        # Note: Sprints are part of Jira Software, using different API endpoint
        sprints_data = self._get(
            f"board/{board_id}/sprint",
            params={"maxResults": limit}
        )

        sprints = []
        for sprint in sprints_data.get("values", []):
            sprint_info = {
                "id": sprint["id"],
                "name": sprint["name"],
                "state": sprint["state"],
                "start_date": sprint.get("startDate"),
                "end_date": sprint.get("endDate"),
                "goal": sprint.get("goal", ""),
            }
            sprints.append(sprint_info)

        return sprints

    def extract_issues(
        self, project_key: str, limit: int = 100, jql: str | None = None
    ) -> list[dict[str, Any]]:
        """Extract issues from a project."""
        if not jql:
            jql = f"project = {project_key} ORDER BY created DESC"

        search_results = self._get(
            "search",
            params={
                "jql": jql,
                "maxResults": limit,
                "fields": "summary,status,assignee,reporter,created,updated,issuetype,priority,labels,timetracking,customfield_10016",  # customfield_10016 is often story points
            }
        )

        issues = []
        for issue_data in search_results.get("issues", []):
            fields = issue_data["fields"]

            # Extract assignee
            assignee = None
            if fields.get("assignee"):
                assignee = fields["assignee"].get("emailAddress") or fields["assignee"].get("displayName")

            # Extract reporter
            reporter = None
            if fields.get("reporter"):
                reporter = fields["reporter"].get("emailAddress") or fields["reporter"].get("displayName")

            # Extract story points (custom field)
            story_points = fields.get("customfield_10016")

            # Extract time tracking
            time_tracking = {}
            if fields.get("timetracking"):
                time_tracking = {
                    "original_estimate": fields["timetracking"].get("originalEstimate"),
                    "remaining_estimate": fields["timetracking"].get("remainingEstimate"),
                    "time_spent": fields["timetracking"].get("timeSpent"),
                }

            issue = {
                "key": issue_data["key"],
                "type": fields["issuetype"]["name"],
                "summary": fields["summary"],
                "status": fields["status"]["name"],
                "priority": fields.get("priority", {}).get("name", "Medium"),
                "assignee": assignee,
                "reporter": reporter,
                "created": fields["created"],
                "updated": fields["updated"],
                "story_points": story_points,
                "labels": fields.get("labels", []),
                "time_tracking": time_tracking if time_tracking else None,
            }

            issues.append(issue)

        return issues

    def extract_all(
        self,
        project_key: str,
        board_id: str | None = None,
        output_path: str | None = None,
    ) -> dict[str, Any]:
        """Extract all Jira data and save to file.

        Args:
            project_key: Jira project key (e.g., "PROJ")
            board_id: Optional board ID for sprint data
            output_path: Optional path to save JSON output

        Returns:
            Complete dataset in FlowSight format
        """
        print(f"Extracting data from Jira project {project_key}...")

        # Extract all data
        project = self.extract_project_info(project_key)
        print(f"✓ Project info extracted: {project['name']}")

        # Extract sprints if board_id provided
        sprints = []
        if board_id:
            try:
                sprints = self.extract_sprints(board_id)
                print(f"✓ {len(sprints)} sprints extracted")
            except Exception as e:
                print(f"⚠ Warning: Could not extract sprints: {e}")

        issues = self.extract_issues(project_key)
        print(f"✓ {len(issues)} issues extracted")

        # Build final dataset
        dataset = {
            "project": project,
            "sprints": sprints,
            "issues": issues,
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "total_issues": len(issues),
                "total_sprints": len(sprints),
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
