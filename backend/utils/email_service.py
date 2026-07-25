"""
email_service.py — HackOS AI Backend
Utility to send emails using SMTP.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import random
import string
import config

logger = logging.getLogger(__name__)

def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP."""
    return "".join(random.choices(string.digits, k=length))

def send_otp_email(to_email: str, otp: str, role: str) -> bool:
    """Send an OTP via SMTP."""
    if not config.SMTP_USERNAME or not config.SMTP_PASSWORD:
        logger.error("SMTP credentials are not configured in .env.")
        return False
        
    subject = f"Your HackOS {role.title()} Login Code"
    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #6366f1;">HackOS AI Login</h2>
          <p>Hello,</p>
          <p>Your one-time login code for the <strong>{role.title()}</strong> portal is:</p>
          <h1 style="font-size: 36px; letter-spacing: 5px; color: #111827; background: #f3f4f6; padding: 10px 20px; border-radius: 5px; display: inline-block;">
            {otp}
          </h1>
          <p>This code will expire in 5 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #6b7280;">HackOS AI Event Management System</p>
        </div>
      </body>
    </html>
    """
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"HackOS AI <{config.SMTP_USERNAME}>"
    msg["To"] = to_email
    
    msg.attach(MIMEText(body, "html"))
    
    try:
        server = smtplib.SMTP(config.SMTP_SERVER, config.SMTP_PORT)
        server.starttls()
        server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Successfully sent OTP to {to_email}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send email to {to_email}: {exc}")
        return False
