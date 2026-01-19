from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
import os
from email_service import email_service
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def run_async(coro):
    """Helper to run async functions in Flask"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "email-api",
        "ses_configured": email_service.is_configured()
    })

@app.route('/send-verification', methods=['POST'])
def send_verification_email():
    """Send email verification"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get('email')
        verification_link = data.get('verification_link')
        user_name = data.get('user_name')
        
        if not email or not verification_link:
            return jsonify({"error": "Email and verification_link are required"}), 400
        
        # Send email
        result = run_async(email_service.send_verification_email(
            email=email,
            verification_link=verification_link,
            user_name=user_name
        ))
        
        if result["success"]:
            return jsonify({
                "success": True,
                "message": "Verification email sent successfully",
                "message_id": result.get("message_id")
            })
        else:
            return jsonify({
                "success": False,
                "error": result.get("error", "Failed to send email")
            }), 500
            
    except Exception as e:
        logger.error(f"Error in send_verification_email: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/send-password-reset', methods=['POST'])
def send_password_reset_email():
    """Send password reset email"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get('email')
        reset_link = data.get('reset_link')
        user_name = data.get('user_name')
        
        if not email or not reset_link:
            return jsonify({"error": "Email and reset_link are required"}), 400
        
        # Send email
        result = run_async(email_service.send_password_reset_email(
            email=email,
            reset_link=reset_link,
            user_name=user_name
        ))
        
        if result["success"]:
            return jsonify({
                "success": True,
                "message": "Password reset email sent successfully",
                "message_id": result.get("message_id")
            })
        else:
            return jsonify({
                "success": False,
                "error": result.get("error", "Failed to send email")
            }), 500
            
    except Exception as e:
        logger.error(f"Error in send_password_reset_email: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/send-welcome', methods=['POST'])
def send_welcome_email():
    """Send welcome email"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get('email')
        user_name = data.get('user_name')
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        # Send email
        result = run_async(email_service.send_welcome_email(
            email=email,
            user_name=user_name
        ))
        
        if result["success"]:
            return jsonify({
                "success": True,
                "message": "Welcome email sent successfully",
                "message_id": result.get("message_id")
            })
        else:
            return jsonify({
                "success": False,
                "error": result.get("error", "Failed to send email")
            }), 500
            
    except Exception as e:
        logger.error(f"Error in send_welcome_email: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/send-custom', methods=['POST'])
def send_custom_email():
    """Send custom email"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        to_addresses = data.get('to_addresses', [])
        subject = data.get('subject')
        html_body = data.get('html_body')
        text_body = data.get('text_body')
        cc_addresses = data.get('cc_addresses')
        bcc_addresses = data.get('bcc_addresses')
        reply_to = data.get('reply_to')
        
        if not to_addresses or not subject or not html_body:
            return jsonify({"error": "to_addresses, subject, and html_body are required"}), 400
        
        # Ensure to_addresses is a list
        if isinstance(to_addresses, str):
            to_addresses = [to_addresses]
        
        # Send email
        result = run_async(email_service.send_email(
            to_addresses=to_addresses,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            cc_addresses=cc_addresses,
            bcc_addresses=bcc_addresses,
            reply_to=reply_to
        ))
        
        if result["success"]:
            return jsonify({
                "success": True,
                "message": "Email sent successfully",
                "message_id": result.get("message_id")
            })
        else:
            return jsonify({
                "success": False,
                "error": result.get("error", "Failed to send email")
            }), 500
            
    except Exception as e:
        logger.error(f"Error in send_custom_email: {e}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Starting Email API server on port {port}")
    logger.info(f"SES configured: {email_service.is_configured()}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)