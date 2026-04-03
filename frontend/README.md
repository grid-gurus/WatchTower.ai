**Goal:** Build a sleek, high-tech SaaS platform. Think dark mode, neon accents, and a layout that feels like a modern Palantir or advanced security dashboard.

##  1. The Startup Landing Page
Before logging in, the user should be sold on the product.
* **Hero Section:** Big, bold typography: *"Query the Unseen. Natural Language CCTV Intelligence."* Have a looping, muted CCTV video in the background.
* **About Us:** A brief section explaining our Two-Stage Video-RAG multimodal architecture (keep it sounding technical but accessible).
* **Pricing Tier Cards:**
  * *Basic:* Upload local files (Free).
  * *Pro:* 1 Live CCTV Stream integration ($49/mo).
  * *Enterprise:* Multi-camera WebRTC & unlimited alerts (Contact Us).

##  2. Auth & Profile Flow
* Clean modals for **Login** and **Signup**.
* **Profile Page:** Users must be able to view their account and set their **Telegram Handle/Notification Number**. (The backend needs this to send automated alerts).

##  3. The Main Dashboard (Split-Screen Layout)
Once logged in, the main app should be a split-screen workspace.

### Component A: The Chat Interface (Left Side)
* A ChatGPT-style chat window.
* **Loading States:** When the user sends a query, the backend ML pipeline takes ~3-5 seconds. Show a high-tech scanning animation or spinner ("Analyzing VectorDB...").
* **Actionable Bubbles:** When the AI responds, render the text. Inside the bubble, render a button: `[ ▶ Play Event Match ]`. 
* **State Management:** Clicking that button must pass the `clip_start` and `clip_end` variables (returned from the backend JSON) to the Video Player component on the right.

### Component B: The Smart Video Player (Right Side)
* A robust HTML5 video player pointing to the backend's static video URL.
* **Dynamic Seeking:** When it receives a trigger from the Chat Interface, it must automatically execute:
  ```javascript
  videoRef.current.currentTime = clip_start;
  videoRef.current.play();
  ```
* **Looping:** Add an event listener to the video player. If `currentTime >= clip_end`, loop the video back to `clip_start`. This creates the illusion that the AI extracted a specific clip!
* **UI Polish:** When an event is actively looping, add a glowing red border around the video player and a badge that says `"🚨 EVENT DETECTED"`.

##  4. Dashboard Modes
* **Normal Mode:** The video player defaults to the main `cctv_stream.mp4` provided by the system.
* **Media Mode:** Provide a file dropzone. Users upload their own MP4. Once the backend finishes processing it, switch the Video Player source to their uploaded file so they can chat with it.

##  5. The Alert Setup Page
Create a dedicated page for "Tripwires".
* **Layout:** A list/table of active alerts.
* **Input:** A text box asking: *"What should we watch out for?"*
* **Flow:** User types *"Someone loitering near the backdoor"*. This sends a POST request to the backend. Add a card to the UI displaying the active rule, with a status indicator: `🟢 Active - Routing notifications to @telegram_handle`.
