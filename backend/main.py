from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import shutil
import os
import sys
import asyncio
import requests
from sqlalchemy.orm import Session

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

from fastapi import WebSocket, WebSocketDisconnect

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

# Initialize the FastAPI App!
app = FastAPI(title="WatchTower.ai Backend")

# Allow Frontend to communicate with Backend (Avoid CORS errors)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for demo purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  Serve the /data folder so the React Frontend can 
# actually see the images Gemini analyzes! 
# Without this, the frontend will get 404 errors.
app.mount("/data", StaticFiles(directory="data"), name="data")

# Initialize the ML Engine from your teammate's code.
import os
import dotenv

# Load the secret variables from the .env file (exactly like MERN stack's 'dotenv' package!)
dotenv.load_dotenv()

# Securely grab the API Key from the .env file!
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("CRITICAL ERROR: GEMINI_API_KEY is completely missing from your .env file!")

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

# Tracker for background video ingestion
video_processing_status = {"cctv_main": "idle"}


# =====================================================================
# 3. DATA MODELS (Defining what JSON structures we expect)
# =====================================================================
class UserLogin(BaseModel):
    email: str
    password: str

class UserSignup(BaseModel):
    email: str
    password: str
    telegram_handle: str = None

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
# 4. API ENDPOINTS (The core of your Backend job)
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

@app.post("/api/auth/signup")
async def signup(user: UserSignup, db: Session = Depends(get_db)):
    """
    Creates a new user in the Watchtower.ai SQLite Database.
    """
    # Quick mock hash for the hackathon (normally use python-bcrypt)
    fake_hashed_pw = user.password + "_hashed!"
    
    db_user = models.User(
        email=user.email,
        hashed_password=fake_hashed_pw,
        telegram_handle=user.telegram_handle
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"status": "success", "message": f"User '{user.email}' registered successfully!", "id": db_user.id}

@app.post("/api/auth/login")
async def login(user: UserLogin):
    """
    Returns a dummy session token. 
    In the future, this will check passwords and generate a JWT.
    """
    return {"token": "fake_session_token", "user": user.email}


@app.get("/api/media/status")
async def check_processing_status():
    """ Returns the status of the video ingestion. """
    return {"status": video_processing_status.get("cctv_main", "idle")}

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
    background_tasks.add_task(process_video_task, file_path, "cctv_main")
        
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
                                alert_msg = f"🚨 SECURITY ALERT 🚨\n\nRule: '{rule_text}'\n🔎 AI Notes: {new_log.ai_analysis}"
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

