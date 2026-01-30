"""Workflow graph models."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Node(BaseModel):
    """A node in the workflow graph representing a delivery artifact."""

    id: str = Field(..., description="Unique identifier (e.g., COMMIT_a1b2c3, PR_42)")
    type: Literal["commit", "pull_request", "ci_run", "issue", "deployment"]
    status: str = Field(..., description="Current status of the artifact")
    created_at: datetime = Field(..., description="When the artifact was created")
    metadata: dict | None = Field(default=None, description="Additional metadata")


class Edge(BaseModel):
    """An edge connecting two nodes in the workflow graph."""

    from_node: str = Field(..., alias="from", description="Source node ID")
    to_node: str = Field(..., alias="to", description="Target node ID")
    type: Literal["triggers", "depends_on", "blocks"] = Field(
        ..., description="Relationship type"
    )

    class Config:
        populate_by_name = True


class WorkflowGraph(BaseModel):
    """The complete workflow graph with nodes and edges."""

    nodes: list[Node] = Field(default_factory=list, description="All workflow nodes")
    edges: list[Edge] = Field(default_factory=list, description="All workflow edges")


class GraphEnvelope(BaseModel):
    """Envelope wrapping the workflow graph for API responses."""

    workflow_graph: WorkflowGraph


# Analysis models (output of workflow_analysis_agent)
class NodeMetrics(BaseModel):
    """Metrics computed for a single node."""

    node_id: str
    age_hours: float
    dep_depth: int = Field(default=0, description="Dependency depth from root")


class GraphMetrics(BaseModel):
    """Aggregate metrics for the entire graph."""

    longest_idle_gap_hours: float = 0
    total_nodes: int = 0
    blocked_nodes: int = 0


class AnalysisResult(BaseModel):
    """Analysis output from workflow_analysis_agent."""

    node_metrics: list[NodeMetrics]
    graph_metrics: GraphMetrics


class AnalysisEnvelope(BaseModel):
    """Envelope wrapping analysis results."""

    analysis: AnalysisResult


# Bottleneck models (output of bottleneck_detection_agent)
class Bottleneck(BaseModel):
    """A detected bottleneck in the workflow."""

    node_id: str
    bottleneck_type: Literal[
        "PR_REVIEW_DELAY",
        "CI_FAILURE_BLOCKER",
        "DEPLOYMENT_STUCK",
        "ISSUE_STALE",
        "MERGE_CONFLICT",
    ]
    severity: Literal["low", "medium", "high", "critical"]
    duration_hours: float
    reason: str


class BottlenecksEnvelope(BaseModel):
    """Envelope wrapping detected bottlenecks."""

    bottlenecks: list[Bottleneck]


# Recommendation models (output of recommendation_agent)
class Recommendation(BaseModel):
    """A recommended action to resolve a bottleneck."""

    bottleneck_node_id: str
    action: str = Field(..., description="Human-readable action to take")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score 0-1")


class RecommendationsEnvelope(BaseModel):
    """Envelope wrapping recommendations."""

    recommendations: list[Recommendation]
