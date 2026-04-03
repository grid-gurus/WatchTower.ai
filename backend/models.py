from sqlalchemy import Column, Integer, String, Boolean
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
