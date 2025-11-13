from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://neondb_owner:npg_NuEkC2JxrZe0@ep-divine-smoke-a483jqek-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",  # Neon default
)

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Please configure your Neon connection string.")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
