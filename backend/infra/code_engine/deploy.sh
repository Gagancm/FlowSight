#!/bin/bash
# Deploy FlowSight Mock Tool to IBM Cloud Code Engine
# Prerequisites: ibmcloud CLI installed and logged in

set -e

# Configuration
APP_NAME="flowsight-mock-tool"
PROJECT_NAME="flowsight"
REGION="us-south"
REGISTRY="us.icr.io"
NAMESPACE="flowsight-ns"
IMAGE_TAG="latest"

echo "=== FlowSight Mock Tool Deployment ==="
echo ""

# Check if ibmcloud CLI is installed
if ! command -v ibmcloud &> /dev/null; then
    echo "Error: ibmcloud CLI is not installed."
    echo "Install it from: https://cloud.ibm.com/docs/cli"
    exit 1
fi

# Navigate to backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$BACKEND_DIR"

echo "1. Building Docker image..."
docker build -t "${REGISTRY}/${NAMESPACE}/${APP_NAME}:${IMAGE_TAG}" -f infra/docker/Dockerfile .

echo ""
echo "2. Pushing image to IBM Container Registry..."
docker push "${REGISTRY}/${NAMESPACE}/${APP_NAME}:${IMAGE_TAG}"

echo ""
echo "3. Deploying to Code Engine..."
ibmcloud ce project select --name "$PROJECT_NAME" 2>/dev/null || \
    ibmcloud ce project create --name "$PROJECT_NAME"

# Deploy or update the application
ibmcloud ce application update --name "$APP_NAME" \
    --image "${REGISTRY}/${NAMESPACE}/${APP_NAME}:${IMAGE_TAG}" \
    --port 8080 \
    --min-scale 0 \
    --max-scale 3 \
    2>/dev/null || \
ibmcloud ce application create --name "$APP_NAME" \
    --image "${REGISTRY}/${NAMESPACE}/${APP_NAME}:${IMAGE_TAG}" \
    --port 8080 \
    --min-scale 0 \
    --max-scale 3

echo ""
echo "4. Getting application URL..."
APP_URL=$(ibmcloud ce application get --name "$APP_NAME" --output json | jq -r '.status.url')

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "App URL: $APP_URL"
echo ""
echo "Endpoints:"
echo "  - Health:   ${APP_URL}/healthz"
echo "  - Events:   ${APP_URL}/api/v1/mock/events"
echo "  - Workflow: ${APP_URL}/api/v1/mock/workflow"
echo "  - Docs:     ${APP_URL}/docs"
echo "  - OpenAPI:  ${APP_URL}/openapi.json"
echo ""
echo "Next steps:"
echo "  1. Update openapi/mock_tool.yml with the App URL"
echo "  2. Import the OpenAPI spec into watsonx Orchestrate"
