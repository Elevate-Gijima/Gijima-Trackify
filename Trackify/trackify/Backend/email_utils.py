# email_utils.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL


def send_password_reset_email(email: str, reset_token: str, reset_url: str = None) -> bool:
    """
    Send password reset email with reset token.
    
    Args:
        email: Recipient email address
        reset_token: JWT token for password reset
        reset_url: Optional frontend URL for password reset page
        
    Returns:
        True if email sent successfully, False otherwise
    """
    # Debug: Print what we're reading from config
    print(f"\n[EMAIL DEBUG] SMTP_USER: '{SMTP_USER}' (length: {len(SMTP_USER) if SMTP_USER else 0})")
    print(f"[EMAIL DEBUG] SMTP_PASSWORD: {'*' * len(SMTP_PASSWORD) if SMTP_PASSWORD else 'EMPTY'} (length: {len(SMTP_PASSWORD) if SMTP_PASSWORD else 0})")
    print(f"[EMAIL DEBUG] SMTP_HOST: {SMTP_HOST}")
    print(f"[EMAIL DEBUG] SMTP_PORT: {SMTP_PORT}")
    print(f"[EMAIL DEBUG] FROM_EMAIL: {FROM_EMAIL}\n")
    
    # Check if email is configured
    if not SMTP_USER or not SMTP_PASSWORD or SMTP_USER.strip() == "" or SMTP_PASSWORD.strip() == "":
        # If email not configured, print to console (for development)
        print("=" * 80)
        print("EMAIL NOT CONFIGURED - Password reset token:")
        print(f"Email: {email}")
        print(f"Token: {reset_token}")
        if reset_url:
            print(f"Reset URL: {reset_url}")
        else:
            print(f"Reset URL: http://localhost:3000/reset-password?token={reset_token}")
        print("=" * 80)
        print("To enable email sending, set these environment variables:")
        print("  - SMTP_USER (your email address)")
        print("  - SMTP_PASSWORD (your email password or app password)")
        print("  - SMTP_HOST (default: smtp.gmail.com)")
        print("  - SMTP_PORT (default: 587)")
        print("  - FROM_EMAIL (defaults to SMTP_USER)")
        print("=" * 80)
        return True  # Return True in dev mode to allow testing
    
    try:
        print(f"Attempting to send password reset email to {email}...")
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = email
        msg['Subject'] = "Password Reset Request - Trackify"
        
        # Default reset URL if not provided
        if not reset_url:
            reset_url = f"http://localhost:3000/reset-password?token={reset_token}"
        
        # Email body
        body = f"""Hello,

You have requested to reset your password for your Trackify account.

Please use the following token to reset your password:

Token: {reset_token}

Or click this link: {reset_url}

This token is valid for 5 minutes only.

If you did not request this password reset, please ignore this email.

Best regards,
Trackify Team"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Try sending email - use SSL for port 465, TLS for port 587
        text = msg.as_string()
        
        # If port is 465, use SSL connection, otherwise use TLS
        if SMTP_PORT == 465:
            print(f"Connecting to SMTP server via SSL: {SMTP_HOST}:{SMTP_PORT}")
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30)
            print(f"Logging in with user: {SMTP_USER}")
            server.login(SMTP_USER, SMTP_PASSWORD)
            print(f"Sending email from {FROM_EMAIL} to {email}")
            server.sendmail(FROM_EMAIL, email, text)
            server.quit()
        else:
            # Try TLS connection on port 587
            print(f"Connecting to SMTP server: {SMTP_HOST}:{SMTP_PORT}")
            try:
                server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
                print("Starting TLS...")
                server.starttls()
                print(f"Logging in with user: {SMTP_USER}")
                server.login(SMTP_USER, SMTP_PASSWORD)
                print(f"Sending email from {FROM_EMAIL} to {email}")
                server.sendmail(FROM_EMAIL, email, text)
                server.quit()
            except (TimeoutError, OSError, ConnectionError) as conn_err:
                # If TLS fails, try SSL on port 465 as fallback
                print(f"TLS connection failed: {str(conn_err)}")
                print("Attempting SSL connection on port 465 as fallback...")
                try:
                    server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30)
                    print(f"SSL connected. Logging in with user: {SMTP_USER}")
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    print(f"Sending email from {FROM_EMAIL} to {email}")
                    server.sendmail(FROM_EMAIL, email, text)
                    server.quit()
                except Exception as ssl_err:
                    print(f"SSL fallback also failed: {str(ssl_err)}")
                    raise conn_err  # Raise original error
        
        print(f"Password reset email sent successfully to {email}")
        return True
    except (TimeoutError, OSError, ConnectionError) as e:
        print(f"Network Connection Error: {type(e).__name__}: {str(e)}")
        print("\nPossible solutions:")
        print("1. Check if your firewall is blocking port 587 or 465")
        print("2. Try changing SMTP_PORT to 465 in your .env file (uses SSL)")
        print("3. Check if your network/ISP allows SMTP connections")
        print("4. Try from a different network (e.g., mobile hotspot)")
        print("\nTo use SSL on port 465, update your .env file:")
        print("   SMTP_PORT=465")
        return False
    except smtplib.SMTPAuthenticationError as e:
        print(f"SMTP Authentication Error: {str(e)}")
        print("Check your SMTP_USER and SMTP_PASSWORD. For Gmail, use an App Password.")
        print("Make sure 'Less secure app access' is enabled or you're using an App Password.")
        return False
    except smtplib.SMTPException as e:
        print(f"SMTP Error: {str(e)}")
        return False
    except Exception as e:
        print(f"Error sending email: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

