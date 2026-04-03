import unittest
from unittest.mock import MagicMock, patch
import queue
import threading
import time
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

# Mock the dependencies of OfflineVideoPipeline
with patch('torch.cuda.is_available', return_value=False), \
     patch('open_clip.create_model_and_transforms', return_value=(MagicMock(), None, MagicMock())), \
     patch('open_clip.get_tokenizer', return_value=MagicMock()), \
     patch('chromadb.PersistentClient', return_value=MagicMock()), \
     patch('google.genai.Client', return_value=MagicMock()):
    
    from model.pipelineY import OfflineVideoPipeline

class TestPipeline(unittest.TestCase):
    def test_ingest_video_waits_for_worker(self):
        # Setup
        pipeline = OfflineVideoPipeline(api_key="test_key")
        
        # Mock the worker to take some time
        original_store_batch = pipeline._store_batch
        processed_tasks = []
        
        def mock_store_batch(images, metadatas, ids, collection_name):
            print(f"DEBUG: Worker calling mock_store_batch with {len(images)} items...")
            time.sleep(1) # Simulate slow processing
            processed_tasks.append(len(images))
            print(f"DEBUG: Worker finished mock_store_batch")
            
        pipeline._store_batch = mock_store_batch
        
        # Mock VideoCapture to return a few frames
        import numpy as np
        dummy_frame = np.zeros((100, 100, 3), dtype=np.uint8)
        mock_cap = MagicMock()
        mock_cap.isOpened.side_effect = [True, True, True, False]
        mock_cap.read.side_effect = [(True, dummy_frame), (True, dummy_frame), (True, dummy_frame)]
        mock_cap.get.return_value = 1 # 1 FPS
        
        with patch('cv2.VideoCapture', return_value=mock_cap):
            print("Starting ingestion call...")
            start_time = time.time()
            # Batch size is 32, we have 3 frames. So it should only store on FLUSH.
            pipeline.ingest_video("dummy_video.mp4", "test_source", fps_to_extract=1)
            duration = time.time() - start_time
            print(f"Ingestion call returned after {duration:.2f} seconds")
            
        # Check queue status
        print(f"Final queue size: {pipeline.ai_queue.qsize()}")
        # If it waited, duration should be at least 1 second (due to sleep in mock_store_batch)
        print(f"Total processed tasks: {len(processed_tasks)}")
        self.assertGreaterEqual(duration, 1.0)
        self.assertEqual(len(processed_tasks), 1)
        print("Success! Ingestion waited for worker.")

if __name__ == "__main__":
    unittest.main()
