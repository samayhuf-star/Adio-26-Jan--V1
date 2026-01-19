#!/bin/bash

# PocketBase Startup Script
# Starts PocketBase server

set -e

POCKETBASE_DIR="pocketbase"
POCKETBASE_BINARY="${POCKETBASE_DIR}/pocketbase"
POCKETBASE_DATA_DIR="${POCKETBASE_DIR}/pb_data"

# Check if PocketBase is installed
if [ ! -f "${POCKETBASE_BINARY}" ]; then
    echo "PocketBase is not installed!"
    echo "Run: ./scripts/install-pocketbase.sh"
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p "${POCKETBASE_DATA_DIR}"

echo "=========================================="
echo "Starting PocketBase Server"
echo "=========================================="
echo ""
echo "PocketBase will be available at:"
echo "  - API: http://127.0.0.1:8090"
echo "  - Admin UI: http://127.0.0.1:8090/_/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start PocketBase
# --http=127.0.0.1:8090 binds to localhost only (more secure)
# Remove --http flag to bind to all interfaces (0.0.0.0:8090)
exec "${POCKETBASE_BINARY}" serve --http=127.0.0.1:8090
