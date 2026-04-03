"""
Authentication utilities for JWT tokens, password hashing, and session management
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# =====================================================================
# SECURITY CONFIGURATION
# =====================================================================

# Secret key for JWT (change this to a strong random key in production!)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production-watchtower-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing context with argon2 (no 72-byte limit like bcrypt)
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)

# =====================================================================
# PYDANTIC MODELS FOR AUTH
# =====================================================================

class TokenData(BaseModel):
    """Data stored inside JWT token"""
    user_id: int
    email: str
    exp: datetime = None


class TokenResponse(BaseModel):
    """Response containing access and refresh tokens"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    email: str


class TokenRequest(BaseModel):
    """Request to refresh token"""
    refresh_token: str


class UserResponse(BaseModel):
    """User profile response"""
    id: int
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    telegram_handle: Optional[str] = None
    profile_picture: Optional[str] = None
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# =====================================================================
# PASSWORD HASHING UTILITIES
# =====================================================================

def hash_password(password: str) -> str:
    """
    Hash a password using argon2
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: The hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


# =====================================================================
# JWT TOKEN UTILITIES
# =====================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Data to encode in token
        expires_delta: Optional token expiration time
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Create a JWT refresh token (longer expiration)
    
    Args:
        data: Data to encode in token
        
    Returns:
        Encoded refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_tokens(user_id: int, email: str) -> TokenResponse:
    """
    Create both access and refresh tokens for a user
    
    Args:
        user_id: User's database ID
        email: User's email
        
    Returns:
        TokenResponse with both tokens
    """
    access_token = create_access_token(
        data={"user_id": user_id, "email": email}
    )
    refresh_token = create_refresh_token(
        data={"user_id": user_id, "email": email}
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user_id,
        email=email
    )


def verify_token(token: str) -> dict:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token to verify
        
    Returns:
        Decoded token data
        
    Raises:
        JWTError if token is invalid
    """
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload


def get_user_id_from_token(token: str) -> Optional[int]:
    """
    Extract user ID from JWT token
    
    Args:
        token: JWT token
        
    Returns:
        User ID if valid, None otherwise
    """
    try:
        payload = verify_token(token)
        user_id: int = payload.get("user_id")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None
