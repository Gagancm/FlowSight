"""Mock API endpoints for the FlowSight tool."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter

from app.models.events import RawEvent, RawEventsPayload
from app.models.graph import Edge, GraphEnvelope, Node, WorkflowGraph
from app.services.normalizer import normalize_events_to_graph

router = APIRouter(tags=["mock"])


def _get_mock_raw_events() -> list[RawEvent]:
    """Generate mock raw events for demonstration."""
    base_time = datetime.now(timezone.utc) - timedelta(hours=24)

    return [
        RawEvent(
            source="git",
            type="commit",
            id="a1b2c3d",
            timestamp=base_time,
            branch="feature/auth-flow",
            author="dev1",
        ),
        RawEvent(
            source="git",
            type="commit",
            id="e4f5g6h",
            timestamp=base_time + timedelta(hours=1),
            branch="feature/auth-flow",
            author="dev1",
        ),
        RawEvent(
            source="github",
            type="pull_request",
            id="42",
            timestamp=base_time + timedelta(hours=2),
            status="open",
            author="dev1",
            branch="feature/auth-flow",
        ),
        RawEvent(
            source="ci",
            type="workflow_run",
            id="77",
            timestamp=base_time + timedelta(hours=3),
            conclusion="failure",
        ),
        RawEvent(
            source="ci",
            type="workflow_run",
            id="78",
            timestamp=base_time + timedelta(hours=5),
            conclusion="success",
        ),
        RawEvent(
            source="jira",
            type="issue",
            id="101",
            key="PROJ-101",
            timestamp=base_time - timedelta(hours=12),
            status="In Review",
            assignee="dev1",
        ),
        RawEvent(
            source="jira",
            type="issue",
            id="102",
            key="PROJ-102",
            timestamp=base_time + timedelta(hours=6),
            status="Blocked",
            assignee="dev2",
        ),
        RawEvent(
            source="github",
            type="pull_request",
            id="43",
            timestamp=base_time + timedelta(hours=18),
            status="draft",
            author="dev2",
            branch="feature/dashboard",
        ),
    ]


def _get_mock_workflow_graph() -> WorkflowGraph:
    """Generate a prebuilt mock workflow graph for fast demos."""
    base_time = datetime.now(timezone.utc) - timedelta(hours=24)

    nodes = [
        Node(
            id="COMMIT_a1b2c3d",
            type="commit",
            status="committed",
            created_at=base_time,
            metadata={"branch": "feature/auth-flow", "author": "dev1"},
        ),
        Node(
            id="PR_42",
            type="pull_request",
            status="open",
            created_at=base_time + timedelta(hours=2),
            metadata={"author": "dev1", "reviewers_pending": 2},
        ),
        Node(
            id="CI_77",
            type="ci_run",
            status="failure",
            created_at=base_time + timedelta(hours=3),
            metadata={"error": "Test suite failed: 3 tests"},
        ),
        Node(
            id="CI_78",
            type="ci_run",
            status="success",
            created_at=base_time + timedelta(hours=5),
        ),
        Node(
            id="ISSUE_PROJ-101",
            type="issue",
            status="In Review",
            created_at=base_time - timedelta(hours=12),
            metadata={"assignee": "dev1", "priority": "high"},
        ),
        Node(
            id="ISSUE_PROJ-102",
            type="issue",
            status="Blocked",
            created_at=base_time + timedelta(hours=6),
            metadata={"assignee": "dev2", "blocker": "PR_42"},
        ),
        Node(
            id="PR_43",
            type="pull_request",
            status="draft",
            created_at=base_time + timedelta(hours=18),
            metadata={"author": "dev2"},
        ),
    ]

    edges = [
        Edge(from_node="COMMIT_a1b2c3d", to_node="PR_42", type="triggers"),
        Edge(from_node="PR_42", to_node="CI_77", type="triggers"),
        Edge(from_node="PR_42", to_node="CI_78", type="triggers"),
        Edge(from_node="ISSUE_PROJ-101", to_node="PR_42", type="depends_on"),
        Edge(from_node="PR_42", to_node="ISSUE_PROJ-102", type="blocks"),
    ]

    return WorkflowGraph(nodes=nodes, edges=edges)


@router.get("/healthz", summary="Health check endpoint")
async def health_check() -> dict:
    """Check if the service is healthy."""
    return {"status": "healthy", "service": "flowsight-mock-tool"}


@router.get(
    "/mock/events",
    response_model=RawEventsPayload,
    summary="Get mock project events",
    description="Returns mixed raw events (Git commits, PRs, CI runs, Jira issues) "
    "that can be used to build a workflow graph. Use this endpoint when you need "
    "to demonstrate the ingestion agent's normalization capabilities.",
    operation_id="get_mock_events",
)
async def get_mock_events() -> RawEventsPayload:
    """
    Fetch mock project events from various source systems.

    Returns a collection of raw events including:
    - Git commits
    - GitHub pull requests
    - CI workflow runs
    - Jira issues

    These events can be processed by the ingestion agent to create a workflow graph.
    """
    return RawEventsPayload(raw_events=_get_mock_raw_events())


@router.get(
    "/mock/workflow",
    response_model=GraphEnvelope,
    summary="Get prebuilt workflow graph",
    description="Returns a ready-made workflow graph for fast demos. Use this endpoint "
    "when you want to skip the normalization step and directly test analysis, "
    "bottleneck detection, or recommendation agents.",
    operation_id="get_mock_workflow",
)
async def get_mock_workflow() -> GraphEnvelope:
    """
    Fetch a prebuilt workflow graph.

    Returns a complete workflow graph with:
    - Nodes representing commits, PRs, CI runs, and issues
    - Edges showing relationships (triggers, depends_on, blocks)

    This is useful for fast demos or testing downstream agents.
    """
    return GraphEnvelope(workflow_graph=_get_mock_workflow_graph())


def _get_mock_branches() -> list[dict]:
    """Mock branch data for the Flow page."""
    return [
        {
            "id": "main",
            "name": "main",
            "status": "success",
            "author": "system",
        },
        {
            "id": "nwl-branch",
            "name": "nwl-branch",
            "parent": "main",
            "pulledFrom": "main",
            "status": "warning",
            "author": "team",
            "conflicts": ["auth.js"],
        },
        {
            "id": "release/1.0",
            "name": "release/1.0",
            "parent": "main",
            "pulledFrom": "main",
            "status": "success",
            "author": "team",
        },
        {
            "id": "feature/auth-refactor",
            "name": "feature/auth-refactor",
            "parent": "nwl-branch",
            "mergeInto": "nwl-branch",
            "pulledFrom": "nwl-branch",
            "author": "sarah",
            "status": "critical",
            "jiraTicket": "JIRA-247",
            "jiraTitle": "Auth Refactor",
            "prId": 247,
            "prStatus": "awaiting_review",
            "daysWaiting": 3,
            "filesModified": ["auth.js", "user.js"],
            "blocking": ["feature/login-ui", "nwl-merge"],
        },
        {
            "id": "feature/login-ui",
            "name": "feature/login-ui",
            "parent": "nwl-branch",
            "mergeInto": "nwl-branch",
            "pulledFrom": "nwl-branch",
            "author": "mike",
            "status": "warning",
            "jiraTicket": "JIRA-248",
            "jiraTitle": "Login UI",
            "prId": 248,
            "daysWaiting": 1,
            "filesModified": ["auth.js", "login.jsx"],
            "conflicts": ["feature/auth-refactor"],
        },
        {
            "id": "feature/api-endpoint",
            "name": "feature/api-endpoint",
            "parent": "nwl-branch",
            "mergeInto": "nwl-branch",
            "pulledFrom": "nwl-branch",
            "author": "emma",
            "status": "success",
            "jiraTicket": "JIRA-251",
            "jiraTitle": "API Endpoint",
            "prId": 251,
        },
    ]


def _get_mock_branch_details() -> dict[str, dict]:
    """Mock branch details with bottleneck and recommendation data."""
    branches = {b["id"]: b for b in _get_mock_branches()}
    return {
        "feature/auth-refactor": {
            **branches["feature/auth-refactor"],
            "owner": "Sarah Chen",
            "ownerTeam": "Backend Team",
            "jiraStatus": "In Progress",
            "jiraStoryPoints": 8,
            "prCreatedAt": "2026-01-27T08:00:00Z",
            "reviewers": ["@john", "@mike"],
            "ciStatus": "passed",
            "bottleneck": {
                "severity": "CRITICAL",
                "waitTimeHours": 72,
                "deviationFactor": 6,
                "rootCause": ["Both reviewers have 4+ pending PRs", "Team avg capacity exceeded"],
                "blockingCount": 2,
            },
            "recommendation": {
                "action": "Add @emma as reviewer",
                "rationale": "She reviewed 3 similar auth PRs this month, has capacity (1 PR vs team avg 2.5)",
                "expectedImpact": "Reduce wait time by ~48 hours",
                "alternatives": ["Split PR into smaller chunks"],
            },
        },
        "feature/login-ui": {
            **branches["feature/login-ui"],
            "owner": "Mike Johnson",
            "ownerTeam": "Frontend Team",
            "jiraStatus": "In Progress",
            "jiraStoryPoints": 5,
            "prCreatedAt": "2026-01-29T10:00:00Z",
            "reviewers": ["@sarah"],
            "ciStatus": "passed",
            "bottleneck": {
                "severity": "MEDIUM",
                "waitTimeHours": 24,
                "deviationFactor": 2,
                "rootCause": ["Blocked by feature/auth-refactor merge conflict"],
                "blockingCount": 0,
            },
            "recommendation": {
                "action": "Rebase on feature/auth-refactor after it merges",
                "rationale": "Conflict in auth.js will auto-resolve once auth-refactor is merged",
                "expectedImpact": "Unblock within 24 hours of auth-refactor merge",
                "alternatives": ["Manually resolve conflict now"],
            },
        },
        "nwl-branch": {
            **branches["nwl-branch"],
            "owner": "Team Lead",
            "ownerTeam": "Core Team",
            "jiraStatus": "Active Sprint",
            "bottleneck": {
                "severity": "LOW",
                "waitTimeHours": 0,
                "rootCause": ["Integration branch - waiting on feature PRs"],
                "blockingCount": 0,
            },
            "recommendation": {
                "action": "Monitor feature/auth-refactor progress",
                "rationale": "Main blocker for sprint completion",
                "expectedImpact": "Sprint can close once auth-refactor merges",
            },
        },
    }


@router.get(
    "/mock/branches",
    summary="Get all branches for Flow page",
    description="Returns all branches with their status and relationships.",
    operation_id="get_mock_branches",
)
async def get_mock_branches() -> dict:
    """Fetch all branches for the Flow page visualization."""
    return {"branches": _get_mock_branches()}


@router.get(
    "/mock/branch/{branch_id:path}",
    summary="Get branch details with bottleneck analysis",
    description="Returns detailed branch info including AI-detected bottlenecks and recommendations.",
    operation_id="get_mock_branch_detail",
)
async def get_mock_branch_detail(branch_id: str) -> dict:
    """Fetch detailed branch info for hover panel."""
    details = _get_mock_branch_details()
    if branch_id in details:
        return details[branch_id]
    # Return basic info for branches without detailed analysis
    branches = {b["id"]: b for b in _get_mock_branches()}
    if branch_id in branches:
        return {**branches[branch_id], "owner": "Unknown", "bottleneck": None, "recommendation": None}
    return {"error": "Branch not found", "id": branch_id}


@router.post(
    "/mock/normalize",
    response_model=GraphEnvelope,
    summary="Normalize raw events to workflow graph",
    description="Accepts raw events and normalizes them into a workflow graph. "
    "This demonstrates what the ingestion agent does internally.",
    operation_id="normalize_events",
)
async def normalize_events(payload: RawEventsPayload) -> GraphEnvelope:
    """
    Normalize raw events into a workflow graph.

    This endpoint accepts raw events from various sources and:
    1. Creates nodes for each event
    2. Infers edges based on temporal and logical relationships
    3. Returns a structured workflow graph
    """
    graph = normalize_events_to_graph(payload.raw_events)
    return GraphEnvelope(workflow_graph=graph)
