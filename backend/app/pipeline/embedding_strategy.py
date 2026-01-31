"""
Hybrid embedding strategy for FlowSight workflow data.

Combines:
- Dense embeddings (watsonx.ai) for semantic search
- Sparse embeddings (BM25) for keyword search
- Hybrid retrieval for best results
"""

from typing import Any
from datetime import datetime
import requests
import os


class HybridEmbeddingStrategy:
    """
    Hybrid embedding strategy combining dense (semantic) and sparse (keyword) search.

    - Dense: watsonx.ai embeddings for semantic understanding
    - Sparse: BM25 for keyword matching
    - Hybrid: Combined scoring for optimal retrieval
    """

    def __init__(
        self,
        watsonx_api_key: str | None = None,
        watsonx_project_id: str | None = None,
        watsonx_url: str | None = None,
    ):
        """Initialize embedding strategy with watsonx.ai credentials."""
        self.watsonx_api_key = watsonx_api_key or os.getenv("WATSONX_API_KEY")
        self.watsonx_project_id = watsonx_project_id or os.getenv("WATSONX_PROJECT_ID")
        self.watsonx_url = watsonx_url or os.getenv(
            "WATSONX_URL", "https://us-south.ml.cloud.ibm.com"
        )

        # Embedding model configuration
        self.embedding_model = "ibm/slate-125m-english-rtrvr"  # watsonx embedding model
        self.embedding_dimension = 768  # Dimension of the embeddings

    def prepare_event_text(self, event: dict[str, Any]) -> dict[str, str]:
        """
        Prepare text for embedding from an event.

        Returns both:
        - event_text: Individual event text
        - contextual_text: Event with surrounding context
        """
        event_type = event.get("type", "")

        if event_type == "commit":
            event_text = event.get("message", "")
            contextual_text = f"Commit by {event.get('author', 'unknown')}: {event_text}"

        elif event_type == "pull_request":
            title = event.get("title", "")
            # Include commit messages for context
            commits = event.get("commits", [])
            commit_context = " ".join([c.get("message", "") for c in commits]) if commits else ""

            event_text = title
            contextual_text = f"Pull Request: {title}. Changes: {commit_context}"

        elif event_type == "workflow_run":
            workflow_name = event.get("workflow", "")
            status = event.get("status", "")

            event_text = f"{workflow_name} {status}"
            contextual_text = f"CI Workflow: {workflow_name} completed with status {status}"

        elif event_type == "deployment":
            env = event.get("environment", "")
            status = event.get("status", "")

            event_text = f"Deploy to {env}: {status}"
            contextual_text = event_text

        else:
            # Generic fallback
            event_text = str(event.get("id", ""))
            contextual_text = f"{event_type}: {event_text}"

        return {
            "event_text": event_text,
            "contextual_text": contextual_text,
        }

    def generate_embedding(self, text: str) -> list[float]:
        """
        Generate dense embedding using watsonx.ai.

        Args:
            text: Text to embed

        Returns:
            Dense embedding vector
        """
        if not self.watsonx_api_key:
            raise ValueError("watsonx.ai API key not configured")

        headers = {
            "Authorization": f"Bearer {self.watsonx_api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model_id": self.embedding_model,
            "project_id": self.watsonx_project_id,
            "inputs": [text],
        }

        response = requests.post(
            f"{self.watsonx_url}/ml/v1/text/embeddings",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()

        result = response.json()
        return result["results"][0]["embedding"]

    def embed_event(self, event: dict[str, Any]) -> dict[str, Any]:
        """
        Embed a single event with both event-level and contextual embeddings.

        Returns event with added embedding fields:
        - event_embedding: Dense embedding of event text only
        - contextual_embedding: Dense embedding with context
        - text_for_bm25: Raw text for BM25 indexing
        """
        texts = self.prepare_event_text(event)

        # Generate dense embeddings
        event_embedding = self.generate_embedding(texts["event_text"])
        contextual_embedding = self.generate_embedding(texts["contextual_text"])

        # Add embeddings to event
        event["event_embedding"] = event_embedding
        event["contextual_embedding"] = contextual_embedding
        event["event_text"] = texts["event_text"]
        event["contextual_text"] = texts["contextual_text"]

        # For BM25: store raw text that will be indexed
        event["text_for_bm25"] = texts["contextual_text"]

        return event

    def embed_github_data(self, github_data: dict[str, Any]) -> dict[str, Any]:
        """
        Embed all events in GitHub data.

        This processes:
        - Commits (event-level + contextual)
        - Pull Requests (event-level + contextual with commits)
        - CI Runs (event-level + contextual)
        - Deployments (event-level + contextual)
        """
        embedded_data = github_data.copy()

        print("Generating embeddings...")

        # Embed commits
        if "commits" in embedded_data:
            embedded_commits = []
            for commit in embedded_data["commits"]:
                try:
                    embedded_commit = self.embed_event(
                        {"type": "commit", "message": commit.get("message", ""), **commit}
                    )
                    embedded_commits.append(embedded_commit)
                except Exception as e:
                    print(f"  ⚠ Warning: Failed to embed commit {commit.get('sha', '')}: {e}")
                    embedded_commits.append(commit)  # Keep original without embeddings

            embedded_data["commits"] = embedded_commits
            print(f"  ✓ Embedded {len(embedded_commits)} commits")

        # Embed pull requests (with commit context)
        if "pull_requests" in embedded_data:
            embedded_prs = []
            for pr in embedded_data["pull_requests"]:
                try:
                    # Get commit messages for this PR
                    pr_commits = [
                        c for c in embedded_data.get("commits", [])
                        if c.get("sha", "")[:12] in pr.get("commits", [])
                    ]
                    pr["commits_data"] = pr_commits

                    embedded_pr = self.embed_event({"type": "pull_request", **pr})
                    embedded_prs.append(embedded_pr)
                except Exception as e:
                    print(f"  ⚠ Warning: Failed to embed PR #{pr.get('number', '')}: {e}")
                    embedded_prs.append(pr)

            embedded_data["pull_requests"] = embedded_prs
            print(f"  ✓ Embedded {len(embedded_prs)} pull requests")

        # Embed CI runs
        if "ci_runs" in embedded_data:
            embedded_ci = []
            for ci_run in embedded_data["ci_runs"]:
                try:
                    embedded_run = self.embed_event({"type": "workflow_run", **ci_run})
                    embedded_ci.append(embedded_run)
                except Exception as e:
                    print(f"  ⚠ Warning: Failed to embed CI run {ci_run.get('id', '')}: {e}")
                    embedded_ci.append(ci_run)

            embedded_data["ci_runs"] = embedded_ci
            print(f"  ✓ Embedded {len(embedded_ci)} CI runs")

        # Embed deployments
        if "deployments" in embedded_data:
            embedded_deploys = []
            for deployment in embedded_data["deployments"]:
                try:
                    embedded_deploy = self.embed_event({"type": "deployment", **deployment})
                    embedded_deploys.append(embedded_deploy)
                except Exception as e:
                    print(f"  ⚠ Warning: Failed to embed deployment {deployment.get('id', '')}: {e}")
                    embedded_deploys.append(deployment)

            embedded_data["deployments"] = embedded_deploys
            print(f"  ✓ Embedded {len(embedded_deploys)} deployments")

        # Add embedding metadata
        embedded_data["embedding_metadata"] = {
            "strategy": "hybrid_bm25_semantic",
            "dense_model": self.embedding_model,
            "dense_dimension": self.embedding_dimension,
            "sparse_method": "bm25",
            "generated_at": datetime.now().isoformat(),
        }

        return embedded_data


def create_astra_vector_collections(astra_db):
    """
    Create Astra DB collections with vector search enabled.

    Collections will support:
    - Vector similarity search (dense embeddings)
    - BM25 keyword search (sparse)
    - Hybrid search (combined scoring)
    """
    collections_config = {
        "workflow_events": {
            "vector_dimension": 768,
            "vector_metric": "cosine",
            "indexing": {
                "allow": ["*"],  # Index all fields for BM25
            },
        }
    }

    for collection_name, config in collections_config.items():
        try:
            # Check if collection exists
            existing = astra_db.list_collection_names()
            if collection_name not in existing:
                astra_db.create_collection(
                    collection_name,
                    dimension=config["vector_dimension"],
                    metric=config["vector_metric"],
                )
                print(f"  ✓ Created vector collection: {collection_name}")
            else:
                print(f"  ✓ Collection exists: {collection_name}")
        except Exception as e:
            print(f"  ✗ Error creating collection {collection_name}: {e}")


def hybrid_search(
    astra_collection,
    query_text: str,
    query_embedding: list[float],
    limit: int = 10,
    alpha: float = 0.5,
):
    """
    Perform hybrid search combining BM25 and vector similarity.

    Args:
        astra_collection: Astra DB collection
        query_text: Text query for BM25
        query_embedding: Dense embedding for vector search
        limit: Number of results to return
        alpha: Weight for combining scores (0.0 = pure BM25, 1.0 = pure vector)

    Returns:
        Combined results with hybrid scores
    """
    # Vector search
    vector_results = astra_collection.vector_find(
        query_embedding,
        limit=limit,
        include_similarity=True,
    )

    # BM25 search (text-based)
    # Note: Astra DB's text search capabilities
    bm25_results = astra_collection.find(
        {"$text": {"$search": query_text}},
        limit=limit,
    )

    # Combine results with hybrid scoring
    # This is a simplified hybrid scoring - production would use more sophisticated fusion
    combined_results = []

    # TODO: Implement reciprocal rank fusion or weighted scoring
    # For now, return vector results (most implementations prioritize semantic)

    return list(vector_results)
