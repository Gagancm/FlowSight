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
