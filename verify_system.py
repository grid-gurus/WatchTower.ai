import requests
import time

def run_verification():
    base_url = "http://localhost:8000"
    
    print("\n🧐 [Verification] Step 1: Checking Media Status...")
    try:
        r = requests.get(f"{base_url}/api/media/status")
        print(f"   -> Result: {r.json()}")
    except Exception as e:
        print(f"❌ Failed to reach status API: {e}")
        return

    print("\n🕵️ [Verification] Step 2: Simulating Context-Aware Query...")
    # NOTE: We are NOT sending source_id, the backend must use last_active_source
    # Since we haven't uploaded, it might return an error but we check logs!
    try:
        r = requests.post(
            f"{base_url}/api/query", 
            json={"query": "is there a blue car?"}
        )
        print(f"   -> Result: {r.json()}")
    except Exception as e:
        print(f"❌ Query failed: {e}")

if __name__ == "__main__":
    run_verification()
