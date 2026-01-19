#!/bin/bash

# PocketBase Admin Setup Script
# This script helps set up PocketBase admin credentials

echo "=========================================="
echo "PocketBase Admin Setup"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    touch .env
fi

# Check if PocketBase URL is set
if ! grep -q "POCKETBASE_URL" .env; then
    echo ""
    echo "Enter your PocketBase URL (default: http://127.0.0.1:8090):"
    read -r pb_url
    pb_url=${pb_url:-http://127.0.0.1:8090}
    echo "POCKETBASE_URL=$pb_url" >> .env
    echo "VITE_POCKETBASE_URL=$pb_url" >> .env
    echo "✓ PocketBase URL set to: $pb_url"
else
    echo "✓ PocketBase URL already configured"
fi

# Check if admin email is set
if ! grep -q "POCKETBASE_ADMIN_EMAIL" .env; then
    echo ""
    echo "Enter admin email (default: admin@adiology.online):"
    read -r admin_email
    admin_email=${admin_email:-admin@adiology.online}
    echo "POCKETBASE_ADMIN_EMAIL=$admin_email" >> .env
    echo "✓ Admin email set to: $admin_email"
else
    echo "✓ Admin email already configured"
fi

# Check if admin password is set
if ! grep -q "POCKETBASE_ADMIN_PASSWORD" .env; then
    echo ""
    echo "Enter admin password (default: Admin@123!ChangeMe):"
    read -s admin_password
    admin_password=${admin_password:-Admin@123!ChangeMe}
    echo "POCKETBASE_ADMIN_PASSWORD=$admin_password" >> .env
    echo "✓ Admin password set"
    echo ""
    echo "⚠️  IMPORTANT: Change the default password after first login!"
else
    echo "✓ Admin password already configured"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Make sure PocketBase is running"
echo "2. If this is the first time, access PocketBase directly to create the first admin:"
echo "   - Local: http://127.0.0.1:8090/_/"
echo "   - Use the email and password you just set"
echo "3. Access the admin panel at: http://localhost:5000/admin"
echo "4. Change the default password immediately!"
echo ""
echo "For production, update POCKETBASE_URL to your production instance."
echo ""
