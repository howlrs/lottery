#!/bin/bash
# Deploy lottery app to GCE instance
# Usage: ./deploy/deploy.sh <instance-name> <zone> <subdomain>
# Example: ./deploy/deploy.sh portfolio-vm us-central1-a lottery.example.com
set -e

INSTANCE=${1:?"Usage: $0 <instance-name> <zone> <subdomain>"}
ZONE=${2:?"Usage: $0 <instance-name> <zone> <subdomain>"}
SUBDOMAIN=${3:?"Usage: $0 <instance-name> <zone> <subdomain>"}
PROJECT="anyway-432813"
APP_NAME="lottery"
APP_DIR="/opt/apps/$APP_NAME"

echo "=== Deploying $APP_NAME to $INSTANCE ($ZONE) ==="
echo "Subdomain: $SUBDOMAIN"

# Upload project files to the instance
echo "=== Uploading project files ==="
gcloud compute scp --recurse \
    --project=$PROJECT \
    --zone=$ZONE \
    --compress \
    --exclude=".next|node_modules|.git|prisma/dev.db|prisma/*.db-journal" \
    ./ $INSTANCE:/tmp/$APP_NAME

# Run deployment commands on the instance
echo "=== Running deployment on instance ==="
gcloud compute ssh $INSTANCE \
    --project=$PROJECT \
    --zone=$ZONE \
    --command="
set -e

# Move files to app directory
sudo mkdir -p $APP_DIR
sudo cp -r /tmp/$APP_NAME/* $APP_DIR/
sudo cp -r /tmp/$APP_NAME/.env.example $APP_DIR/.env 2>/dev/null || true
rm -rf /tmp/$APP_NAME

cd $APP_DIR

# Build and start the container
echo '=== Building Docker image ==='
sudo docker compose down 2>/dev/null || true
sudo docker compose build --no-cache
sudo docker compose up -d

# Update Caddyfile with actual subdomain
echo '=== Configuring Caddy ==='
sudo tee /etc/caddy/Caddyfile > /dev/null <<CADDYEOF
$SUBDOMAIN {
    reverse_proxy localhost:3001
}
CADDYEOF

sudo systemctl reload caddy

echo '=== Deployment complete ==='
echo 'Service: https://$SUBDOMAIN'
sudo docker compose ps
"

echo ""
echo "=== Done! ==="
echo "Your app should be available at: https://$SUBDOMAIN"
echo "(DNS must point to your GCE instance's external IP)"
