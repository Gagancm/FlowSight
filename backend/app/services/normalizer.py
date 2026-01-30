"""Service to normalize raw events into a workflow graph."""

from datetime import datetime

from app.models.events import RawEvent
from app.models.graph import Edge, Node, WorkflowGraph


def _generate_node_id(event: RawEvent) -> str:
    """Generate a canonical node ID from a raw event."""
    type_prefixes = {
        "commit": "COMMIT",
        "pull_request": "PR",
        "workflow_run": "CI",
        "issue": "ISSUE",
        "deployment": "DEPLOY",
    }
    prefix = type_prefixes.get(event.type, event.type.upper())
    # Use key for Jira issues, otherwise use id
    identifier = event.key if event.key else event.id
    return f"{prefix}_{identifier}"


def _map_status(event: RawEvent) -> str:
    """Map event-specific status to normalized status."""
    if event.type == "commit":
        return "committed"
    if event.type == "workflow_run":
        return event.conclusion or "pending"
    return event.status or "unknown"


def normalize_events_to_graph(events: list[RawEvent]) -> WorkflowGraph:
    """
    Convert raw events into a workflow graph.

    This function:
    1. Creates nodes from each event
    2. Infers edges based on event relationships (triggers, depends_on, blocks)
    """
    nodes: list[Node] = []
    edges: list[Edge] = []

    # Index events by type for relationship inference
    commits: list[RawEvent] = []
    prs: list[RawEvent] = []
    ci_runs: list[RawEvent] = []
    issues: list[RawEvent] = []

    for event in events:
        # Create node
        node = Node(
            id=_generate_node_id(event),
            type=_normalize_type(event.type),
            status=_map_status(event),
            created_at=event.timestamp,
            metadata={
                "source": event.source,
                "author": event.author,
                "assignee": event.assignee,
                "branch": event.branch,
            },
        )
        nodes.append(node)

        # Categorize for edge inference
        if event.type == "commit":
            commits.append(event)
        elif event.type == "pull_request":
            prs.append(event)
        elif event.type == "workflow_run":
            ci_runs.append(event)
        elif event.type == "issue":
            issues.append(event)

    # Infer edges: commits -> PRs (triggers)
    for commit in commits:
        for pr in prs:
            # Simple heuristic: commits on same branch trigger PRs
            if commit.branch and commit.timestamp < pr.timestamp:
                edges.append(
                    Edge(
                        from_node=_generate_node_id(commit),
                        to_node=_generate_node_id(pr),
                        type="triggers",
                    )
                )
                break  # One commit triggers one PR for simplicity

    # Infer edges: PRs -> CI runs (triggers)
    for pr in prs:
        for ci in ci_runs:
            if pr.timestamp < ci.timestamp:
                edges.append(
                    Edge(
                        from_node=_generate_node_id(pr),
                        to_node=_generate_node_id(ci),
                        type="triggers",
                    )
                )
                break

    # Infer edges: Issues -> PRs (depends_on)
    for issue in issues:
        for pr in prs:
            # Heuristic: issues created before PRs may be dependencies
            if issue.timestamp < pr.timestamp:
                edges.append(
                    Edge(
                        from_node=_generate_node_id(issue),
                        to_node=_generate_node_id(pr),
                        type="depends_on",
                    )
                )
                break

    return WorkflowGraph(nodes=nodes, edges=edges)


def _normalize_type(event_type: str) -> str:
    """Normalize event type to graph node type."""
    type_map = {
        "commit": "commit",
        "pull_request": "pull_request",
        "workflow_run": "ci_run",
        "issue": "issue",
        "deployment": "deployment",
    }
    return type_map.get(event_type, event_type)
