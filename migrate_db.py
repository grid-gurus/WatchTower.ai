import sqlite3
import os

db_path = "d:/coding/Hackathon/Updated one/WatchTower.ai/watchtower.db"

if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "profile_picture" not in columns:
            print("Adding 'profile_picture' column to 'users' table...")
            cursor.execute("ALTER TABLE users ADD COLUMN profile_picture TEXT")
            conn.commit()
            print("Success!")
        else:
            print("Column 'profile_picture' already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Failed to migrate database: {e}")
