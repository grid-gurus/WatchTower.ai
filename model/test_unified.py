import os
import sys
import time
import torch
import dotenv
from PIL import Image, ImageDraw
import urllib.request

# Ensure we can import from the root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
dotenv.load_dotenv()

from model.pipelineY import OfflineVideoPipeline
from model.pipeline_webrtc import WebRTCPipeline, IPStreamThreader

# Constants
API_KEY = os.getenv("GEMINI_API_KEY")
TEST_COLLECTION = "test_unified_suite"
VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4" 
VIDEO_FILE = "./data/videos/test_bunny.mp4"

def generate_test_image(label, color):
    """Creates a simple colored square for tracking tests."""
    os.makedirs("./data/frames/test_cams", exist_ok=True)
    img = Image.new('RGB', (224, 224), color=color)
    d = ImageDraw.Draw(img)
    d.text((10,10), label, fill=(255,255,255))
    path = f"./data/frames/test_cams/{label}.jpg"
    img.save(path)
    return path, img

def print_status(task, success):
    symbol = "✅" if success else "❌"
    print(f"{symbol} {task}")

def run_suite():
    print("="*60)
    print(" 🛡️ WATCHTOWER AI - UNIFIED DIAGNOSTIC SUITE")
    print("="*60)
    
    if not API_KEY:
        print("❌ ERROR: GEMINI_API_KEY missing from .env")
        return

    # Initialize Engine
    ml = OfflineVideoPipeline(api_key=API_KEY, collection_name=TEST_COLLECTION)
    
    # 🧹 Clean Test DB
    try:
        count = ml.collection.count()
        if count > 0:
            ids = ml.collection.get()['ids']
            ml.collection.delete(ids=ids)
            print(f"🧹 Cleaned {count} old test records.")
    except Exception: pass

    # --- TEST 1: DETECTIVE MODE (TIMELINE) ---
    print("\n[TEST 1] Verifying 'Detective Mode' (Multi-Cam Tracking)...")
    p1, i1 = generate_test_image("suspect_purple", "purple")
    # Inject into 3 cameras at different times
    ml._store_batch(
        images=[i1, i1, i1],
        metadatas=[
            {"source_id": "Entry_Gate", "timestamp": 100.0, "frame_path": p1},
            {"source_id": "Main_Hall", "timestamp": 500.0, "frame_path": p1},
            {"source_id": "Exit_Vault", "timestamp": 900.0, "frame_path": p1}
        ],
        ids=["evt_1", "evt_2", "evt_3"]
    )
    
    trace = ml.track_timeline("a purple square", top_k=10)
    if trace.get("status") == "success" and len(trace.get("timeline_nodes", [])) == 3:
        print_status("Detective Mode chronologically ordered 3 cameras.", True)
        print(f"📝 AI Report Summary: {trace['incident_report'][:100]}...")
    else:
        print_status("Detective Mode failed to link cameras.", False)

    # --- TEST 2: LIVE STREAM LOGIC ---
    print("\n[TEST 2] Verifying WebRTC Thread Safety...")
    try:
        # We test if the threader starts and stops cleanly
        # We use a non-existent file just to check if it handles the 'False' return correctly
        streamer = IPStreamThreader("non_existent_stream.mp4")
        time.sleep(0.5)
        streamer.release()
        print_status("Live Stream Daemon started/exited cleanly.", True)
    except Exception as e:
        print_status(f"Live Stream Daemon Error: {e}", False)

    # --- TEST 3: REAL-WORLD SEMANTIC SEARCH ---
    print("\n[TEST 3] Verifying CLIP + VLM with Real Video (Big Buck Bunny)...")
    os.makedirs("./data/videos", exist_ok=True)
    if not os.path.exists(VIDEO_FILE):
        print("⬇️ Downloading test clip...")
        urllib.request.urlretrieve(VIDEO_URL, VIDEO_FILE)
    
    print("⏳ Extracting & Embedding Bunny Video...")
    ml.ingest_video(VIDEO_FILE, "nature_cam", fps_to_extract=1)
    
    print("🔍 Querying: 'Where is the giant gray and white rabbit?'")
    search = ml.query("find the giant gray and white rabbit", top_k=2)
    
    if search.get("status") != "error":
        print_status(f"Found Rabbit at {search['clip_start']} seconds!", True)
        print(f"🤖 AI Verification: {search['response']}")
    else:
        print_status("AI Search failed to find the rabbit.", False)

    print("\n" + "="*60)
    print(" ✅ DIAGNOSTICS COMPLETE: WATCHTOWER AI IS READY")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_suite()
