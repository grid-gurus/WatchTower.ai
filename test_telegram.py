import os
import requests
import dotenv

# Load environment
dotenv.load_dotenv(".env")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

def send_telegram_alert(text: str, image_path: str = None):
    print(f"DEBUG: Token='{TELEGRAM_BOT_TOKEN[:5]}...', ChatID='{TELEGRAM_CHAT_ID}'")
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID: 
        print("❌ Missing credentials")
        return
    try:
        if image_path and os.path.exists(image_path):
            print(f"DEBUG: Sending photo from {image_path}")
            with open(image_path, "rb") as image_file:
                res = requests.post(
                    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto",
                    data={"chat_id": TELEGRAM_CHAT_ID, "caption": text},
                    files={"photo": image_file}
                )
                print(f"DEBUG: Status={res.status_code}, Response={res.text}")
        else:
            print("DEBUG: Sending text message")
            res = requests.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                data={"chat_id": TELEGRAM_CHAT_ID, "text": text}
            )
            print(f"DEBUG: Status={res.status_code}, Response={res.text}")
    except Exception as e:
        print(f"❌ Failed to send Telegram alert: {e}")

if __name__ == "__main__":
    send_telegram_alert("🔔 [WatchTower Test] Manually verifying Telegram link... Are you receiving this?")