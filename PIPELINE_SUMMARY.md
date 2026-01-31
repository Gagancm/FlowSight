# GitHub to Astra DB Data Pipeline - Implementation Summary

## Overview

A complete data pipeline that extracts GitHub repository data and uploads it to IBM Astra DB for watsonx AI analysis.

## What Was Built

### 1. GitHub Data Extractor (`backend/app/pipeline/github_extractor.py`)

**Purpose:** Extract workflow data from any GitHub repository using the GitHub API.

**Extracts:**
- Repository metadata (name, org, URL)
- Commits (SHA, message, author, timestamp, branch)
- Pull Requests (with reviews, labels, CI checks, linked issues)
- CI/CD Runs (GitHub Actions workflow runs)
- Deployments (environment, status, timeline)

**Features:**
- Supports GitHub personal access tokens for higher rate limits
- Automatically calculates review times
- Extracts CI status from checks
- Parses linked issues from PR descriptions
- Matches the exact format in `backend/data/github_data.json`

### 2. Astra DB Uploader (`backend/app/pipeline/astra_uploader.py`)

**Purpose:** Upload extracted GitHub data to Astra DB for IBM watsonx integration.

**Creates Collections:**
- `repositories` - Repository metadata
- `commits` - Individual commits
- `pull_requests` - PRs with full context
- `ci_runs` - CI/CD workflow runs
- `deployments` - Deployment history
- `workflow_events` - **Normalized event stream for AI analysis**

**Key Feature:** The `workflow_events` collection provides a unified format that transforms all GitHub entities (commits, PRs, CI, deployments) into a consistent event structure that AI agents can easily analyze.

### 3. CLI Tool (`backend/app/pipeline/cli.py`)

**Purpose:** Command-line interface to run the pipeline.

**Usage:**
```bash
# Basic extraction
python extract_github_data.py owner/repo

# Extract + upload to Astra DB
python extract_github_data.py owner/repo --upload-to-astra

# Custom output path
python extract_github_data.py owner/repo -o custom_path.json
```

## File Structure

```
backend/
├── app/
│   └── pipeline/
│       ├── __init__.py
│       ├── cli.py                 # CLI interface
│       ├── github_extractor.py    # GitHub API extraction
│       └── astra_uploader.py      # Astra DB upload
├── data/
│   └── github_data.json           # Output file
├── extract_github_data.py         # Simple runner script
├── requirements.txt               # Updated with requests & astrapy
├── .env.example                   # Environment variable template
├── PIPELINE_README.md             # Full documentation
└── QUICKSTART.md                  # Quick start guide
```

## Dependencies Added

```txt
requests>=2.31.0       # For GitHub API calls
astrapy>=1.0.0        # For Astra DB integration
```

## Environment Variables

### Required for GitHub:
- `GITHUB_TOKEN` - Personal access token (scope: `repo`, `read:org`)

### Required for Astra DB:
- `ASTRA_DB_TOKEN` - Application token
- `ASTRA_DB_ENDPOINT` - API endpoint URL
- `ASTRA_DB_KEYSPACE` - Keyspace name (default: `flowsight`)

## Pipeline Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         PIPELINE FLOW                             │
└──────────────────────────────────────────────────────────────────┘

1. INPUT
   └─> GitHub Repository (owner/repo)

2. EXTRACTION (github_extractor.py)
   ├─> Fetch repository info
   ├─> Fetch commits (last 20)
   ├─> Fetch pull requests (with reviews, checks, labels)
   ├─> Fetch CI runs (GitHub Actions)
   └─> Fetch deployments

3. TRANSFORMATION
   ├─> Calculate review times
   ├─> Extract linked issues
   ├─> Determine CI status
   └─> Format to match existing schema

4. OUTPUT (JSON)
   └─> backend/data/github_data.json

5. UPLOAD (astra_uploader.py) - Optional
   ├─> Create Astra DB collections
   ├─> Upload to structured collections
   └─> Create normalized workflow_events

6. RESULT
   └─> Data ready for IBM watsonx AI analysis
```

## Data Format

### Input
GitHub repository identifier: `owner/repo`

### Output
JSON file matching this schema:
```json
{
  "repository": {...},
  "commits": [...],
  "pull_requests": [...],
  "ci_runs": [...],
  "deployments": [...],
  "metadata": {...}
}
```

### Astra DB Collections
6 collections with structured, queryable data ready for AI analysis.

## Usage Examples

### 1. Extract data only
```bash
export GITHUB_TOKEN=ghp_your_token
python extract_github_data.py facebook/react
# Output: backend/data/github_data.json
```

### 2. Extract + Upload to Astra DB
```bash
export GITHUB_TOKEN=ghp_your_token
export ASTRA_DB_TOKEN=AstraCS_your_token
export ASTRA_DB_ENDPOINT=https://your-db.apps.astra.datastax.com

python extract_github_data.py facebook/react --upload-to-astra
```

### 3. Custom output path
```bash
python extract_github_data.py microsoft/vscode -o custom_data.json
```

## Integration with FlowSight AI

### How watsonx AI Uses This Data

1. **Ingestion Agent** reads from Astra DB `workflow_events` collection
2. **Workflow Analysis Agent** builds dependency graphs
3. **Bottleneck Detection Agent** identifies delays (PR review time, CI failures, etc.)
4. **Recommendation Agent** suggests actions based on patterns

### Example Bottlenecks Detected
- PRs waiting >48 hours for review
- CI runs with high failure rates
- Deployments blocked by approvals
- One reviewer as bottleneck

## Testing

### Test with a public repo:
```bash
python extract_github_data.py torvalds/linux
python extract_github_data.py golang/go
python extract_github_data.py rails/rails
```

### Verify output:
```bash
cat backend/data/github_data.json | jq '.metadata'
```

## Error Handling

- **Rate limiting**: Automatically handled, recommends using token
- **Missing data**: Gracefully handles repos without Actions/deployments
- **Invalid repos**: Clear error messages
- **Connection errors**: Descriptive error messages for debugging

## Next Steps

1. ✅ Pipeline extracts GitHub data
2. ✅ Pipeline uploads to Astra DB
3. 🔄 Connect watsonx agents to Astra DB
4. 🔄 Build workflow visualization from events
5. 🔄 Implement bottleneck detection algorithms

## Documentation

- `QUICKSTART.md` - Quick start guide (3 steps)
- `PIPELINE_README.md` - Full documentation
- `.env.example` - Environment variable template

## Success Criteria

✅ Extract data from any GitHub repository
✅ Clean and normalize to FlowSight format
✅ Save to JSON file
✅ Upload to Astra DB
✅ Create normalized events for AI analysis
✅ Support authentication for higher rate limits
✅ Provide clear documentation and examples

---

**Status:** ✅ Complete and ready for integration with IBM watsonx Orchestrate
