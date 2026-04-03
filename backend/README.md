# ⚙️ Backend Engineering Plan

**Goal:** Build a robust API layer that handles user accounts, serves video files, and triggers the ML pipeline gracefully without blocking HTTP requests.

## 🛠️ 1. Integrating with the ML Environment
provided is the core intelligence in the `/model` folder. You need to hook into it.
1. **Source the Environment:** Ensure your backend runs in the same Python/system environment as the ML code so it can access the ML libraries.
2. **First Run Setup:** Before starting your API server, run `python model/setup_env.py`. This will create the local `VectorDB` and the `/data/videos` folders. If you don't do this, the API will crash when trying to save files.
3. **Importing the ML Pipeline:** In your API route handlers, you will import the class from the ML folder:
   ```python
   from model.pipelineY import OfflineVideoPipeline
   ml_engine = OfflineVideoPipeline(api_key="GEMINI_API_KEY", collection_name="cctv_main_stream")
   ```

## 🗄️ 2. The Relational Database
You need a standard Relational DB (e.g., SQLite/Postgres) to store:
* **Users:** `id`, `email`, `password_hash`, `telegram_handle`
* **Alert Rules:** `id`, `user_id`, `condition` (text), `is_active` (boolean)
* **Chat History (Optional):** `user_id`, `query`, `response`, `timestamp`

## 🌐 3. API Endpoints Contract

### Auth & User Profile
* `POST /api/auth/signup` - Create user.
* `POST /api/auth/login` - Return JWT/Session.
* `GET /api/user/me` - Get user profile (importantly, their notification settings).
* `PUT /api/user/me` - Update profile (e.g., set their Telegram handle).

### Video & Query Endpoints
* **`GET /videos/{filename}`**
  * *Action:* Serve raw MP4 files statically from `/model/data/videos/`. The frontend needs this to render the video player.
* **`POST /api/query` (Normal Mode)**
  * *Input:* `{"query": "did someone drop a bag?"}`
  * *Action:* Call `ml_engine.query(request.query)`.
  * *Returns:*
    ```json
    {
      "query": "did someone drop a bag?",
      "response": "Yes, I spotted a person dropping a black backpack.",
      "source_id": "cctv_main",
      "clip_start": 12.5,
      "clip_end": 18.0
    }
    ```
* **`POST /api/media/upload` (Media Mode)**
  * *Input:* Multipart Form (`.mp4` file).
  * *Action:* Save the file to `/model/data/videos/`. Trigger `ml_engine.ingest_video(...)` as a **Background Task** (do not make the user wait 3 minutes for the HTTP request to finish). Return `{"status": "processing"}`.

### The Alert System Endpoints
* **`POST /api/alerts/setup`**
  * *Input:* `{"condition": "A red car parks in the loading zone"}`
  * *Action:* Save this rule to the Relational DB for the logged-in user.

## 🤖 4. The Background Alert Daemon
You need to write a background loop (a cron job or background worker) that runs every 30-60 seconds.
1. It queries the Relational DB for all active `Alert Rules`.
2. It passes those rules as queries to the `ml_engine.query(rule)`.
3. If the ML engine returns a positive match (e.g., the VLM confirms it happened in the last 60 seconds of the VectorDB), trigger a webhook or bot to send a message to the user's Telegram handle.
