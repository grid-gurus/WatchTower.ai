import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    telegram_handle = Column(String, nullable=True)

class AlertRuleDB(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    condition = Column(String, index=True)
    is_active = Column(Boolean, default=True)

class TriggeredAlertDB(Base):
    __tablename__ = "triggered_alerts"

    id = Column(Integer, primary_key=True, index=True)
    rule_tested = Column(String)
    ai_analysis = Column(String)
    timestamp_seconds = Column(Integer)

class QueryHistoryDB(Base):
    """
    Stores all the historical manual queries and AI responses for the ChatGPT-style sidebar UI.
    """
    __tablename__ = "query_history"
    id = Column(Integer, primary_key=True, index=True)
    user_query = Column(String, nullable=False)
    ai_response = Column(String, nullable=False)
    frame_path = Column(String, nullable=True)
    video_source_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
