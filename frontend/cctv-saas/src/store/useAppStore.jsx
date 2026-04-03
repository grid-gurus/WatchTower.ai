import { create } from "zustand";

const useAppStore = create((set) => ({
  //videoUrl: "http://localhost:5000/videos/cctv_stream.mp4",
  videoUrl: "/cctv.mp4",
  clipStart: null,
  clipEnd: null,
  isEventPlaying: false,

  setClip: (start, end) =>
    set({
      clipStart: start,
      clipEnd: end,
      isEventPlaying: true,
    }),

  setVideo: (url) => set({ videoUrl: url }),
}));

export default useAppStore;