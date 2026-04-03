import { useState } from "react";
import useAppStore from "../store/useAppStore";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const setClip = useAppStore((state) => state.setClip);

  const handleSend = async () => {
    if (!input) return;

    const userMsg = { type: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);

    // 🔥 FAKE RESPONSE (replace later with API)
    setTimeout(() => {
      const response = {
        text: "Yes, a person dropped a bag.",
        clip_start: 5,
        clip_end: 12,
      };

      setMessages((prev) => [
        ...prev,
        { type: "ai", ...response },
      ]);

      setLoading(false);
    }, 2000);

    setInput("");
  };

  return (
    <div className="h-full flex flex-col">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.type === "user" ? (
              <div className="text-right">
                <span className="bg-cyan-500/90 text-black px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20">
                  {msg.text}
                </span>
              </div>
            ) : (
              <div className="text-left space-y-2">
                <div className="bg-white/5 backdrop-blur px-4 py-2 rounded-xl border border-white/10">
                  {msg.text}
                </div>

                {/* 🔥 Play Button */}
                <button
                  onClick={() => setClip(msg.clip_start, msg.clip_end)}
                  className="text-sm px-3 py-1 border border-cyan-400 rounded hover:bg-cyan-400 hover:text-black transition"
                >
                  ▶ Play Event Match
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="text-gray-400">
            Analyzing VectorDB...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 flex gap-2">
        <input
          className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-2"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-cyan-500 text-black rounded-lg"
        >
          Send
        </button>
      </div>

    </div>
  );
}