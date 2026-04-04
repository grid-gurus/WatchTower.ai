import { useEffect } from "react";
import useAppStore from "../store/useAppStore";

export default function FramePlayer() {
    const {
        frameBasePath,
        clipStart,
        clipEnd,
        currentFrameTime,
        setCurrentFrame,
        isEventPlaying,
        stopClip,
        clearResult,
    } = useAppStore();

    useEffect(() => {
        if (!isEventPlaying || clipStart === null) return;

        let t = clipStart;

        const interval = setInterval(() => {
            setCurrentFrame(t);
            t += 1;

            if (t > clipEnd) {
                stopClip();
                clearInterval(interval);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [clipStart, clipEnd, isEventPlaying]);

    if (!frameBasePath || currentFrameTime === null) return null;

    const frameUrl = `${frameBasePath}/t_${currentFrameTime}.0.jpg`;

    return (
        <div className="h-full flex items-center justify-center p-4 bg-[#050816] relative overflow-hidden">

            {/* 🔥 Grid */}
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

            {/* Frame container */}
            <div
                className={`relative w-full h-full border ${isEventPlaying
                        ? "border-red-500 shadow-[0_0_30px_rgba(255,0,0,0.5)]"
                        : "border-cyan-400/20"
                    } bg-black`}
            >

                {/* 🔥 TOP HUD */}
                <div className="absolute top-0 left-0 w-full flex justify-between items-center px-4 py-2 text-[10px] font-mono tracking-widest bg-black/60 border-b border-cyan-400/10 z-20">
                    <span className="text-cyan-400">FRAME MODE</span>
                    <span className="text-green-400 animate-pulse">● ACTIVE</span>
                    <span className="text-slate-400">
                        T={currentFrameTime}s
                    </span>
                </div>

                {/* 🚨 Event Banner */}
                {isEventPlaying && (
                    <div className="absolute top-10 left-4 z-20 border border-red-500 bg-red-500/10 px-4 py-2 text-xs font-bold tracking-widest text-red-400 animate-pulse">
                        ⚠ EVENT DETECTED
                    </div>
                )}

                {/* ❌ Stop Playback */}
                {isEventPlaying && (
                    <button
                        onClick={stopClip}
                        className="absolute top-10 right-4 z-20 border border-red-400/40 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20 transition"
                    >
                        TERMINATE
                    </button>
                )}

                {/* 🗑️ Remove Results */}
                {!isEventPlaying && (
                    <button
                        onClick={clearResult}
                        className="absolute top-10 right-4 z-20 border border-cyan-400/30 px-3 py-1 text-xs text-cyan-300 hover:bg-cyan-400/10 transition"
                    >
                        CLEAR RESULT
                    </button>
                )}

                {/* 🖼️ Frame */}
                <img
                    src={frameUrl}
                    alt="frame"
                    className="w-full h-full object-cover"
                />

                {/* 🎯 Crosshair */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 border border-cyan-400/20"></div>
                </div>

                {/* 🔻 Bottom HUD */}
                <div className="absolute bottom-0 left-0 w-full flex justify-between px-4 py-2 text-[10px] font-mono tracking-widest bg-black/60 border-t border-cyan-400/10">
                    <span className="text-slate-400">MODE: FRAME_ANALYSIS</span>
                    <span className="text-slate-400">
                        RANGE: {clipStart} → {clipEnd}
                    </span>
                    <span className="text-slate-400">AI: ACTIVE</span>
                </div>
            </div>
        </div>
    );
}