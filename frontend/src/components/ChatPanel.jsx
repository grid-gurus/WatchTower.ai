import { useState, useRef } from "react";
import axios from "axios";
import LoadingScanner from "./LoadingScanner";
import useAppStore from "../store/useAppStore";
import { Search, ZoomIn, Image as ImageIcon, X, Mic } from "lucide-react";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState("normal"); // normal, deep, image
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);

  const fileInputRef = useRef(null);
  const playClip = useAppStore((state) => state.playClip);
  const { playFromQuery, clearResult } = useAppStore();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSpeak = async (text, id) => {
    try {
      setSpeakingId(id);
      await axios.post("http://localhost:8000/api/speak", { text });
      setTimeout(() => setSpeakingId(null), 2000); // Visual feedback reset
    } catch (err) {
      console.error("Speech failed:", err);
      setSpeakingId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;

    // Add user message to UI
    const userMsg = { 
      type: "user", 
      text: input || (selectedFile ? "Searching by image..." : ""),
      image: previewUrl 
    };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    const currentInput = input;
    const currentFile = selectedFile;
    
    setInput("");
    clearFile();
    clearResult(); // 🔥 Clean start for new query

    try {
      let res;
      if (searchMode === "image" && currentFile) {
        // IMAGE SEARCH
        const formData = new FormData();
        formData.append("file", currentFile);
        if (currentInput) formData.append("query", currentInput);
        
        res = await axios.post("http://localhost:8000/api/search-image", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else if (searchMode === "deep") {
        // DEEP SEARCH
        res = await axios.post("http://localhost:8000/api/trace", {
          query: currentInput,
        });
      } else {
        // NORMAL SEARCH
        res = await axios.post("http://localhost:8000/api/query", {
          query: currentInput,
        });
      }

      const data = res.data;
      console.log(`${searchMode.toUpperCase()} result:`, data);

      // Handle common fields
      const isMatch = data.match_found || data.status === "success";
      const rawResponse = data.response || data.incident_report || data.message || "No results found.";
      
      // ✅ Play results only if AI confirms a POSITIVE match and it's not a deep trace report
      if (isMatch && data.clip_start !== undefined) {
        playFromQuery(data);
      } else {
        console.warn("Match not confirmed by AI or no timing data available.");
      }

      // Cleanup: remove internal tags like [MATCH: YES] or [MATCH: NO]
      let displayResponse = rawResponse.replace(/\[MATCH:\s*(YES|NO)\]/gi, "").trim();

      const aiMsg = {
        type: "ai",
        text: displayResponse,
        clip_start: isMatch ? data.clip_start : null,
        clip_end: isMatch ? data.clip_end : null,
        mode: searchMode,
        id: Date.now() // unique ID for speaking feedback
      };

      setMessages((prev) => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: "⚠️ Something went wrong during the analysis.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-md">
      
      {/* Mode Selector */}
      <div className="flex p-2 gap-2 border-b border-white/10 overflow-x-auto no-scrollbar">
        {[
          { id: "normal", label: "Brief Vision", icon: Search, desc: "Precise Answers" },
          { id: "deep", label: "Deep Search", icon: ZoomIn, desc: "Detailed Tracing" },
          { id: "image", label: "Snap Fusion", icon: ImageIcon, desc: "Visual Lookup" }
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSearchMode(mode.id)}
            className={`flex-1 min-w-[100px] flex flex-col items-center py-2 px-3 rounded-lg border transition-all ${
              searchMode === mode.id
                ? "bg-gradient-to-r from-cyan-400/20 to-purple-500/20 border-cyan-400/50 text-white shadow-lg shadow-cyan-400/10"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            }`}
          >
            <mode.icon size={16} className={searchMode === mode.id ? "text-cyan-400" : ""} />
            <span className="text-xs font-bold mt-1 uppercase tracking-wider">{mode.label}</span>
            <span className="text-[10px] opacity-60 font-medium">{mode.desc}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-lg relative group ${
              msg.type === "user"
                ? "ml-auto bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-medium"
                : "bg-zinc-900/80 border border-white/10 text-gray-200"
            }`}
          >
            {msg.image && (
              <img src={msg.image} alt="User upload" className="max-w-[150px] rounded-lg mb-2 border border-white/20" />
            )}
            <p className="text-sm leading-relaxed">{msg.text}</p>

            <div className="flex items-center gap-2 mt-3">
              {/* Play Button */}
              {msg.type === "ai" && msg.clip_start !== undefined && msg.clip_start !== null && (
                <button
                  className="flex items-center gap-2 text-[10px] font-bold bg-white/10 hover:bg-cyan-400 hover:text-black py-1 px-2.5 rounded-full transition-all border border-white/10"
                  onClick={() => playClip(msg.clip_start, msg.clip_end)}
                >
                  <span>▶</span> PLAY MATCH
                </button>
              )}

              {/* Speak Button */}
              {msg.type === "ai" && (
                <button
                  className={`flex items-center gap-2 text-[10px] font-bold py-1 px-2.5 rounded-full transition-all border ${
                    speakingId === msg.id 
                      ? "bg-cyan-400 text-black border-cyan-400 animate-pulse" 
                      : "bg-white/10 border-white/10 text-gray-400 hover:text-white hover:bg-white/20"
                  }`}
                  onClick={() => handleSpeak(msg.text, msg.id)}
                  title="Listen to response"
                >
                  <Mic size={12} />
                  <span>{speakingId === msg.id ? "SPEAKING..." : "SPEAK"}</span>
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && <LoadingScanner />}
      </div>

      {/* Image Preview Area */}
      {previewUrl && (
        <div className="px-4 py-2 border-t border-white/10 flex items-center gap-3 bg-cyan-400/5 animate-in fade-in slide-in-from-bottom-2">
          <div className="relative group">
            <img src={previewUrl} className="w-12 h-12 rounded-lg object-cover border border-cyan-400/50 shadow-lg" alt="preview" />
            <button 
              onClick={clearFile}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:scale-110 transition shadow-lg"
            >
              <X size={12} />
            </button>
          </div>
          <p className="text-xs text-cyan-400 font-medium italic">Image ready for visual search...</p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-zinc-900/50">
        <div className="flex gap-3 bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner group focus-within:border-cyan-400/50 transition-all">
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              searchMode === "image" 
                ? "Add extra context (optional)..." 
                : searchMode === "deep"
                ? "Enter detailed tracing query..."
                : "Describe an event or person..."
            }
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-500"
          />

          <div className="flex items-center gap-1 pr-1">
            {searchMode === "image" && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition"
              >
                <ImageIcon size={20} />
              </button>
            )}
            
            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && !selectedFile)}
              className="p-2.5 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
            >
              <Search size={18} />
            </button>
          </div>
        </div>
        
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}