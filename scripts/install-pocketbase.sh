#!/bin/bash

# PocketBase Installation Script
# Downloads and sets up PocketBase for macOS/Linux

set -e

echo "=========================================="
echo "PocketBase Installation"
echo "=========================================="
echo ""

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

case "${OS}" in
    Linux*)     OS_TYPE="linux" ;;
    Darwin*)    OS_TYPE="darwin" ;;
    *)          echo "Unsupported OS: ${OS}"; exit 1 ;;
esac

case "${ARCH}" in
    x86_64)     ARCH_TYPE="amd64" ;;
    arm64|aarch64) ARCH_TYPE="arm64" ;;
    *)          echo "Unsupported architecture: ${ARCH}"; exit 1 ;;
esac

POCKETBASE_VERSION="0.22.24"
POCKETBASE_DIR="pocketbase"
POCKETBASE_BINARY="${POCKETBASE_DIR}/pocketbase"

# Create pocketbase directory if it doesn't exist
mkdir -p "${POCKETBASE_DIR}"

# Check if already installed
if [ -f "${POCKETBASE_BINARY}" ]; then
    echo "PocketBase is already installed at ${POCKETBASE_BINARY}"
    echo "Current version:"
    ./${POCKETBASE_BINARY} --version || echo "Could not get version"
    echo ""
    read -p "Do you want to reinstall? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    rm -f "${POCKETBASE_BINARY}"
fi

# Download PocketBase
echo "Downloading PocketBase ${POCKETBASE_VERSION} for ${OS_TYPE}/${ARCH_TYPE}..."
DOWNLOAD_URL="https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_${OS_TYPE}_${ARCH_TYPE}.zip"

cd "${POCKETBASE_DIR}"

if command -v curl &> /dev/null; then
    curl -L -o pocketbase.zip "${DOWNLOAD_URL}"
elif command -v wget &> /dev/null; then
    wget -O pocketbase.zip "${DOWNLOAD_URL}"
else
    echo "Error: Neither curl nor wget is installed"
    exit 1
fi

# Extract
echo "Extracting..."
if command -v unzip &> /dev/null; then
    unzip -o pocketbase.zip
    rm pocketbase.zip
else
    echo "Error: unzip is not installed"
    exit 1
fi

# Make executable
chmod +x pocketbase

cd ..

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "PocketBase binary installed at: $(pwd)/${POCKETBASE_BINARY}"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/start-pocketbase.sh"
echo "2. Or manually: ./pocketbase/pocketbase serve"
echo ""
echo "PocketBase will be available at: http://127.0.0.1:8090"
echo "Admin UI will be at: http://127.0.0.1:8090/_/"
echo ""
