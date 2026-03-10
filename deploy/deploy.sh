#!/bin/bash
# Deploy lottery app to GCE instance (local build + image transfer)
# Usage: ./deploy/deploy.sh <instance-name> <zone> <subdomain>
# Example: ./deploy/deploy.sh portfolio-vm us-central1-a lottery.example.com
set -e

INSTANCE=${1:?"Usage: $0 <instance-name> <zone> <subdomain>"}
ZONE=${2:?"Usage: $0 <instance-name> <zone> <subdomain>"}
SUBDOMAIN=${3:?"Usage: $0 <instance-name> <zone> <subdomain>"}
PROJECT="anyway-432813"
APP_NAME="lottery"
IMAGE_NAME="lottery-lottery"
IMAGE_FILE="/tmp/${APP_NAME}-image.tar.gz"

echo "=== Deploying $APP_NAME to $INSTANCE ($ZONE) ==="
echo "Subdomain: $SUBDOMAIN"

# Build Docker image locally
echo "=== Building Docker image locally ==="
docker compose build --no-cache

# Export image as compressed tar
echo "=== Exporting image ==="
docker save "$IMAGE_NAME" | gzip > "$IMAGE_FILE"
echo "Image size: $(du -h "$IMAGE_FILE" | cut -f1)"

# Upload image and docker-compose.yml to GCE
echo "=== Uploading to GCE ==="
gcloud compute scp \
    --project=$PROJECT \
    --zone=$ZONE \
    --compress \
    "$IMAGE_FILE" "$INSTANCE:/tmp/${APP_NAME}-image.tar.gz"

gcloud compute scp \
    --project=$PROJECT \
    --zone=$ZONE \
    docker-compose.yml docker-entrypoint.sh "$INSTANCE:/tmp/"

# Deploy on GCE
echo "=== Deploying on instance ==="
gcloud compute ssh "$INSTANCE" \
    --project=$PROJECT \
    --zone=$ZONE \
    --command="
set -e
export DOCKER_API_VERSION=1.41
APP_DIR=/opt/apps/$APP_NAME

sudo mkdir -p \$APP_DIR

# Load Docker image
echo '=== Loading Docker image ==='
gunzip -c /tmp/${APP_NAME}-image.tar.gz | sudo -E docker load

# Update compose and entrypoint files
sudo cp /tmp/docker-compose.yml \$APP_DIR/
sudo cp /tmp/docker-entrypoint.sh \$APP_DIR/

cd \$APP_DIR

# Restart container with new image
echo '=== Restarting container ==='
sudo -E docker compose down 2>/dev/null || true
sudo -E docker compose up -d

# Clean up
rm -f /tmp/${APP_NAME}-image.tar.gz /tmp/docker-compose.yml /tmp/docker-entrypoint.sh
sudo -E docker image prune -f

echo '=== Deployment complete ==='
sudo -E docker compose ps
curl -sf -o /dev/null -w 'HTTP Status: %{http_code}\n' --retry 5 --retry-delay 2 http://localhost:3001
"

# Clean up local temp file
rm -f "$IMAGE_FILE"

echo ""
echo "=== Done! ==="
echo "Your app should be available at: https://$SUBDOMAIN"
