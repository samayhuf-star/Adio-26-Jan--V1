import os
import boto3
from botocore.exceptions import ClientError
from typing import Optional, List, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.aws_region = os.getenv('AWS_REGION', 'us-east-1')
        self.verified_domain = 'adiology.online'
        self.from_email = f'noreply@{self.verified_domain}'
        self.from_name = 'Adiology'
        
        # Initialize SES client
        try:
            self.ses_client = boto3.client(
                'ses',
                region_name=self.aws_region,
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
            )
        except Exception as e:
            logger.error(f"Failed to initialize SES client: {e}")
            self.ses_client = None

    def is_configured(self) -> bool:
        """Check if AWS SES is properly configured"""
        return bool(
            os.getenv('AWS_ACCESS_KEY_ID') and 
            os.getenv('AWS_SECRET_ACCESS_KEY') and 
            self.ses_client
        )

    async def send_email(
        self,
        to_addresses: List[str],
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        cc_addresses: Optional[List[str]] = None,
        bcc_addresses: Optional[List[str]] = None,
        reply_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send email using AWS SES"""
        
        if not self.is_configured():
            logger.warning("AWS SES not configured. Email not sent.")
            return {"success": False, "error": "SES not configured"}

        try:
            # Prepare email parameters
            destination = {"ToAddresses": to_addresses}
            if cc_addresses:
                destination["CcAddresses"] = cc_addresses
            if bcc_addresses:
                destination["BccAddresses"] = bcc_addresses

            message = {
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": html_body, "Charset": "UTF-8"}
                }
            }
            
            if text_body:
                message["Body"]["Text"] = {"Data": text_body, "Charset": "UTF-8"}

            params = {
                "Source": f"{self.from_name} <{self.from_email}>",
                "Destination": destination,
                "Message": message
            }
            
            if reply_to:
                params["ReplyToAddresses"] = [reply_to]

            # Send email
            response = self.ses_client.send_email(**params)
            message_id = response.get('MessageId')
            
            logger.info(f"Email sent successfully. MessageId: {message_id}")
            return {
                "success": True,
                "message_id": message_id,
                "to": to_addresses
            }

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"SES ClientError: {error_code} - {error_message}")
            return {
                "success": False,
                "error": f"SES Error: {error_code} - {error_message}"
            }
        except Exception as e:
            logger.error(f"Unexpected error sending email: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }

    def get_verification_email_template(self, user_name: str, verification_link: str) -> Dict[str, str]:
        """Get email verification template"""
        subject = "Verify your Adiology account"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Account</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ text-align: center; padding: 20px 0; border-bottom: 2px solid #6366f1; }}
                .logo {{ font-size: 32px; font-weight: bold; color: #6366f1; }}
                .content {{ padding: 30px 0; }}
                .button {{ display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">ADIOLOGY</div>
                    <p style="margin: 5px 0 0 0; color: #6b7280;">Google Ads Made Easy</p>
                </div>
                
                <div class="content">
                    <h2>Welcome to Adiology, {user_name}!</h2>
                    <p>Thank you for signing up. To complete your registration and start building winning campaigns, please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="{verification_link}" class="button">Verify Email Address</a>
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #6366f1;">{verification_link}</p>
                    
                    <p><strong>This link will expire in 24 hours.</strong></p>
                    
                    <p>If you didn't create an account with Adiology, you can safely ignore this email.</p>
                </div>
                
                <div class="footer">
                    <p>© 2024 Adiology. All rights reserved.</p>
                    <p>This email was sent from a notification-only address. Please don't reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
Welcome to Adiology, {user_name}!

Thank you for signing up. To complete your registration and start building winning campaigns, please verify your email address by visiting this link:

{verification_link}

This link will expire in 24 hours.

If you didn't create an account with Adiology, you can safely ignore this email.

© 2024 Adiology. All rights reserved.
        """

        return {"subject": subject, "html_body": html_body, "text_body": text_body}

    def get_password_reset_template(self, user_name: str, reset_link: str) -> Dict[str, str]:
        """Get password reset email template"""
        subject = "Reset your Adiology password"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ text-align: center; padding: 20px 0; border-bottom: 2px solid #6366f1; }}
                .logo {{ font-size: 32px; font-weight: bold; color: #6366f1; }}
                .content {{ padding: 30px 0; }}
                .button {{ display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }}
                .warning {{ background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">ADIOLOGY</div>
                    <p style="margin: 5px 0 0 0; color: #6b7280;">Google Ads Made Easy</p>
                </div>
                
                <div class="content">
                    <h2>Password Reset Request</h2>
                    <p>Hi {user_name},</p>
                    <p>We received a request to reset your password for your Adiology account. Click the button below to create a new password:</p>
                    
                    <div style="text-align: center;">
                        <a href="{reset_link}" class="button">Reset Password</a>
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #6366f1;">{reset_link}</p>
                    
                    <div class="warning">
                        <p><strong>⚠️ Security Notice:</strong></p>
                        <ul>
                            <li>This link will expire in 1 hour for security reasons</li>
                            <li>If you didn't request this reset, please ignore this email</li>
                            <li>Your password will remain unchanged until you create a new one</li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer">
                    <p>© 2024 Adiology. All rights reserved.</p>
                    <p>This email was sent from a notification-only address. Please don't reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
Password Reset Request

Hi {user_name},

We received a request to reset your password for your Adiology account. Visit this link to create a new password:

{reset_link}

Security Notice:
- This link will expire in 1 hour for security reasons
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged until you create a new one

© 2024 Adiology. All rights reserved.
        """

        return {"subject": subject, "html_body": html_body, "text_body": text_body}

    async def send_verification_email(self, email: str, verification_link: str, user_name: Optional[str] = None) -> Dict[str, Any]:
        """Send email verification"""
        display_name = user_name or email.split('@')[0]
        template = self.get_verification_email_template(display_name, verification_link)
        
        return await self.send_email(
            to_addresses=[email],
            subject=template["subject"],
            html_body=template["html_body"],
            text_body=template["text_body"]
        )

    async def send_password_reset_email(self, email: str, reset_link: str, user_name: Optional[str] = None) -> Dict[str, Any]:
        """Send password reset email"""
        display_name = user_name or email.split('@')[0]
        template = self.get_password_reset_template(display_name, reset_link)
        
        return await self.send_email(
            to_addresses=[email],
            subject=template["subject"],
            html_body=template["html_body"],
            text_body=template["text_body"]
        )

    async def send_welcome_email(self, email: str, user_name: Optional[str] = None) -> Dict[str, Any]:
        """Send welcome email after successful verification"""
        display_name = user_name or email.split('@')[0]
        
        subject = "Welcome to Adiology - Let's build winning campaigns!"
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Adiology</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ text-align: center; padding: 20px 0; border-bottom: 2px solid #6366f1; }}
                .logo {{ font-size: 32px; font-weight: bold; color: #6366f1; }}
                .content {{ padding: 30px 0; }}
                .button {{ display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }}
                .feature {{ background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">ADIOLOGY</div>
                    <p style="margin: 5px 0 0 0; color: #6b7280;">Google Ads Made Easy</p>
                </div>
                
                <div class="content">
                    <h2>🎉 Welcome to Adiology, {display_name}!</h2>
                    <p>Your account is now verified and ready to go. You're about to discover how easy it is to create high-converting Google Ads campaigns.</p>
                    
                    <h3>What you can do with Adiology:</h3>
                    
                    <div class="feature">
                        <h4>🚀 Campaign Builder</h4>
                        <p>Create professional Google Ads campaigns in minutes with our intuitive builder.</p>
                    </div>
                    
                    <div class="feature">
                        <h4>🔍 Keyword Planner</h4>
                        <p>Discover high-performing keywords and optimize your targeting strategy.</p>
                    </div>
                    
                    <div class="feature">
                        <h4>📊 Performance Analytics</h4>
                        <p>Track your campaigns and get insights to improve your ROI.</p>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="https://adiology.online/dashboard" class="button">Start Building Campaigns</a>
                    </div>
                    
                    <p>Need help getting started? Check out our <a href="https://adiology.online/support" style="color: #6366f1;">help center</a> or reach out to our support team.</p>
                </div>
                
                <div class="footer">
                    <p>© 2024 Adiology. All rights reserved.</p>
                    <p>Questions? Contact us at <a href="mailto:support@adiology.online" style="color: #6366f1;">support@adiology.online</a></p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
Welcome to Adiology, {display_name}!

Your account is now verified and ready to go. You're about to discover how easy it is to create high-converting Google Ads campaigns.

What you can do with Adiology:

🚀 Campaign Builder
Create professional Google Ads campaigns in minutes with our intuitive builder.

🔍 Keyword Planner
Discover high-performing keywords and optimize your targeting strategy.

📊 Performance Analytics
Track your campaigns and get insights to improve your ROI.

Get started: https://adiology.online/dashboard

Need help? Visit our help center: https://adiology.online/support

© 2024 Adiology. All rights reserved.
Questions? Contact us at support@adiology.online
        """

        return await self.send_email(
            to_addresses=[email],
            subject=subject,
            html_body=html_body,
            text_body=text_body
        )

# Global email service instance
email_service = EmailService()