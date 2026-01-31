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
        self.base_url = settings.watsonx_url
        self.agent_id = settings.watsonx_agent_id
        self._access_token: str | None = None

    async def _get_access_token(self) -> str:
        """Get IAM access token from API key."""
        if self._access_token:
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
            return self._access_token

    def _build_chat_url(self, agent_id: str | None = None) -> str:
        """Build the Chat Completions API URL."""
        agent = agent_id or self.agent_id
        return f"{self.base_url}/v1/orchestrate/{agent}/chat/completions"

    async def chat(
        self,
        message: str,
        conversation_id: str | None = None,
        agent_id: str | None = None,
    ) -> dict:
        """
        Send a message to watsonx Orchestrate and get a response.

        Args:
            message: The user's message
            conversation_id: Optional conversation ID for context
            agent_id: Optional agent ID override

        Returns:
            The agent's response as a dict
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
        }

        if conversation_id:
            payload["conversation_id"] = conversation_id

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=headers,
                json=payload,
                timeout=60.0,  # Agents may take time to reason
            )

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
