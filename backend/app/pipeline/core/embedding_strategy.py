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

    def extract_metadata(self, event: dict[str, Any]) -> dict[str, Any]:
        """
        Extract rich metadata for filtering and boosting search results.

        Metadata enables:
        - Filtering by type, status, priority, date range
        - Boosting by recency, importance, engagement
        - Faceting by author, labels, source
        """
        metadata = {
            "event_type": event.get("type", "unknown"),
            "source": "github",  # Default, override for other sources
        }

        # Timestamps for recency boosting
        if event.get("timestamp"):
            metadata["timestamp"] = event["timestamp"]
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(event["timestamp"].replace("Z", "+00:00"))
                metadata["year"] = dt.year
                metadata["month"] = dt.month
                metadata["day_of_week"] = dt.strftime("%A")
            except:
                pass

        # Type-specific metadata
        event_type = event.get("type", "")

        if event_type == "commit":
            metadata.update({
                "author": event.get("author"),
                "branch": event.get("branch"),
                "is_merge": "merge" in event.get("message", "").lower(),
                "is_fix": any(word in event.get("message", "").lower()
                             for word in ["fix", "bug", "hotfix"]),
                "is_feature": any(word in event.get("message", "").lower()
                                 for word in ["feat", "feature", "add"]),
            })

        elif event_type == "pull_request":
            metadata.update({
                "author": event.get("author"),
                "state": event.get("state", "open"),
                "is_merged": event.get("state") == "merged",
                "is_draft": event.get("state") == "draft",
                "review_count": len(event.get("reviews", [])),
                "has_reviews": len(event.get("reviews", [])) > 0,
                "files_changed": event.get("files_changed", 0),
                "additions": event.get("additions", 0),
                "deletions": event.get("deletions", 0),
                "size": "small" if event.get("files_changed", 0) <= 3 else
                        "medium" if event.get("files_changed", 0) <= 10 else "large",
                "labels": event.get("labels", []),
                "ci_status": event.get("ci_status", "unknown"),
                "is_blocked": event.get("ci_status") == "failing",
            })

        elif event_type == "workflow_run":
            metadata.update({
                "status": event.get("status"),
                "conclusion": event.get("status"),
                "is_success": event.get("status") == "success",
                "is_failure": event.get("status") in ["failure", "cancelled"],
                "workflow": event.get("workflow"),
                "duration_minutes": event.get("duration_minutes"),
            })

        elif event_type == "deployment":
            metadata.update({
                "environment": event.get("environment"),
                "status": event.get("status"),
                "is_production": event.get("environment") == "production",
                "deployed_by": event.get("deployed_by"),
            })

        # Calculate importance score (0-1)
        importance = self._calculate_importance(event, metadata)
        metadata["importance_score"] = importance

        return metadata

    def _calculate_importance(self, event: dict[str, Any], metadata: dict) -> float:
        """
        Calculate importance score for boosting search results.

        Higher scores = more important events that should rank higher.
        """
        score = 0.5  # Base score

        event_type = event.get("type", "")

        # Type-based importance
        if event_type == "deployment":
            score += 0.3
            if metadata.get("is_production"):
                score += 0.2

        elif event_type == "pull_request":
            score += 0.2
            if metadata.get("is_merged"):
                score += 0.1
            if metadata.get("review_count", 0) > 2:
                score += 0.1
            if "critical" in metadata.get("labels", []):
                score += 0.2

        elif event_type == "workflow_run":
            if metadata.get("is_failure"):
                score += 0.3  # Failures are important to surface

        elif event_type == "commit":
            if metadata.get("is_fix"):
                score += 0.2
            if metadata.get("is_merge"):
                score += 0.1

        # Recency boost (decay over time)
        if event.get("timestamp"):
            try:
                from datetime import datetime, timedelta
                dt = datetime.fromisoformat(event["timestamp"].replace("Z", "+00:00"))
                now = datetime.now(dt.tzinfo)
                days_old = (now - dt).days

                if days_old <= 1:
                    score += 0.2
                elif days_old <= 7:
                    score += 0.1
                elif days_old <= 30:
                    score += 0.05
            except:
                pass

        # Normalize to 0-1
        return min(max(score, 0.0), 1.0)

    def embed_event(self, event: dict[str, Any]) -> dict[str, Any]:
        """
        Embed a single event with both event-level and contextual embeddings.

        Returns event with added embedding fields:
        - event_embedding: Dense embedding of event text only
        - contextual_embedding: Dense embedding with context
        - text_for_bm25: Raw text for BM25 indexing
        - metadata: Rich metadata for filtering and boosting
        """
        texts = self.prepare_event_text(event)

        # Generate dense embeddings
        event_embedding = self.generate_embedding(texts["event_text"])
        contextual_embedding = self.generate_embedding(texts["contextual_text"])

        # Extract metadata
        metadata = self.extract_metadata(event)

        # Add embeddings and metadata to event
        event["event_embedding"] = event_embedding
        event["contextual_embedding"] = contextual_embedding
        event["event_text"] = texts["event_text"]
        event["contextual_text"] = texts["contextual_text"]

        # For BM25: store raw text that will be indexed
        event["text_for_bm25"] = texts["contextual_text"]

        # Add metadata for filtering and boosting
        event["search_metadata"] = metadata

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
    metadata_filters: dict[str, Any] | None = None,
    boost_recent: bool = True,
    boost_importance: bool = True,
):
    """
    Perform hybrid search combining BM25 and vector similarity with metadata filtering and boosting.

    Args:
        astra_collection: Astra DB collection
        query_text: Text query for BM25
        query_embedding: Dense embedding for vector search
        limit: Number of results to return
        alpha: Weight for combining scores (0.0 = pure BM25, 1.0 = pure vector)
        metadata_filters: Optional filters e.g., {"event_type": "pull_request", "state": "open"}
        boost_recent: Whether to boost recent items in ranking
        boost_importance: Whether to boost by importance_score

    Returns:
        Combined results with hybrid scores

    Example filters:
        {"event_type": "pull_request", "state": "open"}
        {"is_production": True}
        {"labels": {"$in": ["critical", "bug"]}}
        {"timestamp": {"$gte": "2025-01-01"}}
    """
    # Build filter query
    filter_query = {}
    if metadata_filters:
        for key, value in metadata_filters.items():
            filter_query[f"search_metadata.{key}"] = value

    # Vector search with metadata filtering
    vector_results = astra_collection.vector_find(
        query_embedding,
        limit=limit * 2,  # Get more results for re-ranking
        filter=filter_query if filter_query else None,
        include_similarity=True,
    )

    # BM25 search (text-based) with metadata filtering
    bm25_query = {"$text": {"$search": query_text}}
    if filter_query:
        bm25_query.update(filter_query)

    bm25_results = astra_collection.find(
        bm25_query,
        limit=limit * 2,
    )

    # Combine and re-rank results
    results_map = {}

    # Add vector results with semantic score
    for i, result in enumerate(vector_results):
        doc_id = result.get("_id")
        semantic_score = result.get("$similarity", 0.0)
        results_map[doc_id] = {
            "document": result,
            "semantic_score": semantic_score,
            "bm25_score": 0.0,
            "rank_vector": i + 1,
            "rank_bm25": float("inf"),
        }

    # Add BM25 results with keyword score
    for i, result in enumerate(bm25_results):
        doc_id = result.get("_id")
        if doc_id in results_map:
            results_map[doc_id]["bm25_score"] = 1.0 / (i + 1)  # Reciprocal rank
            results_map[doc_id]["rank_bm25"] = i + 1
        else:
            results_map[doc_id] = {
                "document": result,
                "semantic_score": 0.0,
                "bm25_score": 1.0 / (i + 1),
                "rank_vector": float("inf"),
                "rank_bm25": i + 1,
            }

    # Calculate hybrid scores with metadata boosting
    for doc_id, data in results_map.items():
        # Base hybrid score (alpha weighted)
        hybrid_score = (alpha * data["semantic_score"] +
                       (1 - alpha) * data["bm25_score"])

        # Apply importance boost
        if boost_importance:
            importance = data["document"].get("search_metadata", {}).get("importance_score", 0.5)
            hybrid_score *= (0.7 + 0.3 * importance)  # Boost by up to 30%

        # Apply recency boost
        if boost_recent:
            timestamp = data["document"].get("search_metadata", {}).get("timestamp")
            if timestamp:
                try:
                    from datetime import datetime
                    dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                    now = datetime.now(dt.tzinfo)
                    days_old = (now - dt).days

                    # Recency boost: 20% for last day, 10% for last week, 5% for last month
                    if days_old <= 1:
                        hybrid_score *= 1.2
                    elif days_old <= 7:
                        hybrid_score *= 1.1
                    elif days_old <= 30:
                        hybrid_score *= 1.05
                except:
                    pass

        data["final_score"] = hybrid_score

    # Sort by final score and return top results
    ranked_results = sorted(
        results_map.values(),
        key=lambda x: x["final_score"],
        reverse=True
    )[:limit]

    return [r["document"] for r in ranked_results]
