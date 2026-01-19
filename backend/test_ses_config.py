#!/usr/bin/env python3
"""
AWS SES Configuration Test Script for Adiology
This script tests the AWS SES configuration and sends a test email.
"""

import os
import sys
import asyncio
from email_service import email_service

def check_environment():
    """Check if required environment variables are set"""
    required_vars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these variables and try again.")
        return False
    
    print("✅ All required environment variables are set")
    return True

async def test_ses_configuration():
    """Test AWS SES configuration"""
    print("\n🔧 Testing AWS SES Configuration...")
    
    if not email_service.is_configured():
        print("❌ AWS SES is not properly configured")
        return False
    
    print("✅ AWS SES client initialized successfully")
    print(f"   Region: {email_service.aws_region}")
    print(f"   Domain: {email_service.verified_domain}")
    print(f"   From Email: {email_service.from_email}")
    
    return True

async def send_test_email():
    """Send a test email to verify functionality"""
    print("\n📧 Sending test email...")
    
    # Get test email from user input
    test_email = input("Enter your email address to receive a test email: ").strip()
    
    if not test_email or '@' not in test_email:
        print("❌ Invalid email address")
        return False
    
    try:
        # Send test verification email
        result = await email_service.send_verification_email(
            email=test_email,
            verification_link="https://adiology.online/verify?token=test123",
            user_name="Test User"
        )
        
        if result["success"]:
            print(f"✅ Test email sent successfully!")
            print(f"   Message ID: {result.get('message_id')}")
            print(f"   Recipient: {test_email}")
            print("\n📬 Check your inbox (and spam folder) for the test email.")
            return True
        else:
            print(f"❌ Failed to send test email: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error sending test email: {e}")
        return False

async def main():
    """Main test function"""
    print("🚀 Adiology AWS SES Configuration Test")
    print("=" * 50)
    
    # Check environment variables
    if not check_environment():
        sys.exit(1)
    
    # Test SES configuration
    if not await test_ses_configuration():
        sys.exit(1)
    
    # Ask user if they want to send a test email
    send_test = input("\n📧 Do you want to send a test email? (y/n): ").strip().lower()
    
    if send_test in ['y', 'yes']:
        success = await send_test_email()
        if not success:
            sys.exit(1)
    
    print("\n🎉 All tests completed successfully!")
    print("\n📋 Next steps:")
    print("   1. Start the email API server: ./start_email_api.sh")
    print("   2. Test the API endpoints: curl http://localhost:5001/health")
    print("   3. Update your frontend environment variables")
    print("   4. Test user registration and password reset flows")

if __name__ == "__main__":
    asyncio.run(main())