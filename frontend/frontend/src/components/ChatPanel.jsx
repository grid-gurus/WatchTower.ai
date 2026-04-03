import { useState } from "react";
import LoadingScanner from "./LoadingScanner";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const newMessage = { type: "user", text: input };
    setMessages((prev) => [...prev, newMessage]);

    setLoading(true);
    setInput("");

    // 🔥 Simulate backend delay (3 sec)
    setTimeout(() => {
      const aiResponse = {
        type: "ai",
        text: "Yes, I detected a suspicious activity near the entrance.",
        clip_start: 10,
        clip_end: 20,
      };

      setMessages((prev) => [...prev, aiResponse]);
      setLoading(false);
    }, 3000);
  };

  return (
    <div className="h-full flex flex-col">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            Ask something about the video...
          </p>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[75%] px-4 py-3 rounded-lg ${msg.type === "user"
                ? "ml-auto bg-gradient-to-r from-cyan-400 to-purple-500 text-black"
                : "bg-white/[0.05] border border-white/10 text-white"
              }`}
          >
            <p>{msg.text}</p>

            {/* 🔥 Play Button (AI only) */}
            {msg.type === "ai" && (
              <button
                className="mt-3 text-sm text-cyan-400 hover:underline"
                onClick={() => {
                  console.log("Play clip:", msg.clip_start, msg.clip_end);
                }}
              >
                ▶ Play Event Match
              </button>
            )}
          </div>
        ))}

        {/* 🔥 Loading Scanner */}
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
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold hover:scale-105 transition"
        >
          Send
        </button>

      </div>

    </div>
  );
}