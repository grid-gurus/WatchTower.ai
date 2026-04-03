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

      // ✅ SAFE CHECK BEFORE USING DATA
      if (data && data.clip_start !== undefined && data.clip_end !== undefined) {
        playFromQuery(data);   // only call if valid
      } else {
        console.warn("No playable clip found");
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
    <div className="h-full flex flex-col">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[75%] px-4 py-3 rounded-lg ${msg.type === "user"
              ? "ml-auto bg-gradient-to-r from-cyan-400 to-purple-500 text-black"
              : "bg-white/[0.05] border border-white/10"
              }`}
          >
            <p>{msg.text}</p>

            {/* Optional manual replay */}
            {msg.type === "ai" && (
              <button
                className="mt-2 text-sm text-cyan-400 hover:underline"
                onClick={() =>
                  playClip(msg.clip_start, msg.clip_end)
                }
              >
                ▶ Play Event Match
              </button>
            )}
          </div>
        ))}

        {loading && <LoadingScanner />}

      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          className="flex-1 p-3 rounded-lg bg-white/[0.05] border border-white/10 outline-none focus:border-cyan-400"
        />

        <button
          onClick={handleSend}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
}