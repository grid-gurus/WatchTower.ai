from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Depends, HTTPException, Cookie, Response, WebSocket, WebSocketDisconnect, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import shutil
import os
import sys
import asyncio
import requests
import threading
import multiprocessing
import cv2 # Global import to avoid scope issues
import time
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
    print("❌ CRITICAL ERROR: GEMINI_API_KEY could not be loaded! Check your .env file in the root.")
else:
    # We only print the first/last characters for security, but enough to know it's there!
    print(f"✅ [Backend] GEMINI_API_KEY loaded successfully. (Starts with: {api_key[:4]}...)")

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
    
    # Fallback: check cookies if header is missing
    if not token:
        # We need to reach into the request objects or just pass the cookie explicitly.
        # For simplicity, let's assume the header is the primary source as per frontend code.
        pass

    if not token:
        raise HTTPException(status_code=401, detail="No valid token provided. Have you logged in?")
    
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

# --- MULTI-PROCESSOR STATE ---
# We use a multiprocessing Manager to share frames across separate OS processes.
# This is the key to YouTube-like smoothness in Python!
if __name__ == "__main__" or "uvicorn" in os.environ.get("SERVER_SOFTWARE", ""):
    try:
        # We only want to start the manager once.
        manager = multiprocessing.Manager()
        latest_frames = manager.dict()
        stream_orientations = manager.dict()
        active_stream_info = manager.dict()
    except Exception as e:
        print(f"⚠️ Manager failed (Expected during reload), using local dict: {e}")
        latest_frames = {}
        stream_orientations = {}
        active_stream_info = {}
else:
    latest_frames = {}
    stream_orientations = {}
    active_stream_info = {}

rule_last_triggered = {} # Cooldown logic (Keep local as it's small)

# --- ZERO-LATENCY SIGNALING ---
new_frame_events = {} 


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
    profile_picture: str = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    telegram_handle: Optional[str] = None
    profile_picture: Optional[str] = None


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
        profile_picture=user.profile_picture,
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
    authorization: Optional[str] = Header(None),
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
        profile_picture=current_user.profile_picture,
        created_at=current_user.created_at,
        is_active=current_user.is_active
    )


@app.put("/api/auth/profile", response_model=UserResponse)
async def update_profile(
    profile_update: UserProfileUpdate,
    authorization: Optional[str] = Header(None),
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
    if profile_update.profile_picture is not None:
        current_user.profile_picture = profile_update.profile_picture
    
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
    
    def frame_update_callback(frame):
        if frame is None: return
        try:
            h, w = frame.shape[:2]
            stream_orientations[source_id] = "portrait" if h > w else "landscape"
            
            # --- DEBUG: Verify frames are reaching the backend ---
            # print(f"Frame received for {source_id}: {w}x{h}") 
            
            _, buffer = cv2.imencode('.jpg', frame)
            latest_frames[source_id] = buffer.tobytes()
            
            # TRIGGER EVENT: Wake up any browser listeners waiting for a new frame!
            if source_id in new_frame_events:
                # We use loop.call_soon_threadsafe because this callback runs in a background thread.
                event = new_frame_events[source_id]
                event.set()
        except Exception as e:
            print(f"FAILED to update frame for {source_id}: {e}")

    print(f"STARTING parallel stream task for {source_id} at {file_path}")
    active_stream_info[source_id] = file_path # Save URL for Telegram alerts
    
    try:
        if ml_engine:
            ml_engine.ingest_video(file_path, source_id, on_frame=frame_update_callback)
        else:
             print(f"CRITICAL: ML Engine missing for {source_id}")
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
    active_streams = req.streams[:3] 
    
    for config in active_streams:
         print(f"🚀 LAUNCHING high-performance Process for {config.source_name}")
         process = multiprocessing.Process(
             target=process_video_task, 
             args=(config.stream_url, config.source_name),
             daemon=True
         )
         process.start()
         
    return {
        "status": "success", 
        "message": f"Successfully tracing {len(active_streams)} camera streams simultaneously in God's Eye mode!"
    }


from fastapi.responses import StreamingResponse

@app.get("/api/media/stream/{source_id}")
async def get_video_stream(source_id: str):
    """
    Returns a multipart/x-mixed-replace MJPEG stream for the frontend viewer.
    Optimized for Zero-Latency using asyncio.Events.
    """
    if source_id not in new_frame_events:
        new_frame_events[source_id] = asyncio.Event()
    
    event = new_frame_events[source_id]

    async def frame_generator():
        while True:
            # Wait for the background thread to signal that a new image is ready!
            await event.wait()
            event.clear()
            
            frame_bytes = latest_frames.get(source_id)
            if frame_bytes:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    return StreamingResponse(frame_generator(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/api/media/orientation/{source_id}")
async def get_stream_orientation(source_id: str):
    """
    Returns 'portrait' or 'landscape' based on the stream's current feed resolution.
    Used by the frontend to dynamically adjust the viewer aspect ratio!
    """
    orientation = stream_orientations.get(source_id, "landscape")
    return {"orientation": orientation}

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
        
    # Trigger the ML processing in a dedicated OS Process.
    # Isolated processes = Max CPU efficiency!
    video_title = os.path.splitext(file.filename)[0]
    
    process = multiprocessing.Process(
        target=process_video_task, 
        args=(file_path, video_title),
        daemon=True
    )
    process.start()
        
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

@app.get("/api/alerts/active")
async def get_active_alerts(db: Session = Depends(get_db)):
    """
    Returns all AI security rules that are currently 'is_active'.
    Used for the Navbar 'Alert Rules' management module.
    """
    active_rules = db.query(models.AlertRuleDB).filter(models.AlertRuleDB.is_active == True).all()
    return {"status": "success", "rules": active_rules}

@app.delete("/api/alerts/{rule_id}")
async def delete_alert_rule(rule_id: int, db: Session = Depends(get_db)):
    """
    Deactivates a specific alert rule by ID.
    The rule remains in history but the AI stops checking for it immediately.
    """
    rule = db.query(models.AlertRuleDB).filter(models.AlertRuleDB.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    
    rule.is_active = False
    db.commit()
    return {"status": "success", "message": "Alert rule deactivated successfully."}

@app.get("/api/alerts/logs")
async def get_alert_logs(db: Session = Depends(get_db)):
    """
    Poll this endpoint to see the permanent history of triggered alerts.
    ORDERED BY ID DESC as a stack so newest alerts appear first!
    """
    logs = db.query(models.TriggeredAlertDB).order_by(models.TriggeredAlertDB.id.desc()).all()
    return {"total_alerts": len(logs), "logs": logs}

@app.delete("/api/alerts/logs/purge")
async def purge_alert_logs(db: Session = Depends(get_db)):
    """
    PERMANENTLY wipes all alert logs from the database.
    Used for the navbar 'Clear' button to prevent ghost notifications.
    """
    try:
        db.query(models.TriggeredAlertDB).delete()
        db.commit()
        return {"status": "success", "message": "All alert logs cleared from database."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to purge logs: {str(e)}")

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
                await asyncio.sleep(30) 
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
                                
                                # ---- NEW: PER-RULE COOL-DOWN (5 MINUTES) ----
                                import time
                                now = time.time()
                                last_fired = rule_last_triggered.get(rule_db.id, 0)
                                if (now - last_fired) < 300: # 300 seconds = 5 minutes
                                    print(f"  -> Skipping repeat alert for '{rule_text}' (Cool-down active: {int(300 - (now - last_fired))}s remaining)")
                                    continue
                                # ---------------------------------------------

                                # Store in SQLite permanently!
                                new_log = models.TriggeredAlertDB(
                                    rule_tested=rule_text,
                                    ai_analysis=result.get("response", "Match found."),
                                    timestamp_seconds=result.get("clip_start", 0)
                                )
                                db.add(new_log)
                                
                                # ---- WOW FACTOR: SEND TELEGRAM ALERT LIVE ----
                                # Context: Use the Source Name (e.g. cam_1) instead of the full URL as requested!
                                cam_name = new_log.video_source_id or "Unknown Camera"
                                alert_msg = f"🚨 SECURITY ALERT 🚨\n\nRule: '{rule_text}'\n🔎 AI Notes: {new_log.ai_analysis}\n📍 Camera: {cam_name.upper()}"
                                send_telegram_alert(alert_msg, result.get("frame_path"))
                                
                                # ---- DB OPTIMIZATION: ONLY KEEP LAST 5 ALERTS ----
                                try:
                                    all_logs = db.query(models.TriggeredAlertDB).order_by(models.TriggeredAlertDB.id.desc()).all()
                                    if len(all_logs) > 5:
                                        for old_log in all_logs[5:]:
                                            db.delete(old_log)
                                        db.commit()
                                except Exception as e:
                                    print(f"Error pruning alert history: {e}")
                                # -------------------------------------------------

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
                                
                                # HACKATHON FIX: REMOVED. 
                                # We now keeping the rules active so they "spectate" continuously!
                                # The user can manually remove them from the Navbar Alerts button.
                                # rule_db.is_active = False
                                # db.commit()
                                
                                # ---- TRACK SUCCESSFUL TRIGGER ----
                                rule_last_triggered[rule_db.id] = time.time()
                                # ---------------------------------
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
                
        # Wait 12 seconds before doing it all again (High-frequency live spectating)
        await asyncio.sleep(12)

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