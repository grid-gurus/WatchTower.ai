import ChatPanel from "../components/ChatPanel";
import VideoPlayer from "../components/VideoPlayer";

export default function Dashboard() {
  return (
    <div className="h-screen w-full bg-black text-white flex">

      {/* LEFT: Chat */}
      <div className="w-1/2 border-r border-white/10">
        <ChatPanel />
      </div>

      {/* RIGHT: Video */}
      <div className="w-1/2">
        <VideoPlayer />
      </div>

    </div>
  );
}