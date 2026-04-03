import cv2
import torch
import os

# FIX: Allow OpenCV/FFmpeg to connect to local IP cameras using self-signed HTTPS certificates
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "tls_verify;0"
import chromadb
from PIL import Image
import open_clip
from google import genai
import concurrent.futures
import queue
import threading
import uuid

class OfflineVideoPipeline:
    def __init__(self, api_key, collection_name="cctv_main_stream"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        self.model, _, self.preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai')
        self.model = self.model.to(self.device)
        self.tokenizer = open_clip.get_tokenizer('ViT-B-32')
        
        self.chroma_client = chromadb.PersistentClient(path="./data/vector_db")
        self.collection = self.chroma_client.get_or_create_collection(name=collection_name)
        
        self.vlm_client = genai.Client(api_key=api_key, http_options={'api_version': 'v1'})
        self.vlm_model_name = "gemini-1.5-flash" 
        self.io_pool = concurrent.futures.ThreadPoolExecutor(max_workers=8)
        
        # --- NEW: AI INGESTION QUEUE (Fixes Jerkiness!) ---
        # This queue holds frames waiting to be processed by CLIP.
        # It allows the main VideoCapture loop to run at 30 FPS without waiting for the AI.
        self.ai_queue = queue.Queue(maxsize=128)
        self.worker_thread = threading.Thread(target=self._ai_worker, daemon=True)
        self.worker_thread.start()

    def _ai_worker(self):
        """ Background thread that crunches numbers while the video plays smoothly. """
        batch_images, batch_metadatas, batch_ids = [], [], []
        
        while True:
            try:
                task = self.ai_queue.get()
                if task is None: break # Shutdown signal
                
                raw_frame, metadata, source_id, timestamp = task
                
                # --- HEAVY LIFTING: Color conversion and PIL creation moved here! ---
                # This ensures the main VideoCapture loop is as fast as humanly possible.
                rgb_frame = cv2.cvtColor(raw_frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb_frame)
                
                # 1. Save frame to disk (IO)
                frame_path = metadata["frame_path"]
                pil_img.save(frame_path)
                
                # 2. Batch for CLIP (AI)
                batch_images.append(pil_img)
                batch_metadatas.append(metadata)
                
                # UNIQUE ID: Add a uuid suffix to prevent "Duplicated IDs" errors in ChromaDB.
                unique_id = f"{source_id}_{timestamp}_{uuid.uuid4().hex[:6]}"
                batch_ids.append(unique_id)
                
                if len(batch_images) >= 32: # Smaller batch for responsiveness
                    self._store_batch(batch_images, batch_metadatas, batch_ids)
                    batch_images, batch_metadatas, batch_ids = [], [], []
                
                self.ai_queue.task_done()
            except Exception as e:
                print(f"❌ [AI Worker] ERROR: {e}")

    def ingest_video(self, video_path, source_id, fps_to_extract=1, batch_size=64, on_frame=None):
        """Extracts frames, gets embeddings, and saves to VectorDB."""
        os.makedirs(f"./data/frames/{source_id}", exist_ok=True)
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            print(f"❌ [ML Engine] ERROR: Could not open video source: {video_path}")
            return
            
        print(f"✅ [ML Engine] Successfully connected to source: {source_id}")
        fps = round(cap.get(cv2.CAP_PROP_FPS))
        if fps <= 0: fps = 25 # Fallback for streams
        frame_interval = max(1, int(fps / fps_to_extract))
        
        count = 0
        batch_images, batch_metadatas, batch_ids = [], [],[]

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            
            # --- HIGH PRIORITY: Update Live Preview (Smooth MJPEG) ---
            if on_frame:
                on_frame(frame)
            
            # --- LOW PRIORITY: AI Analysis (Through Queue) ---
            if count % frame_interval == 0:
                timestamp = count / fps
                frame_path = f"./data/frames/{source_id}/t_{timestamp:.1f}.jpg"
                metadata = {"source_id": source_id, "timestamp": timestamp, "frame_path": frame_path}
                
                # Push RAW BGR frame to background worker.
                # We use .copy() to ensure the worker doesn't see memory changes.
                try:
                    self.ai_queue.put_nowait((frame.copy(), metadata, source_id, timestamp))
                except queue.Full:
                    pass 
                
            count += 1
        cap.release()

    def _store_batch(self, images, metadatas, ids):
        tensors = torch.stack([self.preprocess(img) for img in images]).to(self.device)
        with torch.no_grad():
            features = self.model.encode_image(tensors)
            features /= features.norm(dim=-1, keepdim=True)
        self.collection.add(embeddings=features.cpu().tolist(), metadatas=metadatas, ids=ids)

    def query(self, text_query, top_k=5):
        """Searches the VectorDB and asks the VLM to verify."""
        text_input = self.tokenizer([text_query]).to(self.device)
        with torch.no_grad():
            features = self.model.encode_text(text_input)
            features /= features.norm(dim=-1, keepdim=True)
            
        results = self.collection.query(query_embeddings=[features.cpu().tolist()[0]], n_results=top_k)
        
        if not results['ids'][0]:
            return {"status": "error", "message": "No matches found."}

        # Filter frames to only include those that actually exist on disk!
        # This prevents the frontend from getting 404s for "Ghost Matches"
        raw_frames = results['metadatas'][0]
        valid_frames = []
        vlm_content =[f"Query: '{text_query}'. Look VERY closely at these CCTV frames, especially for small details and objects. Did it happen? Be concise."]

        for m in raw_frames: 
            if os.path.exists(m['frame_path']):
                valid_frames.append(m)
                vlm_content.append(Image.open(m['frame_path']))
            else:
                print(f"  -> Ignoring stale metadata (file missing): {m['frame_path']}")
        
        # If no frames could be found at all, stop here.
        if not valid_frames:
            return {"status": "error", "message": "No valid image frames found on disk for this query."}
        
        # If no frames could be opened, don't waste an API call
        if len(vlm_content) <= 1:
            return {"status": "error", "message": "No valid image frames found on disk."}

        response = self.vlm_client.models.generate_content(model=self.vlm_model_name, contents=vlm_content)
        
        valid_timestamps = [m['timestamp'] for m in valid_frames]
        return {
            "query": text_query,
            "response": response.text,
            "source_id": valid_frames[0]['source_id'],
            "clip_start": max(0, min(valid_timestamps) - 2.0),
            "clip_end": max(valid_timestamps) + 2.0,
            "frame_path": valid_frames[0]['frame_path'],
            "all_matches": valid_frames
        }
