"""Chat proxy endpoint for watsonx Orchestrate."""

import asyncio
import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.settings import settings
from app.services.watsonx_client import watsonx_client, WatsonxClientError

router = APIRouter(tags=["chat"])


# Stub responses for frontend testing
STUB_RESPONSES = {
    "blocking": """**Feature 1 (User Authentication Flow)** is currently blocked by a dependency chain:

### Root Cause
PR #312 "Add OAuth2 provider support" has been waiting on review for **6 hours**. This PR is a dependency for Feature 1's login integration.

### Blocking Chain
```
PR #312 (OAuth2 support) ─── blocks ──→ PR #318 (Login UI) ─── blocks ──→ Feature 1
     └─ Waiting on review                    └─ Cannot merge until #312 lands
```

### Current Status
| Item | Status | Owner | Waiting |
|------|--------|-------|---------|
| PR #312 | Needs review | @marcus | 6h |
| PR #318 | Blocked | @priya | — |
| CI Run #445 | Passed | — | — |

### Recommended Actions
1. **Immediate**: Request review from @sarah or @james on PR #312 — both have context on the auth module
2. **Parallel work**: @priya can address the 2 minor comments on PR #318 while waiting

This should unblock Feature 1 within the next 2-3 hours if review happens promptly.""",

    "reviewer": """**Recommended Reviewer for PR #247**

Based on code ownership and recent activity, **@sarah** is the best choice.

### Why @sarah?
- **Code ownership**: Modified `auth/` directory 12 times in the past month
- **Availability**: Last active 25 minutes ago, currently has 1 pending review
- **Context**: Reviewed the related PR #231 last week

### Alternative Options
| Reviewer | Expertise Match | Current Load | Availability |
|----------|-----------------|--------------|--------------|
| @sarah | High | 1 review | Active |
| @james | Medium | 3 reviews | Active |
| @marcus | Medium | 0 reviews | Away until 3pm |

### PR #247 Summary
- **Title**: "Fix session timeout handling"
- **Files changed**: 4 files in `src/auth/`
- **Lines**: +47, -12
- **CI Status**: Passing

To request review, run:
```
gh pr edit 247 --add-reviewer sarah
```""",

    "open_reviews": """### Open Reviews Summary

You have **4 pull requests** awaiting review across the team:

| PR | Title | Author | Waiting | CI | Priority |
|----|-------|--------|---------|-----|----------|
| #312 | OAuth2 provider support | @marcus | 6h | Passing | **High** |
| #247 | Fix session timeout handling | @priya | 2h | Passing | Medium |
| #298 | Update dependencies | @bot | 1d | Passing | Low |
| #251 | Refactor database queries | @james | 3d | Failing | Medium |

### Attention Required
- **PR #312** is blocking Feature 1 — needs immediate review
- **PR #251** has been open for 3 days with failing CI; @james may need help

### Review Load by Team Member
| Reviewer | Assigned | Completed (7d) |
|----------|----------|----------------|
| @sarah | 1 | 8 |
| @james | 2 | 5 |
| @marcus | 0 | 3 |

Consider redistributing reviews — @sarah has capacity and @james is overloaded.""",

    "bottleneck": """### Bottleneck Analysis

I've analyzed your workflow and identified **2 significant bottlenecks**:

---

**1. Code Review Delay** — High Impact

Reviews are taking an average of **4.2 hours**, with 3 PRs currently waiting. This is causing a cascade effect on dependent work.

| Metric | Current | Target |
|--------|---------|--------|
| Avg review time | 4.2h | < 2h |
| PRs waiting | 3 | 0-1 |
| Blocked features | 1 | 0 |

**Root cause**: Review load is unevenly distributed. @sarah has completed 8 reviews this week while @marcus has completed 3.

---

**2. CI Pipeline Queue** — Medium Impact

The CI pipeline has a **38-minute average wait time** due to resource constraints during peak hours (10am-2pm).

| Time Window | Avg Wait | Jobs/Hour |
|-------------|----------|-----------|
| 10am - 2pm | 38 min | 24 |
| Other hours | 8 min | 9 |

---

### Recommended Actions

1. **Enable review auto-assignment** to balance load across the team
2. **Add a second CI runner** or enable parallel test execution
3. **Set up Slack alerts** for PRs waiting > 2 hours

Implementing these changes could reduce cycle time by approximately 40%.""",

    "workflow": """### Workflow Status Overview

**Current Sprint**: Authentication & Security (ends in 4 days)

| Stage | Items | Status |
|-------|-------|--------|
| Backlog | 3 issues | Ready |
| In Progress | 2 PRs, 1 issue | Active |
| In Review | 4 PRs | Waiting |
| Ready to Merge | 1 PR | CI passing |
| Deployed | 6 items | Complete |

### Active Work Items

**Pull Requests**
- PR #312: OAuth2 provider support — *waiting on review* (6h)
- PR #318: Login UI components — *blocked by #312*
- PR #247: Fix session timeout — *in review*
- PR #298: Update dependencies — *approved, ready to merge*

**Issues**
- ISSUE-445: Session persistence bug — *in progress* (@priya)
- ISSUE-421: Rate limiting — *in progress* (@marcus)

### Pipeline Health
- **CI Success Rate**: 94% (last 7 days)
- **Avg Time to Merge**: 1.4 days
- **Deployment Frequency**: 2.3/day

### Next Actions
1. Merge PR #298 (approved, no conflicts)
2. Review PR #312 to unblock Feature 1
3. Investigate CI failure on PR #251""",

    "default": """### Workflow Analysis

I've reviewed your current development workflow. Here's a summary:

**Active Items**
- 4 open pull requests (1 blocked, 3 in review)
- 2 issues in progress
- 1 PR ready to merge

**Key Observations**

The team is making steady progress, but there's a review bottleneck affecting Feature 1. PR #312 has been waiting for review for 6 hours and is blocking downstream work.

**Metrics** (last 7 days)
| Metric | Value | Trend |
|--------|-------|-------|
| PRs merged | 12 | +20% |
| Avg cycle time | 1.4 days | -0.3d |
| CI success rate | 94% | stable |
| Review turnaround | 4.2h | +1.2h |

**Suggested Focus Areas**
- Review PR #312 to unblock Feature 1
- Address the 3-day-old PR #251 with failing CI
- Consider enabling review auto-assignment to balance workload

What would you like me to look into? I can analyze specific blockers, recommend reviewers, or identify optimization opportunities."""
}


class ConnectionsContext(BaseModel):
    """Connections context imported from a project when user opens AI from Connections page."""

    project_id: str = Field(default="", alias="projectId")
    project_name: str = Field(default="", alias="projectName")
    tools: list[dict] = Field(default_factory=list, description="List of {id, name} for tools")
    edges: list[dict] = Field(
        default_factory=list,
        description="List of {sourceLabel, targetLabel} for connections between tools",
    )
    workflow_graph: dict | None = Field(
        default=None,
        alias="workflowGraph",
        description="Pre-loaded workflow graph so agent can skip ingestion step",
    )

    model_config = {"populate_by_name": True}


def format_connections_context(context: ConnectionsContext | None) -> str:
    """Format connections context for inclusion in the prompt."""
    if not context or (not context.tools and not context.edges):
        return ""
    parts = [f"Project: {context.project_name or 'Untitled'}"]
    if context.tools:
        names = [t.get("name", t.get("id", "")) for t in context.tools if isinstance(t, dict)]
        if names:
            parts.append(f"Tools: {', '.join(names)}")
    if context.edges:
        conns = []
        for e in context.edges:
            if isinstance(e, dict):
                s = e.get("sourceLabel", "")
                t = e.get("targetLabel", "")
                if s and t:
                    conns.append(f"{s} → {t}")
        if conns:
            parts.append("Connections: " + "; ".join(conns))
    return "\n".join(parts)


def _select_stub_response(message_lower: str) -> str:
    """Select the appropriate stub response based on message keywords."""
    # Check for specific query types in order of specificity
    if any(word in message_lower for word in ["who should review", "reviewer", "assign review"]):
        return STUB_RESPONSES["reviewer"]
    elif any(phrase in message_lower for phrase in ["open review", "summarize review", "pending review", "review summary"]):
        return STUB_RESPONSES["open_reviews"]
    elif any(word in message_lower for word in ["block", "blocking", "stuck", "waiting", "why is"]):
        return STUB_RESPONSES["blocking"]
    elif any(word in message_lower for word in ["bottleneck", "slow", "delay", "optimize", "speed up"]):
        return STUB_RESPONSES["bottleneck"]
    elif any(word in message_lower for word in ["workflow", "status", "pipeline", "overview", "sprint"]):
        return STUB_RESPONSES["workflow"]
    else:
        return STUB_RESPONSES["default"]


def get_stub_response(message: str, context: ConnectionsContext | None = None) -> str:
    """Get appropriate stub response based on message content and optional connections context."""
    message_lower = message.lower()

    # If context exists and has tools, add a brief context acknowledgment
    if context and context.tools:
        tool_names = [t.get("name", "") for t in context.tools if isinstance(t, dict) and t.get("name")]
        n_tools = len(tool_names)

        if tool_names and n_tools > 0:
            project_name = context.project_name or "Untitled"
            context_note = f"*Analyzed **{project_name}** project ({n_tools} connected tools)*\n\n"
            return context_note + _select_stub_response(message_lower)

    return _select_stub_response(message_lower)


class ChatRequest(BaseModel):
    """Request to chat with watsonx Orchestrate."""

    message: str = Field(..., description="The user's message to send to the agent")
    conversation_id: str | None = Field(
        default=None,
        description="Optional conversation ID for maintaining context across messages"
    )
    agent_id: str | None = Field(
        default=None,
        description="Optional agent ID override (uses default from settings if not provided)"
    )
    stream: bool = Field(
        default=False,
        description="Whether to stream the response"
    )
    context: ConnectionsContext | None = Field(
        default=None,
        description="Optional connections context (project, tools, edges) so the agent can answer based on that project",
    )


class ChatMessage(BaseModel):
    """A single message in the conversation."""

    role: str
    content: str


class ChatResponse(BaseModel):
    """Response from watsonx Orchestrate."""

    message: ChatMessage
    conversation_id: str | None = None
    raw_response: dict | None = Field(
        default=None,
        description="Full raw response from watsonx (for debugging)"
    )


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with watsonx Orchestrate",
    description="""
    Send a message to watsonx Orchestrate and receive an agent response.

    The agent will:
    1. Understand your intent
    2. Call appropriate tools (like /mock/events or /mock/workflow)
    3. Analyze the data
    4. Return a helpful response

    Example messages:
    - "What's blocking deployment?"
    - "Show me the current workflow status"
    - "Analyze the bottlenecks in our pipeline"
    """,
)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Proxy chat requests to watsonx Orchestrate.

    This endpoint forwards user messages to the configured watsonx Orchestrate
    agent and returns the agent's response.
    """
    if request.stream:
        raise HTTPException(
            status_code=400,
            detail="Use /chat/stream for streaming responses"
        )

    # Stub mode - return mock responses for frontend testing
    if settings.stub_mode:
        import random
        # Add realistic delay (1.5-3 seconds) so it doesn't look instant
        await asyncio.sleep(random.uniform(1.5, 3.0))
        stub_content = get_stub_response(request.message, request.context)
        return ChatResponse(
            message=ChatMessage(role="assistant", content=stub_content),
            conversation_id=request.conversation_id or str(uuid.uuid4()),
        )

    try:
        # Auto-load workflow graph if not provided in context
        workflow_graph = None
        if request.context and request.context.workflow_graph:
            workflow_graph = request.context.workflow_graph
        else:
            # Fetch from mock endpoint to provide context to the agent
            from app.api.mock import get_mock_workflow
            try:
                graph_response = await get_mock_workflow()
                workflow_graph = graph_response.workflow_graph.model_dump() if graph_response.workflow_graph else None
                print(f"[DEBUG] Auto-loaded workflow graph with {len(workflow_graph.get('nodes', []))} nodes")
            except Exception as e:
                print(f"[DEBUG] Could not auto-load workflow graph: {e}")

        response = await watsonx_client.chat(
            message=request.message,
            conversation_id=request.conversation_id,
            agent_id=request.agent_id,
            context={"workflow_graph": workflow_graph} if workflow_graph else None,
        )

        # Parse the response - structure may vary based on watsonx API version
        # Typical OpenAI-compatible response structure
        choices = response.get("choices", [])
        if choices:
            message_data = choices[0].get("message", {})
            message = ChatMessage(
                role=message_data.get("role", "assistant"),
                content=message_data.get("content", ""),
            )
        else:
            # Fallback for different response structures
            message = ChatMessage(
                role="assistant",
                content=response.get("output", response.get("response", str(response))),
            )

        return ChatResponse(
            message=message,
            conversation_id=response.get("conversation_id"),
            raw_response=response if request.agent_id else None,  # Only include raw for debugging
        )

    except WatsonxClientError as e:
        print(f"[ERROR] WatsonxClientError: {e.message}")
        raise HTTPException(
            status_code=e.status_code or 500,
            detail=f"watsonx Orchestrate error: {e.message}"
        )
    except Exception as e:
        import traceback
        print(f"[ERROR] Exception in chat endpoint:")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal error: {str(e)}"
        )


@router.post(
    "/chat/stream",
    summary="Stream chat with watsonx Orchestrate",
    description="Same as /chat but streams the response for real-time display.",
)
async def chat_stream(request: ChatRequest):
    """
    Stream chat responses from watsonx Orchestrate.

    Returns a Server-Sent Events stream of response chunks.
    """
    # Stub mode - simulate streaming with mock responses
    if settings.stub_mode:
        async def generate_stub():
            stub_content = get_stub_response(request.message)
            # Simulate streaming by sending chunks
            words = stub_content.split(" ")
            chunk_size = 3
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i:i + chunk_size])
                yield f'data: {{"content": "{chunk} "}}\n\n'
                await asyncio.sleep(0.05)  # Simulate typing delay
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            generate_stub(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
        )

    async def generate():
        try:
            async for chunk in watsonx_client.chat_stream(
                message=request.message,
                conversation_id=request.conversation_id,
                agent_id=request.agent_id,
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except WatsonxClientError as e:
            yield f"data: {{\"error\": \"{e.message}\"}}\n\n"
        except Exception as e:
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get(
    "/chat/health",
    summary="Check watsonx Orchestrate connectivity",
    description="Verify that the backend can connect to watsonx Orchestrate.",
)
async def chat_health():
    """Check if watsonx Orchestrate is reachable."""
    # Stub mode - always healthy
    if settings.stub_mode:
        return {
            "status": "healthy",
            "mode": "stub",
            "watsonx_connected": False,
            "message": "Running in stub mode - returning mock responses",
        }

    try:
        # Try to get an access token as a connectivity check
        await watsonx_client._get_access_token()
        return {
            "status": "healthy",
            "mode": "live",
            "watsonx_connected": True,
            "agent_id": watsonx_client.agent_id or "not configured",
        }
    except WatsonxClientError as e:
        return {
            "status": "unhealthy",
            "mode": "live",
            "watsonx_connected": False,
            "error": e.message,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "mode": "live",
            "watsonx_connected": False,
            "error": str(e),
        }
