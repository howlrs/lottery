#!/bin/sh
set -e

if [ ! -f ./data/prod.db ]; then
    echo "Initializing database from seed template..."
    cp /opt/seed.db ./data/prod.db
    echo "Database ready."
fi

exec "$@"
