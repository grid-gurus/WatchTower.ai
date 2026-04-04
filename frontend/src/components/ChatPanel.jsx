import { useState } from "react";
import axios from "axios";
import LoadingScanner from "./LoadingScanner";
import useAppStore from "../store/useAppStore";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const playClip = useAppStore((state) => state.playClip);
  const { playFromQuery } = useAppStore();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { type: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    setInput("");

    try {
      const res = await axios.post("http://localhost:8000/api/query", {
        query: input,
      });

      const data = res.data;
      console.log("ML result:", data);

      if (data && data.clip_start !== undefined && data.clip_end !== undefined) {
        playFromQuery(data);
      }

      const aiMsg = {
        type: "ai",
        text: data.response || "No response",
        clip_start: data.clip_start,
        clip_end: data.clip_end,
      };

      setMessages((prev) => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: "⚠️ Something went wrong",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#050816] relative overflow-hidden">

      {/* 🔥 Grid background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Scanline */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Header */}
        {/* <div className="p-4 border-b border-cyan-400/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-cyan-400">
              AI QUERY INTERFACE
            </p>
            <h2 className="text-lg font-bold text-white">
              Video Intelligence
            </h2>
          </div>
          <span className="text-xs text-green-400 animate-pulse">
            ● LIVE
          </span>
        </div> */}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[75%] px-4 py-3 border text-sm tracking-wide ${msg.type === "user"
                ? "ml-auto bg-[#00d4ff] text-black border-[#00d4ff]"
                : "bg-[#0e0e13] border-white/10 text-white"
                }`}
            >
              <p>{msg.text}</p>

              {/* Replay */}
              {msg.type === "ai" && msg.clip_start !== undefined && (
                <button
                  className="mt-3 text-xs text-cyan-400 hover:underline"
                  onClick={() => playClip(msg.clip_start, msg.clip_end)}
                >
                  ▶ PLAY MATCHED EVENT
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-center">
              <LoadingScanner />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-cyan-400/10 flex gap-3 bg-[#0a0a0f]">

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter surveillance query..."
            className="flex-1 px-4 py-3 bg-[#0e0e13] border border-white/10 text-white placeholder:text-gray-500 outline-none focus:border-cyan-400 text-sm tracking-wide"
          />

          <button
            onClick={handleSend}
            className="px-6 py-3 bg-[#00d4ff] text-black font-bold tracking-wider hover:invert transition active:scale-95"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}