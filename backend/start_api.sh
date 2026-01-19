#!/bin/bash
# Start the Python Ad Generator API Server

cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Check if dependencies are installed
python3 -c "import fastapi, uvicorn, pydantic" 2>/dev/null || {
    echo "Installing dependencies..."
    if [ -d "venv" ]; then
        pip install -q fastapi uvicorn pydantic
    else
        echo "Creating virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -q fastapi uvicorn pydantic
    fi
}

# Start the server
echo "Starting Ad Generator API on http://localhost:8000"
python3 ad_generator_api.py

