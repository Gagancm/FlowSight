"""Client for IBM watsonx Orchestrate API."""

import httpx
from typing import AsyncGenerator

from app.core.settings import settings


class WatsonxClientError(Exception):
    """Custom exception for watsonx client errors."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class WatsonxClient:
    """Client for interacting with IBM watsonx Orchestrate Chat Completions API."""

    def __init__(self):
        self.api_key = settings.watsonx_api_key
        self.base_url = settings.watsonx_url.rstrip("/")
        self.instance_id = settings.watsonx_instance_id
        self.agent_id = settings.watsonx_agent_id
        self.agent_env_id = settings.watsonx_agent_env_id
        self._access_token: str | None = None
        self._token_expires_at: float = 0

    async def _get_access_token(self) -> str:
        """Get IAM access token from API key.

        IAM tokens are valid for ~60 minutes. We cache the token and refresh
        when it expires.
        """
        import time

        # Check if we have a valid cached token (with 5 min buffer)
        if self._access_token and time.time() < (self._token_expires_at - 300):
            return self._access_token

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://iam.cloud.ibm.com/identity/token",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                    "apikey": self.api_key,
                },
                timeout=30.0,
            )

            if response.status_code != 200:
                raise WatsonxClientError(
                    f"Failed to get IAM token: {response.text}",
                    status_code=response.status_code,
                )

            data = response.json()
            self._access_token = data["access_token"]
            # Token expires in ~3600 seconds, store expiration time
            self._token_expires_at = time.time() + data.get("expires_in", 3600)
            return self._access_token

    def _build_chat_url(self, agent_id: str | None = None) -> str:
        """Build the Chat Completions API URL.

        URL from service credentials: https://api.{region}.watson-orchestrate.cloud.ibm.com/instances/{instance_id}
        """
        agent = agent_id or self.agent_id
        base = self.base_url.rstrip("/")

        # Try: {base}/v1/orchestrate/{agent_id}/chat/completions
        url = f"{base}/v1/orchestrate/{agent}/chat/completions"
        print(f"[DEBUG] watsonx URL: {url}")
        return url

    async def chat(
        self,
        message: str,
        conversation_id: str | None = None,
        agent_id: str | None = None,
        context: dict | None = None,
    ) -> dict:
        """
        Send a message to watsonx Orchestrate and get a response.

        Args:
            message: The user's message
            conversation_id: Optional conversation ID for context
            agent_id: Optional agent ID override
            context: Optional context dict (workflow_graph, etc.) to include

        Returns:
            The agent's response as a dict
        """
        token = await self._get_access_token()
        url = self._build_chat_url(agent_id)

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        # Add thread ID header for conversation context
        if conversation_id:
            headers["X-IBM-THREAD-ID"] = conversation_id

        # Build messages array
        messages = []

        # If context has workflow_graph, include it as context for the agent
        if context and context.get("workflow_graph"):
            import json
            from datetime import datetime

            def json_serial(obj):
                """JSON serializer for objects not serializable by default."""
                if isinstance(obj, datetime):
                    return obj.isoformat()
                raise TypeError(f"Type {type(obj)} not serializable")

            context_content = json.dumps({"workflow_graph": context["workflow_graph"]}, default=json_serial)
            messages.append({
                "role": "user",
                "content": f"Here is the current workflow graph context:\n{context_content}\n\nUser question: {message}"
            })
        else:
            messages.append({"role": "user", "content": message})

        # Chat completions payload format (per IBM docs)
        payload = {
            "stream": False,
            "messages": messages,
        }

        print(f"[DEBUG] Request payload: {payload}")
        print(f"[DEBUG] Auth token (first 20 chars): {token[:20]}...")

        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.post(
                url,
                headers=headers,
                json=payload,
                timeout=60.0,  # Agents may take time to reason
            )

            print(f"[DEBUG] Response status: {response.status_code}")
            print(f"[DEBUG] Response body: {response.text[:500]}")

            if response.status_code == 401:
                # Token expired, clear and retry once
                self._access_token = None
                token = await self._get_access_token()
                headers["Authorization"] = f"Bearer {token}"
                response = await client.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=60.0,
                )

            if response.status_code != 200:
                raise WatsonxClientError(
                    f"Chat request failed: {response.text}",
                    status_code=response.status_code,
                )

            return response.json()

    async def chat_stream(
        self,
        message: str,
        conversation_id: str | None = None,
        agent_id: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Send a message and stream the response.

        Args:
            message: The user's message
            conversation_id: Optional conversation ID for context
            agent_id: Optional agent ID override

        Yields:
            Response chunks as strings
        """
        token = await self._get_access_token()
        url = self._build_chat_url(agent_id)

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        payload = {
            "messages": [
                {"role": "user", "content": message}
            ],
            "stream": True,
        }

        if conversation_id:
            payload["conversation_id"] = conversation_id

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                url,
                headers=headers,
                json=payload,
                timeout=60.0,
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    raise WatsonxClientError(
                        f"Stream request failed: {error_text.decode()}",
                        status_code=response.status_code,
                    )

                async for chunk in response.aiter_text():
                    yield chunk


# Singleton instance
watsonx_client = WatsonxClient()
