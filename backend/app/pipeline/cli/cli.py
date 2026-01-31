#!/usr/bin/env python3
"""CLI tool to run the GitHub data extraction pipeline."""

import argparse
import os
import sys
from pathlib import Path

from app.pipeline.extractors.github_extractor import GitHubExtractor


def main():
    """Run GitHub data extraction pipeline."""
    parser = argparse.ArgumentParser(
        description="Extract GitHub repository data for FlowSight AI"
    )
    parser.add_argument("repo", help="Repository in format 'owner/repo'")
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        help="Output file path (default: data/github_cleaned_<repo_name>.json)",
    )
    parser.add_argument(
        "-t",
        "--token",
        help="GitHub personal access token (or set GITHUB_TOKEN env var)",
    )
    parser.add_argument(
        "--upload-to-astra",
        action="store_true",
        help="Upload data to Astra DB after extraction",
    )
    parser.add_argument(
        "--astra-token",
        help="Astra DB token (or set ASTRA_DB_TOKEN env var)",
    )
    parser.add_argument(
        "--astra-endpoint",
        help="Astra DB API endpoint (or set ASTRA_DB_ENDPOINT env var)",
    )
    parser.add_argument(
        "--generate-embeddings",
        action="store_true",
        help="Generate embeddings using watsonx.ai before upload",
    )

    args = parser.parse_args()

    # Parse owner/repo
    try:
        owner, repo = args.repo.split("/")
    except ValueError:
        print("Error: Repository must be in format 'owner/repo'")
        sys.exit(1)

    # Set default output path if not specified
    if not args.output:
        args.output = f"data/github_cleaned_{repo}.json"

    # Get GitHub token from args or environment
    github_token = args.token or os.getenv("GITHUB_TOKEN")
    if not github_token:
        print(
            "Warning: No GitHub token provided. API rate limits will be restricted."
        )
        print("Set GITHUB_TOKEN environment variable or use --token flag.")
        print()

    # Create extractor and run
    try:
        extractor = GitHubExtractor(github_token=github_token)
        data = extractor.extract_all(owner, repo, output_path=args.output, include_raw_events=True)
        print(f"\n✅ Successfully extracted data from {args.repo}")

        # Generate embeddings if requested
        if args.generate_embeddings:
            print("\n" + "=" * 60)
            print("Generating embeddings with watsonx.ai...")
            print("=" * 60)

            try:
                from app.pipeline.core.embedding_strategy import HybridEmbeddingStrategy

                embedding_strategy = HybridEmbeddingStrategy()
                data = embedding_strategy.embed_github_data(data)

                # Save updated data with embeddings
                import json
                from pathlib import Path
                output_file = Path(args.output)
                with open(output_file, "w") as f:
                    json.dump(data, f, indent=2)

                print("\n✅ Embeddings generated and saved")

            except Exception as e:
                print(f"\n❌ Error generating embeddings: {e}")
                print("Make sure WATSONX_API_KEY and WATSONX_PROJECT_ID are set")
                if not args.upload_to_astra:
                    sys.exit(1)

        # Upload to Astra DB if requested
        if args.upload_to_astra:
            print("\n" + "=" * 60)
            print("Uploading to Astra DB...")
            print("=" * 60)

            try:
                from app.pipeline.core.astra_uploader import AstraDBUploader

                uploader = AstraDBUploader(
                    token=args.astra_token or os.getenv("ASTRA_DB_TOKEN"),
                    api_endpoint=args.astra_endpoint or os.getenv("ASTRA_DB_ENDPOINT"),
                )
                counts = uploader.upload_github_data(data)

                print("\n✅ Successfully uploaded to Astra DB")
                print("\nUpload summary:")
                for collection, count in counts.items():
                    print(f"  • {collection}: {count} documents")

            except ImportError:
                print("\n❌ Error: astrapy not installed")
                print("Install with: pip install astrapy")
                sys.exit(1)
            except Exception as e:
                print(f"\n❌ Error uploading to Astra DB: {e}")
                print(
                    "\nMake sure you have set ASTRA_DB_TOKEN and ASTRA_DB_ENDPOINT"
                )
                sys.exit(1)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
