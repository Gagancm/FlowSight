# FlowSight - AI Workflow Intelligence & Decisions

> IBM Dev Day "AI Demystified" Hackathon Project

FlowSight provides role-agnostic workflow visibility across delivery tools. It ingests events from Git, GitHub, Jira, and CI systems, detects bottlenecks, and recommends actions using agentic AI powered by IBM watsonx Orchestrate.

## Problem

Non-technical stakeholders describe business outcomes; engineers live in tools. **The delays live between tools (handoffs), not inside any single tool.** Git clients visualize repositories (descriptive), but FlowSight reasons across the entire delivery pipeline (prescriptive).

## Solution

An n8n-style graph viewer + agentic AI that:
1. **Ingests** events across systems (Git, GitHub, Jira, CI)
2. **Detects** bottlenecks (stale PRs, CI failures, blocked issues)
3. **Recommends** actions accessible to any stakeholder

## Architecture

```
┌─────────────────┐     ┌─────────────────────────────────────────────┐
│    Frontend     │     │         watsonx Orchestrate                 │
│  (Graph Viewer) │◄────┤                                             │
└────────┬────────┘     │  ┌───────────┐  ┌──────────────┐           │
         │              │  │ Ingestion │  │  Workflow    │           │
         │              │  │   Agent   │──│  Analysis    │           │
         │              │  └─────┬─────┘  │    Agent     │           │
         │              │        │        └──────┬───────┘           │
         │              │        │               │                   │
         │              │  ┌─────▼─────┐  ┌──────▼───────┐           │
         │              │  │ OpenAPI   │  │  Bottleneck  │           │
         │              │  │   Tool    │  │  Detection   │           │
         │              │  └───────────┘  │    Agent     │           │
         │              │                 └──────┬───────┘           │
         │              │                        │                   │
         │              │                 ┌──────▼───────┐           │
         │              │                 │Recommendation│           │
         │              │                 │    Agent     │           │
         │              │                 └──────────────┘           │
         │              └─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  FastAPI Mock   │
│      Tool       │
│  (Code Engine)  │
└─────────────────┘
```

## Project Structure

```
FlowSight/
├── backend/
│   ├── app/
│   │   ├── api/mock.py           # API endpoints
│   │   ├── core/settings.py      # Configuration
│   │   ├── models/
│   │   │   ├── events.py         # RawEvent, RawEventsPayload
│   │   │   └── graph.py          # Node, Edge, WorkflowGraph, etc.
│   │   ├── services/
│   │   │   └── normalizer.py     # Raw events → Workflow graph
│   │   └── main.py               # FastAPI app
│   ├── openapi/
│   │   └── mock_tool.yml         # OpenAPI spec for watsonx Orchestrate
│   ├── infra/
│   │   ├── docker/Dockerfile
│   │   └── code_engine/deploy.sh
│   └── requirements.txt
├── frontend/                      # n8n-style graph viewer (TODO)
└── README.md
```

## Agents

| Agent | Purpose | Input | Output |
|-------|---------|-------|--------|
| **ingestion_agent** | Normalize multi-tool events into workflow graph | Raw events (or tool call) | `workflow_graph` JSON |
| **workflow_analysis_agent** | Compute execution metrics | `workflow_graph` | `analysis` JSON |
| **bottleneck_detection_agent** | Classify & rank bottlenecks | `analysis` | `bottlenecks` JSON |
| **recommendation_agent** | Convert bottlenecks to actions | `bottlenecks` | `recommendations` JSON |

## Quick Start

### 1. Run Backend Locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

Test endpoints:
- Health: http://localhost:8080/healthz
- Events: http://localhost:8080/api/v1/mock/events
- Workflow: http://localhost:8080/api/v1/mock/workflow
- Docs: http://localhost:8080/docs

### 2. Deploy to IBM Cloud Code Engine

```bash
cd backend
chmod +x infra/code_engine/deploy.sh
./infra/code_engine/deploy.sh
```

### 3. Import OpenAPI Tool into watsonx Orchestrate

1. Update `backend/openapi/mock_tool.yml` with your Code Engine URL
2. In watsonx Orchestrate: **Tools → Add tool → OpenAPI → Upload mock_tool.yml**
3. Attach tool to `ingestion_agent`

### 4. Test End-to-End

Ask the orchestrator:
> "What's blocking deployment and what should we do next?"

Expected flow:
```
User → Orchestrate → ingestion_agent (tool) → workflow_analysis_agent
    → bottleneck_detection_agent → recommendation_agent → Response
```

## Data Schemas

### RawEvents (input to ingestion)

```json
{
  "raw_events": [
    {"source":"git","type":"commit","id":"a1b2c3","timestamp":"2026-01-30T14:00:00Z","branch":"main"},
    {"source":"github","type":"pull_request","id":"42","timestamp":"2026-01-30T14:30:00Z","status":"open"},
    {"source":"ci","type":"workflow_run","id":"77","timestamp":"2026-01-30T15:00:00Z","conclusion":"failure"},
    {"source":"jira","type":"issue","key":"PROJ-101","timestamp":"2026-01-30T14:10:00Z","status":"In Review"}
  ]
}
```

### WorkflowGraph (output of ingestion)

```json
{
  "workflow_graph": {
    "nodes": [
      {"id": "COMMIT_a1b2c3", "type": "commit", "status": "committed", "created_at": "..."},
      {"id": "PR_42", "type": "pull_request", "status": "open", "created_at": "..."},
      {"id": "CI_77", "type": "ci_run", "status": "failure", "created_at": "..."}
    ],
    "edges": [
      {"from": "COMMIT_a1b2c3", "to": "PR_42", "type": "triggers"},
      {"from": "PR_42", "to": "CI_77", "type": "triggers"}
    ]
  }
}
```

### Bottlenecks (output of bottleneck_detection_agent)

```json
{
  "bottlenecks": [
    {
      "node_id": "PR_42",
      "bottleneck_type": "PR_REVIEW_DELAY",
      "severity": "high",
      "duration_hours": 18,
      "reason": "Waiting on reviewer"
    }
  ]
}
```

### Recommendations (final output)

```json
{
  "recommendations": [
    {
      "bottleneck_node_id": "PR_42",
      "action": "Assign an additional reviewer to PR_42",
      "confidence": 0.82
    }
  ]
}
```

## Judging Criteria Alignment

| Criteria | How FlowSight Addresses It |
|----------|---------------------------|
| **Completeness & Feasibility** | Working FastAPI + OpenAPI tool, clear agent contracts |
| **Effectiveness & Efficiency** | Agentic pipeline reduces manual bottleneck analysis |
| **Design & Usability** | Role-agnostic summaries, n8n-style visualization |
| **Creativity & Innovation** | Cross-tool reasoning (not just Git visualization) |

## Team

- **Engineer A**: Agents/Intelligence (4 agents in watsonx Orchestrate)
- **Engineer B**: Infrastructure/Contracts (FastAPI, OpenAPI, Code Engine)

## License

MIT
