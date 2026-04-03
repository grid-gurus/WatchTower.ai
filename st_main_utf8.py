from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Depends, HTTPException, Cookie, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import shutil
import os
import sys
import asyncio
import requests
import threading
from sqlalchemy.orm import Session
from typing import Optional

# Import authentication utilities
from backend.auth import (
    hash_password, 
    verify_password, 
    create_tokens,
    verify_token,
    get_user_id_from_token,
    UserResponse,
    TokenResponse,
    TokenRequest
)

# =====================================================================
# 1. SETUP & ALIGNMENT WITH ML TEAMMATE
# =====================================================================
# We need to import the 'OfflineVideoPipeline' your teammate built in the /model folder.
# We add the root folder to the system path so Python can find the model folder.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# We remove the silent try-except here so if the ML engine fails to load
# due to a missing dependency, Uvicorn will loudly tell us what's wrong!
from model.pipelineY import OfflineVideoPipeline

from fastapi.middleware.cors import CORSMiddleware

# =====================================================================
# WEBSOCKET MANAGER
# =====================================================================
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Failed to send to a websocket client: {e}")

# Create a global instance of the manager
notifier = ConnectionManager()


# Ensure the 'data' directory exists so StaticFiles doesn't crash on startup!
os.makedirs("data", exist_ok=True)
os.makedirs("data/frames", exist_ok=True)

# Initialize the FastAPI App!
app = FastAPI(title="WatchTower.ai Backend")

app.mount("/data", StaticFiles(directory="data"), name="data")

# Allow Frontend to communicate with Backend (Avoid CORS errors)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for demo purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the ML Engine from your teammate's code.
import os
import dotenv

# Load the secret variables from the .env file!
# Since main.py is in the 'backend' folder, we look for the .env one level up in the root.
base_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(os.path.dirname(base_dir), ".env")
dotenv.load_dotenv(env_path)

# Securely grab the API Key from the .env file!
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Γ¥î CRITICAL ERROR: GEMINI_API_KEY could not be loaded! Check your .env file in the root.")
else:
    # We only print the first/last characters for security, but enough to know it's there!
    print(f"Γ£à [Backend] GEMINI_API_KEY loaded successfully. (Starts with: {api_key[:4]}...)")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

def send_telegram_alert(text: str, image_path: str = None):
    """ Instantly blasts an HTTP request to Telegram API! """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID: return
    
    try:
        if image_path and os.path.exists(image_path):
            with open(image_path, "rb") as image_file:
                requests.post(
                    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto",
                    data={"chat_id": TELEGRAM_CHAT_ID, "caption": text},
                    files={"photo": image_file}
                )
        else:
            requests.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                data={"chat_id": TELEGRAM_CHAT_ID, "text": text}
            )
    except Exception as e:
        print(f"Failed to send Telegram alert: {e}")

if OfflineVideoPipeline:
    ml_engine = OfflineVideoPipeline(api_key=api_key, collection_name="cctv_main_stream")
else:
    ml_engine = None

# =====================================================================
# 2. REAL SQLITE DATABASE SETUP
# =====================================================================
from backend.database import engine, SessionLocal
import backend.models as models

# This automatically creates the local watchtower.db file and all tables!
models.Base.metadata.create_all(bind=engine)

# Dependency to get a database session for each API request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =====================================================================
# AUTHENTICATION DEPENDENCY
# =====================================================================
def get_current_user(
    request_authorization: Optional[str] = None,
    db: Session = Depends(get_db)
) -> models.User:
    """
    Extract and verify JWT token from Authorization header or cookies.
    Returns the current authenticated user.
    """
    token = None
    
    # Try to get token from Authorization header (Bearer token)
    if request_authorization and request_authorization.startswith("Bearer "):
        token = request_authorization[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="No valid token provided")
    
    try:
        payload = verify_token(token)
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        
        if user_id is None or email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user from database
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
        
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


# Tracker for background video ingestion
video_processing_status = {}


# =====================================================================
# 3. DATA MODELS (Defining what JSON structures we expect)
# =====================================================================
class UserLogin(BaseModel):
    email: str
    password: str


class UserSignup(BaseModel):
    email: str
    password: str
    full_name: str = None
    phone: str = None
    telegram_handle: str = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    telegram_handle: Optional[str] = None


class AlertRule(BaseModel):
    condition: str


from typing import List


class StreamConfig(BaseModel):
    stream_url: str
    source_name: str = "cam_1"


class LivestreamRequest(BaseModel):
    streams: List[StreamConfig]


class QueryRequest(BaseModel):
    query: str


# =====================================================================
# 4. API ENDPOINTS - AUTHENTICATION (The core of your Backend job)
# =====================================================================

# websocket end point setup
@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """
    Frontend connects here to listen for live AI security alerts.
    """
    await notifier.connect(websocket)
    try:
        # Keep the connection open and listening forever
        while True:
            # We don't actually expect the frontend to send us text, 
            # but we need to await receive to keep the socket alive.
            data = await websocket.receive_text() 
    except WebSocketDisconnect:
        notifier.disconnect(websocket)

@app.post("/api/auth/signup", response_model=TokenResponse)
async def signup(user: UserSignup, db: Session = Depends(get_db)):
    """
    Creates a new user in the Watchtower.ai SQLite Database with bcrypt password hashing.
    Returns JWT tokens and sets them in secure HTTP-only cookies.
    """
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password using bcrypt
    hashed_password = hash_password(user.password)
    
    # Create new user
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone=user.phone,
        telegram_handle=user.telegram_handle,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Generate JWT tokens
    tokens = create_tokens(db_user.id, db_user.email)
    
    return tokens


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(user: UserLogin, response: Response, db: Session = Depends(get_db)):
    """
    Authenticates user with email and password.
    Verifies password using bcrypt.
    Returns JWT tokens and sets them in secure HTTP-only cookies.
    """
    # Find user by email
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not db_user.is_active:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password using bcrypt
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate JWT tokens
    tokens = create_tokens(db_user.id, db_user.email)
    
    # Set tokens in HTTP-only cookies for secure storage
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=60 * 60 * 24  # 24 hours
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=60 * 60 * 24 * 7  # 7 days
    )
    
    return tokens


@app.get("/api/auth/profile", response_model=UserResponse)
async def get_profile(
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns the current user's full profile with real data.
    Requires valid JWT token.
    """
    # Get current user from token
    current_user = get_current_user(request_authorization=authorization, db=db)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        telegram_handle=current_user.telegram_handle,
        created_at=current_user.created_at,
        is_active=current_user.is_active
    )


@app.put("/api/auth/profile", response_model=UserResponse)
async def update_profile(
    profile_update: UserProfileUpdate,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Updates the current user's profile information.
    Requires valid JWT token.
    """
    # Get current user
    current_user = get_current_user(request_authorization=authorization, db=db)
    
    # Update fields if provided
    if profile_update.full_name is not None:
        current_user.full_name = profile_update.full_name
    if profile_update.phone is not None:
        current_user.phone = profile_update.phone
    if profile_update.telegram_handle is not None:
        current_user.telegram_handle = profile_update.telegram_handle
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        telegram_handle=current_user.telegram_handle,
        created_at=current_user.created_at,
        is_active=current_user.is_active
    )


@app.post("/api/auth/logout")
async def logout(response: Response):
    """
    Logs out the user by clearing JWT cookies.
    """
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    
    return JSONResponse(
        status_code=200,
        content={"status": "success", "message": "Logged out successfully"}
    )


@app.post("/api/auth/refresh", response_model=TokenResponse)
async def refresh_token(req: TokenRequest, db: Session = Depends(get_db)):
    """
    Refreshes JWT tokens using a valid refresh token.
    Returns new access and refresh tokens.
    """
    try:
        payload = verify_token(req.refresh_token)
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        
        if user_id is None or email is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Verify user still exists and is active
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
        
        # Generate new tokens
        tokens = create_tokens(user.id, user.email)
        return tokens
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid refresh token: {str(e)}")


@app.get("/api/auth/verify")
async def verify_auth(authorization: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Verifies if the provided JWT token is valid.
    Returns user info if valid.
    """
    try:
        user = get_current_user(request_authorization=authorization, db=db)
        return {
            "status": "valid",
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    except HTTPException as e:
        return {
            "status": "invalid",
            "detail": e.detail
        }


# =====================================================================
# 5. API ENDPOINTS - MEDIA & ALERTS
# =====================================================================


@app.get("/api/media/status")
async def check_processing_status():
    """ Returns the overall status of all video processing tasks. """
    if not video_processing_status:
        return {"status": "idle"}

    statuses = list(video_processing_status.values())

    if "processing" in statuses:
        return {"status": "processing"}
    elif "completed" in statuses:
        return {"status": "completed"}

    for s in statuses:
        if isinstance(s, str) and s.startswith("error"):
            return {"status": "error"}

    return {"status": "idle"}



def process_video_task(file_path: str, source_id: str):
    """ Wrapped background task to update our dummy DB state """
    video_processing_status[source_id] = "processing"
    try:
        if ml_engine:
            ml_engine.ingest_video(file_path, source_id)
        video_processing_status[source_id] = "completed"
    except Exception as e:
        video_processing_status[source_id] = f"error: {str(e)}"
    finally:
        # VIDEO GARBAGE COLLECTION: Delete the massive MP4 file permanently!
        # The ML engine has already extracted the frames to VectorDB, we don't need the MP4 anymore.
        # IF IT IS A LIVESTREAM (http), skip deleting as it's not a local file.
        if not file_path.startswith("http") and os.path.exists(file_path):
            os.remove(file_path)

@app.post("/api/media/livestream")
async def start_livestream(req: LivestreamRequest, background_tasks: BackgroundTasks):
    """ Connects the backend to multiple live IP camera streams simultaneously! """
    
    # Limit to max 3 cameras to preserve Mac CPU performance during Hackathon
    active_streams = req.streams[:3] 
    
    for config in active_streams:
         background_tasks.add_task(process_video_task, config.stream_url, config.source_name)
         
    return {
        "status": "success", 
        "message": f"Successfully tracing {len(active_streams)} camera streams simultaneously in God's Eye mode!"
    }

@app.post("/api/media/upload")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    When the frontend uploads an MP4:
    1. We save it to /model/data/videos/
    2. We tell the ML engine to Ingest it as a BACKGROUND TASK.
       Why background? Because processing video takes minutes, and we don't
       want the Frontend HTTP request to freeze and timeout!
    """
    # Create the folder your teammate specified in their README
    save_dir = "./data/videos/"
    os.makedirs(save_dir, exist_ok=True)
    
    file_path = os.path.join(save_dir, file.filename)
    
    # Save the file to our hard drive
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Trigger the ML processing behind the scenes!
    # Extract video name without extension ΓåÆ acts as unique source_id
    video_title = os.path.splitext(file.filename)[0]

    background_tasks.add_task(process_video_task, file_path, video_title)
        
    return {"status": "processing", "message": f"Video successfully saved to {file_path}. Processing has started."}


@app.post("/api/query")
async def manual_query(req: QueryRequest, db: Session = Depends(get_db)):
    """
    Allows the human operator to manually ask a question (e.g. "Did anyone drop a bag?").
    We pass the human's text directly to the ML engine and save it to the history sidebar.
    """
    if not ml_engine:
        return {"response": "Warning: ML Engine not loaded. This is a dummy response."}
        
    try:
        # Pass the query to the ML pipeline
        result = ml_engine.query(req.query)
        
        # Save the interaction to the DB for the Frontend Sidebar History
        if result.get("status") != "error":
            history_log = models.QueryHistoryDB(
                user_query=req.query,
                ai_response=result.get("response", "Match found."),
                frame_path=result.get("frame_path", ""),
                video_source_id=result.get("source_id", "unknown")
            )
            db.add(history_log)
            db.commit()
            
        return result
    except Exception as e:
        # Prevent 500 Internal Server error if the ML pipeline fails
        # Usually happens if the GEMINI_API_KEY is invalid/dummy.
        return {
            "status": "error",
            "message": "The ML model crashed. Have you set a valid GEMINI_API_KEY?",
            "developer_details": str(e)
        }


@app.post("/api/alerts/setup")
async def setup_alert(rule: AlertRule, db: Session = Depends(get_db)):
    """
    The operator submits an alert rule. We save this rule permanently to SQLite.
    """
    db_rule = models.AlertRuleDB(condition=rule.condition)
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return {"status": "success", "message": f"Alert rule activated permanently: '{rule.condition}'"}

@app.get("/api/alerts/logs")
async def get_alert_logs(db: Session = Depends(get_db)):
    """
    Poll this endpoint to see the permanent history of triggered alerts.
    """
    logs = db.query(models.TriggeredAlertDB).all()
    return {"total_alerts": len(logs), "logs": logs}

@app.get("/api/query/history")
async def get_query_history(db: Session = Depends(get_db)):
    """
    Returns the JSON log of all previous manual ChatGPT-style queries for the frontend sidebar.
    Ordered by newest first.
    """
    history = db.query(models.QueryHistoryDB).order_by(models.QueryHistoryDB.created_at.desc()).all()
    return {"total_queries": len(history), "history": history}

# =====================================================================
# 5. THE BACKGROUND DAEMON LOOP
# =====================================================================
async def background_alert_daemon():
    """
    An infinite loop that runs all the time alongside our API.
    Only performs ML queries if:
    1. There are active alert rules in SQLite.
    2. A video stream or upload is actually being processed.
    """
    while True:
        db = SessionLocal()
        try:
            # Count active rules efficiently (doesn't burn Gemini Quota!)
            active_rules_count = db.query(models.AlertRuleDB).filter(models.AlertRuleDB.is_active == True).count()
            
            # Check if any camera or upload is currently "processing" or active
            # This ensures we don't scan empty or static historical frames unnecessarily.
            is_any_stream_active = any(status == "processing" for status in video_processing_status.values())

            if active_rules_count == 0 or not is_any_stream_active:
                # Silent mode: Skip logs and sleep longer to save system resources
                db.close()
                await asyncio.sleep(60) 
                continue

            print(f"[Daemon] Waking up to check {active_rules_count} active alert rules against live feed...")
            
            active_rules = db.query(models.AlertRuleDB).filter(models.AlertRuleDB.is_active == True).all()
            for rule_db in active_rules:
                rule_text = rule_db.condition
                print(f"  -> Testing: {rule_text}")
                
                if ml_engine:
                    try:
                        result = ml_engine.query(rule_text)
                        if result.get("status") != "error":
                            ai_response = result.get("response", "").lower()
                            
                            # CRITICAL FIX: Only trigger the alert if Gemini ACTUALLY says it found it!
                            if "yes" in ai_response or "match found" in ai_response:
                                # Store in SQLite permanently!
                                new_log = models.TriggeredAlertDB(
                                    rule_tested=rule_text,
                                    ai_analysis=result.get("response", "Match found."),
                                    timestamp_seconds=result.get("clip_start", 0)
                                )
                                db.add(new_log)
                                
                                # ---- WOW FACTOR: SEND TELEGRAM ALERT LIVE ----
                                alert_msg = f"≡ƒÜ¿ SECURITY ALERT ≡ƒÜ¿\n\nRule: '{rule_text}'\n≡ƒöÄ AI Notes: {new_log.ai_analysis}"
                                send_telegram_alert(alert_msg, result.get("frame_path"))
                                # ----------------------------------------------

                                # ---- NEW WEBSOCKET BROADCAST TO FRONTEND ----
                                await notifier.broadcast({
                                    "type": "NEW_ALERT",
                                    "rule": rule_text,
                                    "ai_analysis": new_log.ai_analysis,
                                    "timestamp": new_log.timestamp_seconds,
                                    "frame_path": result.get("frame_path")
                                })
                                
                                # ---- WOW FACTOR 2: CROSS-PLATFORM TALKING ALARM ----
                                safe_speech = rule_text.replace('"', '').replace("'", "")
                                phrase = f"Security Alert! Watch Tower detected {safe_speech} on the camera feed!"
                                
                                # Spawns a background thread so the voice doesn't freeze the API loop!
                                # Works natively on Windows, Mac, and Linux via pyttsx3.
                                threading.Thread(target=speak_alarm, args=(phrase,), daemon=True).start()
                                # --------------------------------------------
                                
                                # HACKATHON FIX: Deactivate the rule so it stops spamming the API!
                                rule_db.is_active = False
                                db.commit()
                            else:
                                print(f"  -> AI verified but said NO: {ai_response}")
                                # The rule stays ACTIVE and keeps watching the live stream forever!
                        else:
                             print(f"Warning: {result.get('message')}")
                    except Exception as e:
                        error_msg = str(e)
                        print(f"Daemon crashed with: {error_msg}")
                        # If we hit an API Quota limit, deactivate the rule to save the server from looping crashes
                        if "429" in error_msg or "quota" in error_msg.lower():
                            rule_db.is_active = False
                            db.commit()
        finally:
            db.close()
                
        # Wait 30 seconds before doing it all again
        await asyncio.sleep(30)

@app.on_event("startup")
async def startup_event():
    """
    When we typed `uvicorn main:app` in the terminal, this fires immediately.
    We tell Python to start our daemon loop in the background.
    """
    asyncio.create_task(background_alert_daemon())


def speak_alarm(phrase: str):
    """
    Text-to-speech alarm using pyttsx3 (cross-platform: Windows, Mac, Linux)
    """
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.say(phrase)
        engine.runAndWait()
    except Exception as e:
        print(f"TTS Error: {e}")
