import { useEffect, useRef } from "react";
import useAppStore from "../store/useAppStore";

export default function VideoPlayer() {
  const videoRef = useRef();

  const { videoUrl, clipStart, clipEnd, isEventPlaying } =
    useAppStore();

  // ▶ Jump to clip start
  useEffect(() => {
    if (clipStart !== null && videoRef.current) {
      videoRef.current.currentTime = clipStart;
      videoRef.current.play();
    }
  }, [clipStart]);

  // 🔁 Loop clip
  useEffect(() => {
    const video = videoRef.current;

    const handleTimeUpdate = () => {
      if (clipEnd && video.currentTime >= clipEnd) {
        video.currentTime = clipStart;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () =>
      video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [clipEnd, clipStart]);

  return (
    <div className="h-full flex items-center justify-center p-4">

      <div
        className={`relative w-full h-full border ${
          isEventPlaying
            ? "border-red-500 shadow-lg shadow-red-500/40"
            : "border-white/10"
        } rounded-lg overflow-hidden`}
      >
        {/* 🚨 Badge */}
        {isEventPlaying && (
          <div className="absolute top-2 left-2 bg-red-500 px-3 py-1 rounded text-sm">
            🚨 EVENT DETECTED
          </div>
        )}

        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-full object-cover"
        />
      </div>

    </div>
  );
}