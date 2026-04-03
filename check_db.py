import chromadb
import os

def check_db():
    try:
        path = "d:\\coding\\Hackathon\\Updated one\\WatchTower.ai\\data\\vector_db"
        if not os.path.exists(path):
            print(f"❌ DB path not found: {path}")
            return
            
        client = chromadb.PersistentClient(path=path)
        collection = client.get_collection(name="cctv_main_stream")
        
        # Get counts by source_id
        results = collection.get()
        metadatas = results['metadatas']
        
        if not metadatas:
            print("📭 DB is empty.")
            return
            
        counts = {}
        for m in metadatas:
            sid = m.get('source_id', 'Unknown')
            counts[sid] = counts.get(sid, 0) + 1
            
        print("📊 ChromaDB Entry Counts:")
        for sid, count in counts.items():
            print(f"  - {sid}: {count} frames")
            
    except Exception as e:
        print(f"❌ Error checking DB: {e}")

if __name__ == "__main__":
    check_db()
