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
    "blocking": """Based on my analysis of the current workflow, I found **2 blocking issues**:

1. **PR-456 "Add payment integration"** is blocked by failing CI checks
   - The `test-suite-full` run failed 2 hours ago
   - 3 test cases failing in `payment_tests.py`

2. **ISSUE-789 "Database migration needed"** is blocking the deployment pipeline
   - Marked as critical priority
   - Assigned to @backend-team

**Recommendation:** Focus on fixing the failing tests in PR-456 first, as it's on the critical path to deployment.""",

    "workflow": """Here's the current workflow status:

📊 **Pipeline Overview:**
- **5 nodes** in the active workflow
- **3 completed**, **1 in progress**, **1 blocked**

**Active Items:**
| Type | ID | Status | Owner |
|------|-----|--------|-------|
| Commit | abc123 | ✅ Merged | @dev1 |
| PR | PR-456 | 🔄 In Review | @dev2 |
| CI Run | ci-789 | ❌ Failed | - |
| Issue | ISSUE-101 | ✅ Closed | @dev1 |
| Deploy | deploy-1 | ⏸️ Blocked | - |

The deployment is waiting on CI to pass.""",

    "bottleneck": """🔍 **Bottleneck Analysis Complete**

I've identified **2 bottlenecks** in your workflow:

1. **CI Pipeline Bottleneck** (High Severity)
   - Average wait time: **45 minutes**
   - Current queue: 3 jobs pending
   - Impact: Blocking 2 PRs from merging

2. **Code Review Bottleneck** (Medium Severity)
   - Average review time: **4.2 hours**
   - PRs awaiting review: 5
   - Suggested: Add more reviewers to the pool

**Quick Wins:**
- Enable parallel test execution to reduce CI time by ~30%
- Set up auto-assignment for code reviews""",

    "default": """I've analyzed your workflow data. Here's what I found:

📈 **Current Status:**
- Active PRs: 3
- Open Issues: 7
- CI Health: 85% pass rate
- Deployment: Ready (pending approval)

**Recent Activity:**
- Last commit: 2 hours ago by @dev1
- Last successful deploy: Yesterday at 3:45 PM
- Next scheduled: Waiting for CI

Is there anything specific you'd like me to analyze? I can look into:
- Blocking issues
- Bottleneck detection
- Workflow optimization
- Deployment readiness"""
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


def get_stub_response(message: str, context: ConnectionsContext | None = None) -> str:
    """Get appropriate stub response based on message content and optional connections context."""
    message_lower = message.lower()
    
    # If context exists and has tools, customize response based on the actual tools
    if context and context.tools:
        tool_names = [t.get("name", "") for t in context.tools if isinstance(t, dict) and t.get("name")]
        n_tools = len(tool_names)
        n_edges = len(context.edges)
        
        # Create a context-aware response
        if tool_names:
            tools_list = ", ".join(tool_names[:5])  # Show first 5 tools
            if n_tools > 5:
                tools_list += f", and {n_tools - 5} more"
            
            context_intro = (
                f"Based on your **{context.project_name or 'Untitled'}** project "
                f"with {n_tools} tool{'s' if n_tools != 1 else ''} ({tools_list})"
            )
            
            if n_edges > 0:
                # Show sample connections
                sample_conns = []
                for e in context.edges[:3]:  # Show first 3 connections
                    if isinstance(e, dict):
                        s = e.get("sourceLabel", "")
                        t = e.get("targetLabel", "")
                        if s and t:
                            sample_conns.append(f"{s} → {t}")
                if sample_conns:
                    context_intro += f" and {n_edges} connection{'s' if n_edges != 1 else ''} ({'; '.join(sample_conns)})"
                    if n_edges > 3:
                        context_intro += f", +{n_edges - 3} more"
            
            context_intro += ":\n\n"
            
            # Select base response
            if any(word in message_lower for word in ["block", "blocking", "stuck", "waiting"]):
                base = STUB_RESPONSES["blocking"]
            elif any(word in message_lower for word in ["workflow", "status", "pipeline", "overview"]):
                base = STUB_RESPONSES["workflow"]
            elif any(word in message_lower for word in ["bottleneck", "slow", "delay", "optimize"]):
                base = STUB_RESPONSES["bottleneck"]
            else:
                base = STUB_RESPONSES["default"]
            
            return context_intro + base
    
    # No context or empty context - return base response
    if any(word in message_lower for word in ["block", "blocking", "stuck", "waiting"]):
        return STUB_RESPONSES["blocking"]
    elif any(word in message_lower for word in ["workflow", "status", "pipeline", "overview"]):
        return STUB_RESPONSES["workflow"]
    elif any(word in message_lower for word in ["bottleneck", "slow", "delay", "optimize"]):
        return STUB_RESPONSES["bottleneck"]
    else:
        return STUB_RESPONSES["default"]


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
        stub_content = get_stub_response(request.message, request.context)
        return ChatResponse(
            message=ChatMessage(role="assistant", content=stub_content),
            conversation_id=request.conversation_id or str(uuid.uuid4()),
        )

    try:
        response = await watsonx_client.chat(
            message=request.message,
            conversation_id=request.conversation_id,
            agent_id=request.agent_id,
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
