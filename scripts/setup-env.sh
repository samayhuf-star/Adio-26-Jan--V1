#!/bin/bash

# Setup script for LambdaTest environment variables
# This script helps you create a .env file from the .env.example template

set -e

ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

echo "🔧 LambdaTest Environment Setup"
echo "================================"
echo ""

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  Warning: .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Existing .env file preserved."
        exit 0
    fi
fi

# Check if .env.example exists
if [ ! -f "$ENV_EXAMPLE" ]; then
    echo "❌ Error: .env.example file not found!"
    exit 1
fi

# Copy .env.example to .env
cp "$ENV_EXAMPLE" "$ENV_FILE"
echo "✅ Created .env file from .env.example"
echo ""

# Prompt for credentials
echo "Please enter your LambdaTest credentials:"
echo "Get them from: https://automation.lambdatest.com/user-settings/api-token"
echo ""

read -p "LambdaTest Username: " username
read -sp "LambdaTest Access Key: " access_key
echo ""

if [ -z "$username" ] || [ -z "$access_key" ]; then
    echo "⚠️  Warning: Credentials not provided. You'll need to edit .env manually."
    echo "📝 Edit $ENV_FILE and add your credentials."
else
    # Update .env file with provided credentials
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/VITE_LAMBDATEST_USERNAME=your-username-here/VITE_LAMBDATEST_USERNAME=$username/g" "$ENV_FILE"
        sed -i '' "s/VITE_LAMBDATEST_ACCESS_KEY=your-access-key-here/VITE_LAMBDATEST_ACCESS_KEY=$access_key/g" "$ENV_FILE"
        sed -i '' "s/LT_USERNAME=your-username-here/LT_USERNAME=$username/g" "$ENV_FILE"
        sed -i '' "s/LT_ACCESS_KEY=your-access-key-here/LT_ACCESS_KEY=$access_key/g" "$ENV_FILE"
    else
        # Linux
        sed -i "s/VITE_LAMBDATEST_USERNAME=your-username-here/VITE_LAMBDATEST_USERNAME=$username/g" "$ENV_FILE"
        sed -i "s/VITE_LAMBDATEST_ACCESS_KEY=your-access-key-here/VITE_LAMBDATEST_ACCESS_KEY=$access_key/g" "$ENV_FILE"
        sed -i "s/LT_USERNAME=your-username-here/LT_USERNAME=$username/g" "$ENV_FILE"
        sed -i "s/LT_ACCESS_KEY=your-access-key-here/LT_ACCESS_KEY=$access_key/g" "$ENV_FILE"
    fi
    
    echo "✅ Credentials saved to .env file"
fi

echo ""
echo "📋 Next steps:"
echo "1. Review and edit .env file if needed"
echo "2. Restart your dev server if it's running"
echo "3. Run Playwright tests: npx playwright test --config=playwright.lambdatest.config.ts"
echo ""
echo "✨ Setup complete!"

