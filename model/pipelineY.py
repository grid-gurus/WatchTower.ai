import cv2
import torch
import os
import chromadb
from PIL import Image
import open_clip
from google import genai
import concurrent.futures

class OfflineVideoPipeline:
    def __init__(self, api_key, collection_name="cctv_main_stream"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        self.model, _, self.preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai')
        self.model = self.model.to(self.device)
        self.tokenizer = open_clip.get_tokenizer('ViT-B-32')
        
        self.chroma_client = chromadb.PersistentClient(path="./data/vector_db")
        self.collection = self.chroma_client.get_collection(name=collection_name)
        
        self.vlm_client = genai.Client(api_key=api_key)
        self.vlm_model_name = "gemini-2.5-flash" # Use generic flash model
        self.io_pool = concurrent.futures.ThreadPoolExecutor(max_workers=8)

    def ingest_video(self, video_path, source_id, fps_to_extract=1, batch_size=64):
        """Extracts frames, gets embeddings, and saves to VectorDB."""
        os.makedirs(f"./data/frames/{source_id}", exist_ok=True)
        cap = cv2.VideoCapture(video_path)
        fps = round(cap.get(cv2.CAP_PROP_FPS))
        frame_interval = max(1, int(fps / fps_to_extract))
        
        count = 0
        batch_images, batch_metadatas, batch_ids = [], [],[]

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            
            if count % frame_interval == 0:
                timestamp = count / fps
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb_frame)
                
                frame_path = f"./data/frames/{source_id}/t_{timestamp:.1f}.jpg"
                self.io_pool.submit(pil_img.save, frame_path)
                
                batch_images.append(pil_img)
                batch_metadatas.append({"source_id": source_id, "timestamp": timestamp, "frame_path": frame_path})
                batch_ids.append(f"{source_id}_{timestamp}")
                
                if len(batch_images) == batch_size:
                    self._store_batch(batch_images, batch_metadatas, batch_ids)
                    batch_images, batch_metadatas, batch_ids = [], [],[]
            count += 1
        cap.release()
        
        if batch_images:
            self._store_batch(batch_images, batch_metadatas, batch_ids)

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

        frames = results['metadatas'][0]
        timestamps = [m['timestamp'] for m in frames]
        
        vlm_content =[f"Query: '{text_query}'. Review these CCTV frames. Did it happen? Be concise."]
        for m in frames[:3]: vlm_content.append(Image.open(m['frame_path']))

        response = self.vlm_client.models.generate_content(model=self.vlm_model_name, contents=vlm_content)
        
        return {
            "query": text_query,
            "response": response.text,
            "source_id": frames[0]['source_id'],
            "clip_start": max(0, min(timestamps) - 2.0),
            "clip_end": max(timestamps) + 2.0
        }
