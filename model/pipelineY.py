import cv2
import torch
import os
import shutil

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
        self.vlm_model_name = "gemini-1.5-pro-latest" 
        self.io_pool = concurrent.futures.ThreadPoolExecutor(max_workers=8)
        
        self.ai_queue = queue.Queue(maxsize=128)
        self.worker_thread = threading.Thread(target=self._ai_worker, daemon=True)
        self.worker_thread.start()

    def _ai_worker(self):
        """ Background thread that crunches numbers cleanly separating streams and uploaded videos. """
        batches = {} # Use dicts to isolate frames by collection_name

        while True:
            try:
                task = self.ai_queue.get()
                if task is None: break 

                # --- FLUSH SIGNAL HANDLING ---
                if isinstance(task, tuple) and len(task) >= 4 and task[0] == "FLUSH":
                    source_id = task[1]
                    collection_name = task[2]

                    if collection_name in batches and batches[collection_name]["images"]:
                        b = batches[collection_name]
                        print(f"✅ [AI Worker] Flushing final batch ({len(b['images'])} frames) for {source_id} in {collection_name}")
                        self._store_batch(b["images"], b["metadatas"], b["ids"], collection_name)
                        # Reset
                        batches[collection_name] = {"images": [], "metadatas": [], "ids": []}
                    continue

                pil_img, metadata, source_id, timestamp, collection_name = task

                # Initialize batch dictionary if missing for this specific context
                if collection_name not in batches:
                    batches[collection_name] = {"images": [], "metadatas": [], "ids": []}

                b = batches[collection_name]
                b["images"].append(pil_img)
                b["metadatas"].append(metadata)
                b["ids"].append(f"{source_id}_{timestamp:.2f}")

                if len(b["images"]) >= 32: 
                    self._store_batch(b["images"], b["metadatas"], b["ids"], collection_name)
                    batches[collection_name] = {"images": [], "metadatas": [], "ids": []}

            except Exception as e:
                print(f"❌ [AI Worker] ERROR: {e}")
            finally:
                self.ai_queue.task_done()
    def ingest_video(self, video_path, source_id, collection_name="cctv_main_stream", fps_to_extract=1, batch_size=64, on_frame=None):
        """Extracts frames, gets embeddings, and saves to VectorDB."""
        frames_dir = f"./data/frames/{source_id}"
        if os.path.exists(frames_dir):
            print(f"🧹 [Fresh Start] Cleaning out old frames in: {frames_dir}")
            shutil.rmtree(frames_dir)
        os.makedirs(frames_dir, exist_ok=True)

        try:
            print(f"🧹 [Fresh Start] Purging old VectorDB metadata for {source_id} in {collection_name}")
            col = self.chroma_client.get_or_create_collection(name=collection_name)
            col.delete(where={"source_id": source_id})
        except Exception as e:
            pass

        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            print(f"❌ [ML Engine] ERROR: Could not open video source: {video_path}")
            return
            
        print(f"✅ [ML Engine] Successfully connected to source: {source_id}")
        fps = round(cap.get(cv2.CAP_PROP_FPS))
        if fps <= 0: fps = 25 
        frame_interval = max(1, int(fps / fps_to_extract))
        
        count = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            
            if on_frame:
                on_frame(frame)
            
            if count % frame_interval == 0:
                timestamp = count / fps
                frame_path = f"./data/frames/{source_id}/t_{timestamp:.1f}.jpg"
                metadata = {"source_id": source_id, "timestamp": timestamp, "frame_path": frame_path}
                
                try:
                    # --- CRITICAL FIX: Save frame SYNCHRONOUSLY to ensure disk exists ---
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_img = Image.fromarray(rgb_frame)
                    pil_img.save(frame_path)
                    
                    # Push PIL image to background worker for CLIP analysis
                    self.ai_queue.put_nowait((pil_img, metadata, source_id, timestamp, collection_name))
                except Exception as e:
                    print(f"⚠️ [Ingestion] Skipped frame for {source_id}: {e}")
                
            count += 1
        cap.release()
        
        print(f"🏁 [ML Engine] Ingestion finished reading for {source_id}. Waiting for AI Worker...")
        self.ai_queue.put(("FLUSH", source_id, collection_name, True))
        self.ai_queue.join()
        print(f"✅ [ML Engine] AI processing completed for {source_id}.")

    def _store_batch(self, images, metadatas, ids, collection_name):
        tensors = torch.stack([self.preprocess(img) for img in images]).to(self.device)
        with torch.no_grad():
            features = self.model.encode_image(tensors)
            features /= features.norm(dim=-1, keepdim=True)
            
        col = self.chroma_client.get_or_create_collection(name=collection_name)
        col.add(embeddings=features.cpu().tolist(), metadatas=metadatas, ids=ids)
        print(f"💾 [ML Engine] Successfully stored batch of {len(images)} frames in {collection_name}. Total count: {col.count()}")

    def query(self, text_query, top_k=5, source_id=None, collection_name=None, is_stream=False):
        if collection_name is None:
            collection_name = "live_cctv_stream" if is_stream else "uploaded_vault"

        text_input = self.tokenizer([text_query]).to(self.device)
        with torch.no_grad():
            features = self.model.encode_text(text_input)
            features /= features.norm(dim=-1, keepdim=True)
            
        where_filter = {"source_id": source_id} if source_id else None
        context_str = "📡 LIVE STREAM" if is_stream else "📼 UPLOADED VAULT"
        print(f"🔍 [ML Engine] Context Identified: {context_str} | Query: '{text_query}' (Source filter: {source_id or 'ALL'})")
        
        col = self.chroma_client.get_or_create_collection(name=collection_name)
        results = col.query(
            query_embeddings=[features.cpu().tolist()[0]], 
            n_results=top_k,
            where=where_filter
        )
        
        if not results['ids'] or not results['ids'][0]:
            print(f"⚠️ [ML Engine] No matches found for query: '{text_query}' (Filter: {source_id})")
            return {"status": "error", "message": "No matches found."}

        raw_frames = results['metadatas'][0]
        valid_frames = []
        vlm_content =[f"Query: '{text_query}'. Look VERY closely at these CCTV frames, especially for small details and objects. Did it happen? Be concise."]

        for m in raw_frames: 
            if os.path.exists(m['frame_path']):
                valid_frames.append(m)
                vlm_content.append(Image.open(m['frame_path']))
            else:
                print(f"  -> Ignoring stale metadata (file missing): {m['frame_path']}")
        
        if not valid_frames:
            return {"status": "error", "message": "No valid image frames found on disk for this query."}
        
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