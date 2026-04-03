import chromadb

client = chromadb.PersistentClient(path="./data/vector_db")
collections = client.list_collections()

print(f"Total Collections: {len(collections)}")
for col_name in collections:
    col = client.get_collection(name=col_name.name)
    count = col.count()
    print(f"Collection: {col_name.name} (Count: {count})")
    if count > 0:
        results = col.get(limit=5, include=['metadatas'])
        source_ids = set(m['source_id'] for m in results['metadatas'])
        print(f"  -> Sample Source IDs: {list(source_ids)}")
