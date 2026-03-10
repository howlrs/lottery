#!/bin/bash
# GCE instance initial setup script
# Run this once on a fresh instance:
#   curl -sSL <raw-url> | sudo bash
set -e

echo "=== Updating system ==="
apt-get update && apt-get upgrade -y

echo "=== Installing Docker ==="
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

echo "=== Installing Docker Compose plugin ==="
if ! docker compose version &>/dev/null; then
    apt-get install -y docker-compose-plugin
fi

echo "=== Installing Caddy ==="
if ! command -v caddy &>/dev/null; then
    apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update
    apt-get install -y caddy
fi

echo "=== Installing git ==="
apt-get install -y git

echo "=== Creating app directory ==="
mkdir -p /opt/apps

echo "=== Setup complete ==="
echo "Next steps:"
echo "  1. Clone your repos into /opt/apps/"
echo "  2. Configure /etc/caddy/Caddyfile"
echo "  3. Run docker compose up -d in each app"
echo "  4. Reload caddy: systemctl reload caddy"
