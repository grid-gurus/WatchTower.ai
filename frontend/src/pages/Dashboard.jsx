import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ChatPanel from "../components/ChatPanel";
import VideoPlayer from "../components/VideoPlayer";
import UploadDropzone from "../components/UploadDropZone";
import Navbar from "../components/Navbar";
import useAlertStore from "../store/useAlertStore";
import FramePlayer from "../components/FramePlayer";
import useAppStore from "../store/useAppStore";

export default function Dashboard() {
  const [mediaMode, setMediaMode] = useState(false);
  const frameBasePath = useAppStore((state) => state.frameBasePath);

  const addNotification = useAlertStore((s) => s.addNotification);

  // 🔥 Prevent duplicate alerts
  const lastAlertRef = useRef(null);

  // // 🚨 ALERT POLLING
  //   useEffect(() => {
  //     const interval = setInterval(async () => {
  //       try {
  //         const res = await axios.post(
  //           "http://localhost:8000/api/alerts/setup"
  //         );

  //         if (res.data.triggered) {
  //           const alertMsg = res.data.alert?.condition;

  //           // ✅ Avoid duplicate spam
  //           if (alertMsg && alertMsg !== lastAlertRef.current) {
  //             lastAlertRef.current = alertMsg;

  //             addNotification({
  //               message: alertMsg,
  //               time: new Date().toLocaleTimeString(),
  //             });
  //           }
  //         }

  //       } catch (err) {
  //         console.error(err);
  //       }
  //     }, 5000); // every 5 sec

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#020617] to-[#000000] text-white overflow-x-hidden relative">

      {/* 🌌 Glow Background */}
      <div className="fixed top-[-120px] left-[-120px] w-[500px] h-[500px] bg-cyan-400 opacity-15 blur-[200px] rounded-full"></div>
      <div className="fixed bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-purple-500 opacity-15 blur-[200px] rounded-full"></div>
      <div className="fixed top-[40%] left-[30%] w-[300px] h-[300px] bg-indigo-500 opacity-10 blur-[180px] rounded-full"></div>

      {/* Navbar */}
      <Navbar />

      {/* Extra Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-120px] left-[-120px] w-[450px] h-[450px] bg-cyan-500 opacity-10 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-[-120px] right-[-120px] w-[450px] h-[450px] bg-purple-500 opacity-10 blur-[160px] rounded-full"></div>
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex h-[calc(100vh-80px)] px-4 md:px-6 pt-24 gap-4">

        {/* LEFT PANEL */}
        <div className={`transition-all duration-500 ${frameBasePath ? "flex-1" : "w-full max-w-3xl mx-auto"} min-w-0 p-[1.5px] rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 shadow-lg shadow-cyan-500/10`}>

          <div className="h-full bg-black rounded-xl flex flex-col">

            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
              <span className="text-sm text-gray-400">
                🧠 AI Query Interface
              </span>

              <button
                onClick={() => setMediaMode(!mediaMode)}
                className="text-xs text-cyan-400 hover:underline"
              >
                {mediaMode
                  ? "Switch to CCTV Mode"
                  : "Switch to Media Mode"}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {mediaMode ? <UploadDropzone /> : <ChatPanel />}
            </div>

          </div>
        </div>

        {/* RIGHT PANEL - Only show when frameBasePath is set */}
        {frameBasePath && (
          <div className="flex-1 min-w-0 p-[1.5px] rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 shadow-lg shadow-purple-500/10">

            <div className="h-full bg-black rounded-xl flex flex-col">

              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  📹 {mediaMode
                    ? "Uploaded Video"
                    : "Smart Video Feed"}
                </span>

                <span className="text-xs text-green-400 animate-pulse">
                  ● LIVE
                </span>
              </div>

              {/* Video */}
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                {/* <VideoPlayer /> */}
                <FramePlayer />
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}