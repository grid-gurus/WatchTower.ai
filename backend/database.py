from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# We use SQLite because it's completely self-contained in a single file!
# No need to sign up for AWS, Supabase, or any external websites.
SQLALCHEMY_DATABASE_URL = "sqlite:///./watchtower.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
