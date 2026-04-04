import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ChatPanel from "../components/ChatPanel";
import VideoPlayer from "../components/VideoPlayer";
import UploadDropzone from "../components/UploadDropZone";
import Navbar from "../components/Navbar";
import useAlertStore from "../store/useAlertStore";
import FramePlayer from "../components/FramePlayer";

export default function Dashboard() {
  const [mediaMode, setMediaMode] = useState(false);

  const addNotification = useAlertStore((s) => s.addNotification);
  const lastAlertRef = useRef(null);

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-x-hidden relative">

      {/* 🔥 Grid Background */}
      <div
        className="fixed inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Scanlines */}
      <div
        className="fixed inset-0 opacity-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)",
        }}
      />

      {/* Glow */}
      <div className="fixed top-[-120px] left-[-120px] w-[400px] h-[400px] bg-cyan-400 opacity-10 blur-[180px] rounded-full"></div>
      <div className="fixed bottom-[-120px] right-[-120px] w-[400px] h-[400px] bg-purple-500 opacity-10 blur-[180px] rounded-full"></div>

      {/* Navbar */}
      <Navbar />

      {/* Main Layout */}
      <div className="relative z-10 flex h-[calc(100vh-80px)] px-4 md:px-6 pt-24 gap-4">

        {/* LEFT PANEL */}
        <div className="flex-1 min-w-0 border border-cyan-400/20 bg-[#0a0a0f] flex flex-col">

          {/* Header */}
          <div className="px-5 py-4 border-b border-cyan-400/10 flex justify-between items-center">
            <div>
              <p className="text-[10px] tracking-[0.3em] text-cyan-400">
                QUERY MODULE
              </p>
              <h2 className="text-sm text-white font-semibold">
                AI Intelligence Panel
              </h2>
            </div>

            <button
              onClick={() => setMediaMode(!mediaMode)}
              className="text-xs text-cyan-400 border border-cyan-400/20 px-3 py-1 hover:bg-cyan-400/10 transition"
            >
              {mediaMode ? "CCTV MODE" : "MEDIA MODE"}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {mediaMode ? <UploadDropzone /> : <ChatPanel />}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 min-w-0 border border-purple-400/20 bg-[#0a0a0f] flex flex-col">

          {/* Header */}
          <div className="px-5 py-4 border-b border-purple-400/10 flex justify-between items-center">
            <div>
              <p className="text-[10px] tracking-[0.3em] text-purple-400">
                VIDEO MODULE
              </p>
              <h2 className="text-sm text-white font-semibold">
                {mediaMode ? "Uploaded Feed" : "Live Surveillance"}
              </h2>
            </div>

            <span className="text-xs text-green-400 animate-pulse">
              ● LIVE
            </span>
          </div>

          {/* Video Area */}
          <div className="flex-1 flex items-center justify-center overflow-hidden relative">

            {/* subtle overlay frame */}
            <div className="absolute inset-0 border border-cyan-400/10 pointer-events-none"></div>

            {/* player */}
            <FramePlayer />
            {/* <VideoPlayer /> */}
          </div>
        </div>
      </div>

      {/* Bottom system status */}
      <div className="fixed bottom-0 left-0 w-full border-t border-cyan-400/10 bg-black/60 backdrop-blur px-6 py-2 flex justify-between text-[10px] text-slate-500 font-mono tracking-widest">
        <span>SYSTEM: ACTIVE</span>
        <span>AI_MODEL: VIDEO-RAG</span>
        <span>STREAM: RUNNING</span>
      </div>
    </div>
  );
}