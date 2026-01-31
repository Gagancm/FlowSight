"""Upload GitHub data to IBM Astra DB for watsonx AI integration."""

import json
import os
from datetime import datetime
from typing import Any

from astrapy import DataAPIClient


class AstraDBUploader:
    """Upload and manage data in Astra DB."""

    def __init__(
        self,
        token: str | None = None,
        api_endpoint: str | None = None,
        keyspace: str = "flowsight",
    ):
        """Initialize Astra DB connection.

        Args:
            token: Astra DB application token
            api_endpoint: Astra DB API endpoint URL
            keyspace: Database keyspace name (default: flowsight)
        """
        self.token = token or os.getenv("ASTRA_DB_TOKEN")
        self.api_endpoint = api_endpoint or os.getenv("ASTRA_DB_ENDPOINT")
        self.keyspace = keyspace or os.getenv("ASTRA_DB_KEYSPACE", "flowsight")

        if not self.token or not self.api_endpoint:
            raise ValueError(
                "Astra DB token and endpoint required. "
                "Set ASTRA_DB_TOKEN and ASTRA_DB_ENDPOINT environment variables."
            )

        # Initialize client
        self.client = DataAPIClient(self.token)
        self.db = self.client.get_database(self.api_endpoint)

        # Collection names
        self.collections = {
            "repositories": "repositories",
            "commits": "commits",
            "pull_requests": "pull_requests",
            "ci_runs": "ci_runs",
            "deployments": "deployments",
            "workflow_events": "workflow_events",  # Normalized events for AI
        }

    def _ensure_collections(self):
        """Create collections if they don't exist."""
        print("Setting up Astra DB collections...")

        for collection_name in self.collections.values():
            try:
                # Check if collection exists, create if not
                collections = self.db.list_collection_names()
                if collection_name not in collections:
                    self.db.create_collection(collection_name)
                    print(f"  ✓ Created collection: {collection_name}")
                else:
                    print(f"  ✓ Collection exists: {collection_name}")
            except Exception as e:
                print(f"  ✗ Error with collection {collection_name}: {e}")

    def upload_github_data(self, data: dict[str, Any], repo_id: str | None = None) -> dict[str, int]:
        """Upload GitHub data to Astra DB.

        Args:
            data: GitHub data dictionary from GitHubExtractor
            repo_id: Optional custom repository ID (default: org/repo-name)

        Returns:
            Dictionary with counts of uploaded documents
        """
        self._ensure_collections()

        # Generate repo_id if not provided
        if not repo_id:
            repo_info = data.get("repository", {})
            repo_id = f"{repo_info.get('org')}/{repo_info.get('name')}"

        counts = {
            "repositories": 0,
            "commits": 0,
            "pull_requests": 0,
            "ci_runs": 0,
            "deployments": 0,
            "workflow_events": 0,
        }

        # Upload repository info
        print(f"\nUploading data for repository: {repo_id}")

        repo_doc = {
            "_id": repo_id,
            **data.get("repository", {}),
            "metadata": data.get("metadata", {}),
            "updated_at": datetime.now().isoformat(),
        }
        repo_collection = self.db.get_collection(self.collections["repositories"])
        repo_collection.insert_one(repo_doc)
        counts["repositories"] = 1
        print(f"  ✓ Repository info uploaded")

        # Upload commits
        commits_collection = self.db.get_collection(self.collections["commits"])
        for commit in data.get("commits", []):
            commit_doc = {
                "_id": f"{repo_id}/{commit['sha']}",
                "repo_id": repo_id,
                **commit,
            }
            commits_collection.insert_one(commit_doc)
            counts["commits"] += 1
        print(f"  ✓ {counts['commits']} commits uploaded")

        # Upload pull requests
        prs_collection = self.db.get_collection(self.collections["pull_requests"])
        for pr in data.get("pull_requests", []):
            pr_doc = {
                "_id": f"{repo_id}/pr-{pr['number']}",
                "repo_id": repo_id,
                **pr,
            }
            prs_collection.insert_one(pr_doc)
            counts["pull_requests"] += 1
        print(f"  ✓ {counts['pull_requests']} pull requests uploaded")

        # Upload CI runs
        ci_collection = self.db.get_collection(self.collections["ci_runs"])
        for ci_run in data.get("ci_runs", []):
            ci_doc = {
                "_id": f"{repo_id}/{ci_run['id']}",
                "repo_id": repo_id,
                **ci_run,
            }
            ci_collection.insert_one(ci_doc)
            counts["ci_runs"] += 1
        print(f"  ✓ {counts['ci_runs']} CI runs uploaded")

        # Upload deployments
        deploy_collection = self.db.get_collection(self.collections["deployments"])
        for deployment in data.get("deployments", []):
            deploy_doc = {
                "_id": f"{repo_id}/{deployment['id']}",
                "repo_id": repo_id,
                **deployment,
            }
            deploy_collection.insert_one(deploy_doc)
            counts["deployments"] += 1
        print(f"  ✓ {counts['deployments']} deployments uploaded")

        # Create normalized workflow events for AI analysis
        events_collection = self.db.get_collection(self.collections["workflow_events"])
        workflow_events = self._normalize_to_events(data, repo_id)
        for event in workflow_events:
            events_collection.insert_one(event)
            counts["workflow_events"] += 1
        print(f"  ✓ {counts['workflow_events']} workflow events created")

        return counts

    def _normalize_to_events(
        self, data: dict[str, Any], repo_id: str
    ) -> list[dict[str, Any]]:
        """Normalize GitHub data into workflow events for AI analysis.

        This creates a unified event stream that AI agents can analyze.
        """
        events = []

        # Add commit events
        for commit in data.get("commits", []):
            events.append(
                {
                    "_id": f"{repo_id}/event-commit-{commit['sha']}",
                    "repo_id": repo_id,
                    "type": "commit",
                    "source": "github",
                    "timestamp": commit["timestamp"],
                    "author": commit["author"],
                    "branch": commit.get("branch"),
                    "id": commit["sha"],
                    "key": None,
                    "status": "committed",
                    "assignee": None,
                    "data": commit,
                }
            )

        # Add PR events
        for pr in data.get("pull_requests", []):
            events.append(
                {
                    "_id": f"{repo_id}/event-pr-{pr['number']}",
                    "repo_id": repo_id,
                    "type": "pull_request",
                    "source": "github",
                    "timestamp": pr["created_at"],
                    "author": pr["author"],
                    "branch": pr.get("head_branch"),
                    "id": str(pr["number"]),
                    "key": f"PR-{pr['number']}",
                    "status": pr["state"],
                    "assignee": pr.get("requested_reviewers", [None])[0]
                    if pr.get("requested_reviewers")
                    else None,
                    "data": pr,
                }
            )

        # Add CI run events
        for ci_run in data.get("ci_runs", []):
            events.append(
                {
                    "_id": f"{repo_id}/event-ci-{ci_run['id']}",
                    "repo_id": repo_id,
                    "type": "workflow_run",
                    "source": "github",
                    "timestamp": ci_run["started_at"],
                    "author": None,
                    "branch": None,
                    "id": ci_run["id"],
                    "key": None,
                    "status": ci_run["status"],
                    "conclusion": ci_run.get("status"),
                    "assignee": None,
                    "data": ci_run,
                }
            )

        # Add deployment events
        for deployment in data.get("deployments", []):
            events.append(
                {
                    "_id": f"{repo_id}/event-deploy-{deployment['id']}",
                    "repo_id": repo_id,
                    "type": "deployment",
                    "source": "github",
                    "timestamp": deployment["created_at"],
                    "author": deployment.get("deployed_by"),
                    "branch": None,
                    "id": deployment["id"],
                    "key": None,
                    "status": deployment["status"],
                    "assignee": None,
                    "data": deployment,
                }
            )

        return events

    def upload_from_file(self, file_path: str, repo_id: str | None = None) -> dict[str, int]:
        """Load GitHub data from JSON file and upload to Astra DB.

        Args:
            file_path: Path to JSON file with GitHub data
            repo_id: Optional custom repository ID

        Returns:
            Dictionary with counts of uploaded documents
        """
        with open(file_path, "r") as f:
            data = json.load(f)

        return self.upload_github_data(data, repo_id)

    def query_workflow_events(
        self, repo_id: str, event_type: str | None = None, limit: int = 100
    ) -> list[dict[str, Any]]:
        """Query workflow events for a repository.

        Args:
            repo_id: Repository ID (org/repo-name)
            event_type: Optional event type filter (commit, pull_request, workflow_run, deployment)
            limit: Maximum number of events to return

        Returns:
            List of workflow events
        """
        events_collection = self.db.get_collection(self.collections["workflow_events"])

        filter_query = {"repo_id": repo_id}
        if event_type:
            filter_query["type"] = event_type

        cursor = events_collection.find(filter_query, limit=limit)
        return list(cursor)
