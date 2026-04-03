import cv2
import time
import threading
import torch
from PIL import Image
import os
import open_clip

class IPStreamThreader:
    """
    Prevents Buffer Lag for live RTSP/IP cameras.
    Reads frames in a separate daemon thread to ensure ML always gets the latest frame.
    """
    def __init__(self, src):
        self.cap = cv2.VideoCapture(src)
        self.ret, self.frame = self.cap.read()
        self.stopped = False
        
        self.thread = threading.Thread(target=self.update, args=())
        self.thread.daemon = True
        self.thread.start()

    def update(self):
        while not self.stopped:
            ret, frame = self.cap.read()
            if not ret:
                time.sleep(1)
                continue
            self.ret = ret
            self.frame = frame 

    def read(self):
        return self.ret, self.frame

    def release(self):
        self.stopped = True
        self.cap.release()

class WebRTCPipeline:
    def __init__(self, parent_rag_pipeline):
        """
        Takes the existing OfflineVideoPipeline as a parent so we don't duplicate
        the heavy ML models in memory!
        """
        self.engine = parent_rag_pipeline

    def connect_and_watch(self, rtsp_ip_url, source_id="ip_cam_1", check_interval_sec=1.0):
        print(f"🌍 Initiating Skynet Uplink to {source_id} at {rtsp_ip_url}...")
        
        video_stream = IPStreamThreader(rtsp_ip_url)
        last_extract_time = time.time()
        
        print(f"✅ Uplink Established. Threat Monitoring Active on {source_id}.")

        try:
            while True:
                current_time = time.time()
                
                if current_time - last_extract_time >= check_interval_sec:
                    ret, frame = video_stream.read()
                    
                    if ret and frame is not None:
                        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        pil_img = Image.fromarray(rgb_frame)
                        
                        os.makedirs(f"./data/frames/{source_id}", exist_ok=True)
                        frame_path = f"./data/frames/{source_id}/live_{int(current_time)}.jpg"
                        
                        # Use the parent engine's io_pool for non-blocking saves
                        self.engine.io_pool.submit(pil_img.save, frame_path)
                        
                        self.engine._store_batch(
                            images=[pil_img], 
                            metadatas=[{"source_id": source_id, "timestamp": current_time, "frame_path": frame_path}], 
                            ids=[f"{source_id}_{int(current_time)}"]
                        )
                        
                        print(f"[{source_id}] Scene ingested. System Time: {time.strftime('%H:%M:%S')}")
                    
                    last_extract_time = current_time
                    
        except KeyboardInterrupt:
            print("🛑 Skynet Override triggered. Shutting down connection.")
        finally:
            video_stream.release()
