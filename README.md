<p align="center">
  <img src="frontend/src/assets/images/flowsight-logo.png" alt="FlowSight Logo" width="120" />
</p>

<h1 align="center">FlowSight</h1>

<p align="center">
  <strong>AI-Powered Workflow Intelligence & Delivery Acceleration</strong>
</p>

<p align="center">
  <a href="#-the-problem">Problem</a> •
  <a href="#-the-solution">Solution</a> •
  <a href="#%EF%B8%8F-architecture">Architecture</a> •
  <a href="#-watsonx-orchestrate-agents">Agents</a> •
  <a href="#-etl-pipeline">ETL Pipeline</a> •
  <a href="#-quick-start">Quick Start</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/IBM-watsonx%20Orchestrate-052FAD?style=for-the-badge&logo=ibm" alt="IBM watsonx" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Astra%20DB-0052CC?style=for-the-badge&logo=datastax" alt="Astra DB" />
</p>

<p align="center">
  <em>Built in 48 hours for IBM Dev Day "AI Demystified" Hackathon</em><br/>
  <strong>Team Titan</strong> • Jan 30–Feb 1, 2026
</p>

---

## The Problem

Engineering teams lose **4-8 hours per week** to invisible delays:

| Pain Point | Impact |
|------------|--------|
| Stale PRs waiting for review | Average PR waits **24+ hours** for first review |
| CI failures cascading silently | Downstream work blocked without visibility |
| Issues stuck without escalation | **73% of engineering leaders** lack visibility into blockers |

**Existing tools show dashboards, not answers.**

The critical question remains unanswered:

> *"Why are we blocked, and what should we do next?"*

---

## The Solution

**FlowSight** is an AI-powered workflow intelligence layer that transforms raw engineering activity into **actionable insights**.

### What It Does

| Capability | Description |
|------------|-------------|
| **Unified Analysis** | Normalizes events from GitHub, Jira, Slack, Teams, and CI systems into a canonical workflow graph |
| **Intelligent Detection** | Applies rule-based reasoning to identify bottlenecks, blockers, and latency patterns |
| **Actionable Insights** | Generates concrete next steps with confidence scores to unblock delivery immediately |

### Example Interaction

**User asks:** *"Why is the payments feature delayed?"*

**FlowSight responds:**

| Action | Confidence |
|--------|------------|
| Assign @sarah to review PR #247 "Payment API integration" — waiting 3 days | 94% |
| Fix failing test in `payment_service_test.py` — CI #891 failed twice | 87% |
| JIRA PAY-142 auto-unblocks when PR #247 merges | 82% |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DATA SOURCES                                     │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│    │  GitHub  │  │   Jira   │  │  Slack   │  │  Teams   │  │   CI/CD  │     │
│    └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
└─────────┼─────────────┼─────────────┼─────────────┼─────────────┼────────────┘
          │             │             │             │             │
          ▼             ▼             ▼             ▼             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ETL PIPELINE                                        │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐          │
│  │ Extractors │ → │  Cleaners  │ → │Transformer │ → │ Embeddings │          │
│  └────────────┘   └────────────┘   └────────────┘   └────────────┘          │
│                                                            │                  │
│                                                            ▼                  │
│                                                     ┌────────────┐           │
│                                                     │  Astra DB  │           │
│                                                     │(6 collections)│         │
│                                                     └────────────┘           │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        IBM WATSONX ORCHESTRATE                                │
│                                                                               │
│    ┌─────────────────────────────────────────────────────────────────┐       │
│    │                    ORCHESTRATOR AGENT                            │       │
│    │         Routes requests • Chains agents • Maintains context      │       │
│    └─────────────────────────────────────────────────────────────────┘       │
│                                    │                                          │
│         ┌──────────────────────────┼──────────────────────────┐              │
│         ▼                          ▼                          ▼              │
│    ┌──────────┐            ┌──────────────┐           ┌──────────────┐       │
│    │Ingestion │     →      │  Workflow    │     →     │  Bottleneck  │       │
│    │  Agent   │            │   Analysis   │           │  Detection   │       │
│    │          │            │    Agent     │           │    Agent     │       │
│    └──────────┘            └──────────────┘           └──────────────┘       │
│         │                                                     │              │
│         │                  ┌──────────────┐                   │              │
│         │                  │Recommendation│ ←─────────────────┘              │
│         │                  │    Agent     │                                  │
│         │                  └──────────────┘                                  │
│         │                          │                                          │
└─────────┼──────────────────────────┼─────────────────────────────────────────┘
          │                          │
          ▼                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION LAYER                                  │
│                                                                               │
│    ┌────────────────┐              ┌─────────────────────────────────┐       │
│    │ FastAPI Backend│◄────────────►│         React Frontend          │       │
│    │                │              │                                 │       │
│    │ • Chat API     │              │ • AI Insights (Chat Interface)  │       │
│    │ • Mock Tools   │              │ • Flow (Branch Visualization)   │       │
│    │ • Graph Builder│              │ • Connections (Tool Mapping)    │       │
│    └────────────────┘              └─────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Watsonx Orchestrate Agents

FlowSight uses **5 specialized AI agents** orchestrated by IBM watsonx Orchestrate, with **10+ tools** distributed across them.

### Agent Overview

| Agent | Purpose | Tools |
|-------|---------|-------|
| **Orchestrator** | Routes requests, chains agents, maintains thread context | Request router, Context manager |
| **Ingestion** | Collects and normalizes events from multiple sources | `github_fetch`, `jira_fetch`, `slack_fetch`, `teams_fetch`, `ci_webhook_parser` |
| **Workflow Analysis** | Builds workflow graph, computes timing and dependencies | `graph_builder`, `timing_calculator`, `dependency_mapper` |
| **Bottleneck Detection** | Identifies PR delays, CI failures, idle gaps | `pr_delay_detector`, `ci_failure_analyzer`, `idle_gap_scanner` |
| **Recommendation** | Generates prioritized actions with confidence scores | `action_generator`, `confidence_scorer`, `priority_ranker` |

### Agent Data Flow

```
User Query: "What's blocking delivery?"
                    │
                    ▼
         ┌──────────────────┐
         │   Orchestrator   │ ← Receives query, determines intent
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Ingestion Agent  │ ← Fetches events from GitHub, Jira, CI
         │                  │   Output: workflow_graph (47 nodes, 62 edges)
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Workflow Analysis│ ← Computes timing, dependencies, critical path
         │      Agent       │   Output: timing_metrics, dependency_depth
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │   Bottleneck     │ ← Identifies blockers and delays
         │ Detection Agent  │   Output: 3 bottlenecks (PR_DELAY, CI_FAILURE, BLOCKED_ISSUE)
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Recommendation  │ ← Converts bottlenecks to actions
         │      Agent       │   Output: Ranked actions with confidence scores
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  User Response   │ → "Assign @sarah to PR #247 (94% confidence)"
         └──────────────────┘
```

---

## ETL Pipeline

A **production-ready data pipeline** that ingests, cleans, transforms, and stores workflow data at scale.

### Pipeline Stages

| Stage | Description | Components |
|-------|-------------|------------|
| **Extract** | Pull data from external systems via APIs | GitHub, Jira, Slack, Teams extractors |
| **Clean** | Normalize, deduplicate, validate records | Date normalization, status mapping, user cleanup |
| **Transform** | Convert to unified `RawEvent` format | Field mapping, metadata enrichment |
| **Embed** | Generate semantic embeddings for AI search | IBM Slate (768-dim), BM25 hybrid |
| **Load** | Store in Astra DB for querying | 6 collections, vector-enabled |

### Supported Data Sources

| Source | What We Extract |
|--------|-----------------|
| **GitHub** | Repositories, commits, PRs (with reviews, CI status), workflow runs, deployments |
| **Jira** | Projects, sprints, issues (with story points, time tracking, custom fields) |
| **Slack** | Workspaces, channels, messages (with reactions, mentions, threads) |
| **Microsoft Teams** | Teams, channels, messages, calendar meetings |

### Astra DB Collections

| Collection | Purpose |
|------------|---------|
| `repositories` | Repository metadata |
| `commits` | Commit records with branch info |
| `pull_requests` | PR data with review status |
| `ci_runs` | CI/CD workflow runs |
| `deployments` | Deployment events |
| `workflow_events` | Unified events for AI analysis |

### Embedding Strategy

- **Dense embeddings**: IBM Slate 125M model (768 dimensions) for semantic search
- **Sparse embeddings**: BM25 for keyword matching
- **Hybrid scoring**: Combined ranking with metadata boosting
- **Recency boosting**: Recent events ranked higher
- **Importance boosting**: Critical issues, production deployments, failures prioritized

---

## Frontend Features

### AI Insights Tab
- Natural language chat interface
- Quick action cards for common queries
- Project context selection
- Markdown-rendered AI responses
- Streaming responses with typing indicators

### Flow Tab
- Interactive branch visualization (ReactFlow)
- Real-time status indicators (critical/warning/success)
- Hover panels with bottleneck analysis
- AI-powered recommendations per branch
- Export to SVG/PDF/PNG

### Connections Tab
- Tool integration mapping
- Visual workflow connections
- Project management (create/edit/delete)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **AI Orchestration** | IBM watsonx Orchestrate |
| **Embeddings** | IBM Slate 125M (768-dim) |
| **Backend** | FastAPI (Python 3.11+) |
| **Frontend** | React 18 + TypeScript + Vite |
| **Visualization** | ReactFlow |
| **Database** | DataStax Astra DB |
| **Styling** | Tailwind CSS |
| **Deployment** | IBM Cloud Code Engine |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- IBM Cloud account (for watsonx Orchestrate)
- Astra DB account (optional, for production pipeline)

### 1. Clone & Setup Backend

```bash
git clone https://github.com/Gagancm/FlowSight.git
cd FlowSight/backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your credentials

# Run the server
uvicorn app.main:app --reload --port 8080
```

### 2. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### 3. Configure watsonx Orchestrate

```bash
# In backend/.env
WATSONX_API_KEY=your-ibm-cloud-api-key
WATSONX_URL=https://api.your-region.watson-orchestrate.cloud.ibm.com
WATSONX_INSTANCE_ID=your-instance-id
WATSONX_AGENT_ID=your-agent-id
STUB_MODE=false  # Set to true for testing without watsonx
```

### 4. Test the API

```bash
# Health check
curl http://localhost:8080/healthz

# Chat endpoint
curl -X POST http://localhost:8080/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is blocking delivery?"}'

# API docs
open http://localhost:8080/docs
```

---

## Project Structure

```
FlowSight/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat.py              # Chat proxy (frontend → watsonx)
│   │   │   └── mock.py              # Mock data endpoints
│   │   ├── core/
│   │   │   └── settings.py          # Configuration
│   │   ├── models/
│   │   │   ├── events.py            # RawEvent, RawEventsPayload
│   │   │   └── graph.py             # Node, Edge, WorkflowGraph
│   │   ├── services/
│   │   │   ├── normalizer.py        # Events → Workflow graph
│   │   │   └── watsonx_client.py    # watsonx Orchestrate client
│   │   ├── pipeline/
│   │   │   ├── extractors/          # GitHub, Jira, Slack, Teams
│   │   │   ├── cleaners/            # Data normalization
│   │   │   ├── core/
│   │   │   │   ├── transformer.py   # Unified event format
│   │   │   │   ├── embedding_strategy.py  # IBM Slate + BM25
│   │   │   │   └── astra_uploader.py      # Astra DB loader
│   │   │   └── cli/                 # Pipeline CLIs
│   │   └── main.py                  # FastAPI app
│   ├── openapi/
│   │   └── mock_tool.yml            # OpenAPI spec for watsonx
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── pages/
│   │   │   ├── AIInsights.tsx       # Chat interface
│   │   │   ├── Flow.tsx             # Branch visualization
│   │   │   └── Connections.tsx      # Tool mapping
│   │   ├── services/                # API clients
│   │   └── App.tsx
│   └── package.json
│
└── README.md
```

---

## Data Schemas

### RawEvent (Input)

```json
{
  "source": "github",
  "type": "pull_request",
  "id": "247",
  "timestamp": "2026-01-28T10:30:00Z",
  "branch": "feature/payments",
  "status": "open",
  "author": "sarah",
  "assignee": null
}
```

### WorkflowGraph (Intermediate)

```json
{
  "nodes": [
    {"id": "PR_247", "type": "pull_request", "status": "open", "created_at": "2026-01-28T10:30:00Z"}
  ],
  "edges": [
    {"from": "COMMIT_abc123", "to": "PR_247", "type": "triggers"}
  ]
}
```

### Bottleneck (Detection Output)

```json
{
  "node_id": "PR_247",
  "bottleneck_type": "PR_REVIEW_DELAY",
  "severity": "critical",
  "duration_hours": 72,
  "reason": "No reviewer assigned, blocking 2 downstream branches"
}
```

### Recommendation (Final Output)

```json
{
  "action": "Assign @emma to review PR #247",
  "confidence": 0.94,
  "rationale": "Emma has capacity and reviewed similar auth PRs",
  "expected_impact": "Reduces wait time by 50%"
}
```

---

## Who Is This For?

| Role | What They Get |
|------|---------------|
| **Engineering Manager** | Real-time blockers + who to ping |
| **Product Manager** | Status without interrupting developers |
| **Developer** | Prioritized action list |
| **VP Engineering** | Health score across all teams |

---

## What We Built in 48 Hours

- 5 AI agents orchestrated by IBM watsonx Orchestrate
- Production-ready ETL pipeline with 4 data source integrations
- React frontend with chat interface and workflow visualization
- FastAPI backend with streaming chat support
- Astra DB integration with hybrid embedding search
- End-to-end working prototype

---

## Team Titan

Built with caffeine and determination at IBM Dev Day "AI Demystified" Hackathon.

---

## License

MIT

