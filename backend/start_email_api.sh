#!/bin/bash

# Email API Startup Script for Adiology
# This script starts the AWS SES email service API

echo "🚀 Starting Adiology Email API Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check for required environment variables
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "⚠️  WARNING: AWS credentials not found in environment variables"
    echo "   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    echo "   The email service will run but emails won't be sent"
fi

# Set default environment variables if not set
export FLASK_ENV=${FLASK_ENV:-production}
export PORT=${PORT:-5001}
export AWS_REGION=${AWS_REGION:-us-east-1}

echo "🌐 Starting Email API on port $PORT..."
echo "📧 Verified domain: adiology.online"
echo "🔧 Environment: $FLASK_ENV"

# Start the Flask application
python email_api.py