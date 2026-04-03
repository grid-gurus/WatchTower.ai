import cv2
import numpy as np

def create_test_video(filename="test_upload.mp4", duration=3, fps=1):
    width, height = 640, 480
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(filename, fourcc, fps, (width, height))
    
    for i in range(duration * fps):
        # Create a frame with some text so it's not just black
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        cv2.putText(frame, f"Test Frame {i}", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        out.write(frame)
        
    out.release()
    print(f"🎬 Created test video: {filename}")

if __name__ == "__main__":
    create_test_video()
