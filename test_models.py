import os
import dotenv
from google import genai

# Load .env
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, "WatchTower.ai", ".env")
dotenv.load_dotenv(env_path)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("No API key found in .env")
else:
    client = genai.Client(api_key=api_key)
    try:
        print("Listing available models...")
        for model in client.models.list():
            print(f" - {model.name}")
    except Exception as e:
        print(f"Error listing models: {e}")
