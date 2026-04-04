import os
import chromadb 

def setup_environment():
    print(" Initializing Offline Model Environment...")
    
    directories =[
        "./data/vector_db",
        "./data/frames",
        "./data/videos"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"Created directory: {directory}")

    print("Initializing offline VectorDB...")
    client = chromadb.PersistentClient(path="./data/vector_db")
    
    # Cosine similarity is best for CLIP embeddings
    client.get_or_create_collection(name="cctv_main_stream", metadata={"hnsw:space": "cosine"})
    client.get_or_create_collection(name="user_uploaded_media", metadata={"hnsw:space": "cosine"})
    
    print("Environment successfully configured! Ready for backend integration.")

if __name__ == "__main__":
    setup_environment()
