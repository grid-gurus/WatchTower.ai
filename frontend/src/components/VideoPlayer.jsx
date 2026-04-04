import { useEffect, useRef } from "react";
import useAppStore from "../store/useAppStore";

export default function VideoPlayer() {
  const videoRef = useRef(null);
  const loopCountRef = useRef(0);

  const {
    videoUrl,
    clipStart,
    clipEnd,
    isEventPlaying,
    stopClip,
  } = useAppStore();

  useEffect(() => {
    const video = videoRef.current;
    if (!video || clipStart === null) return;

    video.currentTime = clipStart;
    video.play();
    loopCountRef.current = 0;
  }, [clipStart]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || clipStart === null || clipEnd === null) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= clipEnd) {
        loopCountRef.current += 1;

        if (loopCountRef.current >= 5) {
          stopClip();
          return;
        }

        video.currentTime = clipStart;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [clipStart, clipEnd, stopClip]);

  return (
    <div className="h-full flex items-center justify-center p-4 bg-[#050816] relative overflow-hidden">

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)",
        }}
      />

      {/* Main frame */}
      <div
        className={`relative w-full h-full border ${isEventPlaying
            ? "border-red-500 shadow-[0_0_30px_rgba(255,0,0,0.5)]"
            : "border-cyan-400/20"
          } bg-black`}
      >

        {/* 🔥 Top HUD */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-center px-4 py-2 text-[10px] font-mono tracking-widest bg-black/60 backdrop-blur border-b border-cyan-400/10 z-20">
          <span className="text-cyan-400">CAM_ID: 01</span>
          <span className="text-green-400 animate-pulse">● LIVE</span>
          <span className="text-slate-400">
            {new Date().toLocaleTimeString()}
          </span>
        </div>

        {/* 🚨 Event Banner */}
        {isEventPlaying && (
          <div className="absolute top-10 left-4 z-20 border border-red-500 bg-red-500/10 px-4 py-2 text-xs font-bold tracking-widest text-red-400 animate-pulse">
            ⚠ EVENT DETECTED
          </div>
        )}

        {/* ❌ Exit Button */}
        {isEventPlaying && (
          <button
            onClick={stopClip}
            className="absolute top-10 right-4 z-20 border border-red-400/40 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20 transition"
          >
            TERMINATE
          </button>
        )}

        {/* 🎥 Video */}
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-full object-cover"
        />

        {/* 🎯 Crosshair overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-40 h-40 border border-cyan-400/20"></div>
        </div>

        {/* 🎬 Bottom HUD */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between px-4 py-2 text-[10px] font-mono tracking-widest bg-black/60 border-t border-cyan-400/10">
          <span className="text-slate-400">MODE: TRACKING</span>
          <span className="text-slate-400">AI: ACTIVE</span>
          <span className="text-slate-400">LOOPS: {loopCountRef.current}/5</span>
        </div>
      </div>
    </div>
  );
}