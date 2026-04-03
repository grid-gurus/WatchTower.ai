import chromadb
import os

def check_db():
    try:
        path = "d:\\coding\\Hackathon\\Updated one\\WatchTower.ai\\data\\vector_db"
        if not os.path.exists(path):
            print(f"❌ DB path not found: {path}")
            return
            
        client = chromadb.PersistentClient(path=path)
        
        # Test the two isolated buckets
        for col_name in ["uploaded_vault", "live_cctv_stream"]:
            try:
                collection = client.get_collection(name=col_name)
                results = collection.get()
                metadatas = results['metadatas']
                
                if not metadatas:
                    print(f"📭 Collection '{col_name}' is currently empty.")
                    continue
                    
                counts = {}
                for m in metadatas:
                    sid = m.get('source_id', 'Unknown')
                    counts[sid] = counts.get(sid, 0) + 1
                    
                print(f"📊 Collection '{col_name}' Status:")
                for sid, count in counts.items():
                    print(f"  - {sid}: {count} frames")
            except Exception:
                print(f"👻 Collection '{col_name}' has not been created yet.")
            
    except Exception as e:
        print(f"❌ Diagnostic failed: {e}")

if __name__ == "__main__":
    check_db()
