import { create } from "zustand";

const useAppStore = create((set) => ({
  // 🎬 Clip info
  clipStart: null,
  clipEnd: null,
  isEventPlaying: false,

  // 🖼️ Frame playback
  frameBasePath: null,
  currentFrameTime: null,

  // 🎥 NEW: Video preview state (SAFE ADDITION)
  videoUrl: null,

  setVideoUrl: (url) =>
    set({
      videoUrl: url,
    }),

  // 🔥 Handle backend query response (FRAMES ONLY)
  playFromQuery: (data) =>
    set({
      frameBasePath: `http://localhost:8000/data/frames/${data.source_id}`,
      clipStart: Math.floor(data.clip_start),
      clipEnd: Math.floor(data.clip_end),
      currentFrameTime: Math.floor(data.clip_start),
      isEventPlaying: true,
    }),

  // 🔄 Update frame during playback
  setCurrentFrame: (time) =>
    set({
      currentFrameTime: time,
    }),

  // ⛔ Stop playback
  stopClip: () =>
    set({
      clipStart: null,
      clipEnd: null,
      isEventPlaying: false,
      currentFrameTime: null,
      frameBasePath: null,
    }),
}));

export default useAppStore;