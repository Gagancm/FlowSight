"""GitHub data extraction pipeline."""

import json
from datetime import datetime
from typing import Any
from pathlib import Path

import requests


class GitHubExtractor:
    """Extract data from GitHub API and format for FlowSight."""

    def __init__(self, github_token: str | None = None):
        """Initialize GitHub extractor.

        Args:
            github_token: Optional GitHub personal access token for higher rate limits
        """
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if github_token:
            self.headers["Authorization"] = f"Bearer {github_token}"

    def _get(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        """Make GET request to GitHub API."""
        url = f"{self.base_url}{endpoint}"
        response = requests.get(url, headers=self.headers, params=params or {})
        response.raise_for_status()
        return response.json()

    def extract_repository_info(self, owner: str, repo: str) -> dict[str, str]:
        """Extract basic repository information."""
        repo_data = self._get(f"/repos/{owner}/{repo}")
        return {
            "name": repo_data["name"],
            "org": owner,
            "url": repo_data["html_url"],
        }

    def extract_commits(
        self, owner: str, repo: str, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Extract recent commits from repository."""
        commits_data = self._get(
            f"/repos/{owner}/{repo}/commits", params={"per_page": limit}
        )

        commits = []
        for commit in commits_data:
            # Get branch info by checking which branches contain this commit
            branches = self._get(
                f"/repos/{owner}/{repo}/commits/{commit['sha']}/branches-where-head"
            )
            branch = branches[0]["name"] if branches else "main"

            commits.append(
                {
                    "sha": commit["sha"][:12],  # Shorten SHA
                    "message": commit["commit"]["message"].split("\n")[
                        0
                    ],  # First line only
                    "author": commit["commit"]["author"]["name"]
                    if commit["commit"]["author"]
                    else "unknown",
                    "timestamp": commit["commit"]["author"]["date"]
                    if commit["commit"]["author"]
                    else datetime.now().isoformat() + "Z",
                    "branch": branch,
                }
            )

        return commits

    def extract_pull_requests(
        self, owner: str, repo: str, state: str = "all", limit: int = 20
    ) -> list[dict[str, Any]]:
        """Extract pull requests with reviews and checks."""
        prs_data = self._get(
            f"/repos/{owner}/{repo}/pulls",
            params={"state": state, "per_page": limit, "sort": "updated", "direction": "desc"},
        )

        pull_requests = []
        for pr in prs_data:
            # Get reviews
            reviews_data = self._get(
                f"/repos/{owner}/{repo}/pulls/{pr['number']}/reviews"
            )
            reviews = [
                {
                    "reviewer": review["user"]["login"] if review["user"] else "unknown",
                    "state": review["state"],
                    "submitted_at": review["submitted_at"],
                }
                for review in reviews_data
            ]

            # Get commits in PR
            commits_data = self._get(
                f"/repos/{owner}/{repo}/pulls/{pr['number']}/commits"
            )
            pr_commits = [commit["sha"][:12] for commit in commits_data]

            # Get checks/CI status
            if pr["head"]["sha"]:
                try:
                    checks_data = self._get(
                        f"/repos/{owner}/{repo}/commits/{pr['head']['sha']}/check-runs"
                    )
                    checks = [
                        {"name": check["name"], "status": check["conclusion"] or "pending"}
                        for check in checks_data.get("check_runs", [])
                    ]
                    # Determine overall CI status
                    if all(c["status"] == "success" for c in checks):
                        ci_status = "passing"
                    elif any(c["status"] in ["failure", "cancelled"] for c in checks):
                        ci_status = "failing"
                    else:
                        ci_status = "pending"
                except Exception:
                    checks = []
                    ci_status = "unknown"
            else:
                checks = []
                ci_status = "unknown"

            # Calculate review time
            created_at = datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))
            if pr["merged_at"]:
                merged_at = datetime.fromisoformat(
                    pr["merged_at"].replace("Z", "+00:00")
                )
                review_time_hours = int((merged_at - created_at).total_seconds() / 3600)
            else:
                now = datetime.now().astimezone()
                review_time_hours = int((now - created_at).total_seconds() / 3600)

            # Extract labels
            labels = [label["name"] for label in pr.get("labels", [])]

            # Extract requested reviewers
            requested_reviewers = [
                reviewer["login"] for reviewer in pr.get("requested_reviewers", [])
            ]

            pr_dict = {
                "number": pr["number"],
                "title": pr["title"],
                "author": pr["user"]["login"] if pr["user"] else "unknown",
                "state": pr["state"],
                "created_at": pr["created_at"],
                "base_branch": pr["base"]["ref"],
                "head_branch": pr["head"]["ref"],
                "commits": pr_commits,
                "reviews": reviews,
                "review_time_hours": review_time_hours,
                "files_changed": pr.get("changed_files", 0),
                "additions": pr.get("additions", 0),
                "deletions": pr.get("deletions", 0),
            }

            # Add optional fields
            if pr["merged_at"]:
                pr_dict["merged_at"] = pr["merged_at"]

            if labels:
                pr_dict["labels"] = labels

            if requested_reviewers:
                pr_dict["requested_reviewers"] = requested_reviewers

            if checks:
                pr_dict["checks"] = checks
                pr_dict["ci_status"] = ci_status

            # Try to extract linked issues from body
            linked_issues = []
            if pr["body"]:
                # Simple regex to find issue references like #123 or PROJ-123
                import re

                issue_refs = re.findall(r"(?:#(\d+)|([A-Z]+-\d+))", pr["body"])
                for ref in issue_refs:
                    if ref[0]:  # GitHub issue number
                        linked_issues.append(f"#{ref[0]}")
                    elif ref[1]:  # JIRA-style issue
                        linked_issues.append(ref[1])

            if linked_issues:
                pr_dict["linked_issues"] = linked_issues

            pull_requests.append(pr_dict)

        return pull_requests

    def extract_workflow_runs(
        self, owner: str, repo: str, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Extract CI/CD workflow runs."""
        runs_data = self._get(
            f"/repos/{owner}/{repo}/actions/runs", params={"per_page": limit}
        )

        ci_runs = []
        for run in runs_data.get("workflow_runs", []):
            # Map GitHub status/conclusion to our format
            if run["conclusion"] == "success":
                status = "success"
            elif run["conclusion"] in ["failure", "cancelled", "timed_out"]:
                status = run["conclusion"]
            elif run["status"] == "in_progress":
                status = "in_progress"
            else:
                status = "pending"

            ci_run = {
                "id": f"run-{run['id']}",
                "workflow": run["name"],
                "trigger": run["event"],
                "status": status,
                "started_at": run["created_at"],
            }

            if run["updated_at"]:
                ci_run["completed_at"] = run["updated_at"]

            # Calculate duration
            if run["created_at"] and run["updated_at"]:
                started = datetime.fromisoformat(
                    run["created_at"].replace("Z", "+00:00")
                )
                completed = datetime.fromisoformat(
                    run["updated_at"].replace("Z", "+00:00")
                )
                duration_minutes = int((completed - started).total_seconds() / 60)
                ci_run["duration_minutes"] = duration_minutes

            # Try to extract PR number from event
            if run["event"] == "pull_request" and run.get("pull_requests"):
                pr_numbers = [pr["number"] for pr in run["pull_requests"]]
                if pr_numbers:
                    ci_run["pr_number"] = pr_numbers[0]

            ci_runs.append(ci_run)

        return ci_runs

    def extract_deployments(
        self, owner: str, repo: str, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Extract deployment information."""
        deployments_data = self._get(
            f"/repos/{owner}/{repo}/deployments", params={"per_page": limit}
        )

        deployments = []
        for deploy in deployments_data:
            # Get deployment status
            statuses_data = self._get(
                f"/repos/{owner}/{repo}/deployments/{deploy['id']}/statuses"
            )
            latest_status = statuses_data[0] if statuses_data else None

            deployment = {
                "id": f"deploy-{deploy['id']}",
                "environment": deploy["environment"],
                "ref": deploy["ref"][:12] if deploy["ref"] else "unknown",
                "status": latest_status["state"] if latest_status else "pending",
                "created_at": deploy["created_at"],
            }

            if latest_status and latest_status["state"] == "success":
                deployment["deployed_at"] = latest_status["created_at"]

            if deploy.get("creator"):
                deployment["deployed_by"] = deploy["creator"]["login"]

            deployments.append(deployment)

        return deployments

    def extract_all(
        self, owner: str, repo: str, output_path: str | None = None, include_raw_events: bool = True
    ) -> dict[str, Any]:
        """Extract all GitHub data and save to file.

        Args:
            owner: Repository owner (user or organization)
            repo: Repository name
            output_path: Optional path to save JSON output
            include_raw_events: Include normalized RawEvent format (default: True)

        Returns:
            Complete dataset in FlowSight format
        """
        print(f"Extracting data from {owner}/{repo}...")

        # Extract all data
        repository = self.extract_repository_info(owner, repo)
        print(f"✓ Repository info extracted")

        commits = self.extract_commits(owner, repo)
        print(f"✓ {len(commits)} commits extracted")

        pull_requests = self.extract_pull_requests(owner, repo)
        print(f"✓ {len(pull_requests)} pull requests extracted")

        ci_runs = self.extract_workflow_runs(owner, repo)
        print(f"✓ {len(ci_runs)} CI runs extracted")

        deployments = self.extract_deployments(owner, repo)
        print(f"✓ {len(deployments)} deployments extracted")

        # Build final dataset
        dataset = {
            "repository": repository,
            "commits": commits,
            "pull_requests": pull_requests,
            "ci_runs": ci_runs,
            "deployments": deployments,
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "total_commits": len(commits),
                "total_prs": len(pull_requests),
                "open_prs": len([pr for pr in pull_requests if pr["state"] == "open"]),
            },
        }

        # Add raw_events format if requested
        if include_raw_events:
            from app.pipeline.core.transformer import transform_github_to_raw_events

            raw_events = transform_github_to_raw_events(dataset)
            dataset["raw_events"] = [event.model_dump(mode="json") for event in raw_events]
            print(f"✓ {len(raw_events)} events normalized to RawEvent format")

        # Save to file if path provided
        if output_path:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            with open(output_file, "w") as f:
                json.dump(dataset, f, indent=2)
            print(f"✓ Data saved to {output_path}")

        return dataset
