import os
import dotenv
from google import genai
from PIL import Image

# Load .env
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv.load_dotenv(os.path.join(base_dir, ".env"))
api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key, http_options={'api_version': 'v1'})
model_name = "gemini-2.5-flash"

# Use one of the existing frames
frame_path = os.path.join(base_dir, "data/frames/room_sattu/t_0.0.jpg")
if not os.path.exists(frame_path):
    print(f"Error: Frame not found at {frame_path}")
else:
    img = Image.open(frame_path)

    contents = [
        "Query: 'Is there a person in the room?'. Look closely at this CCTV frame. Be concise.",
        img
    ]

    try:
        print(f"Sending request to {model_name}...")
        response = client.models.generate_content(model=model_name, contents=contents)
        print(f"Success! Response: {response.text}")
    except Exception as e:
        print(f"Failed! Error: {e}")
