# config.py
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Secret key for JWT
SECRET_KEY = "3288d100106f2580231d60ddbe39bee9adb04b3ff2475757b7925490b3a40a8d"

# JWT algorithm
ALGORITHM = "HS256"

# Token expiration in minutes
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password reset token expiration in minutes
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 5

# Email configuration (set via environment variables in .env file or update defaults)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")  # Your email address
# Accept both SMTP_PASSWORD and SMTP_PASS for convenience
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", os.getenv("SMTP_PASS", ""))  # Your email password or app password
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

# Debug: Print email configuration status (without showing password)
if SMTP_USER and SMTP_PASSWORD:
    print(f"✓ Email configured: SMTP_HOST={SMTP_HOST}, SMTP_PORT={SMTP_PORT}, SMTP_USER={SMTP_USER}")
    print(f"  FROM_EMAIL={FROM_EMAIL}, Password={'*' * len(SMTP_PASSWORD)}")
else:
    print("⚠ Email not configured. Check your .env file for SMTP_USER and SMTP_PASS/SMTP_PASSWORD")
