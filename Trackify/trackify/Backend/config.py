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

