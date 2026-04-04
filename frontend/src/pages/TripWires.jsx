import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import TripwireTable from "../components/TripWireTable";
import useToastStore from "../store/useToastStore";

export default function TripWires() {
  const [input, setInput] = useState("");
  const [alerts, setAlerts] = useState([]);

  const telegramHandle = "@your_handle";
  const { addToast } = useToastStore();

  // 🔌 WebSocket
  useEffect(() => {
    console.log("Connecting to WatchTower WebSocket...");
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/alerts");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "NEW_ALERT") {
        addToast(
          `🚨 AI ALERT: ${data.rule} - ${data.ai_analysis}`,
          "success",
          8000
        );
      }
    };

    socket.onerror = (error) => console.error("WebSocket Error:", error);
    socket.onclose = () => console.log("WebSocket Closed");

    return () => socket.close();
  }, []);

  const handleAdd = async () => {
    if (!input.trim()) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/api/alerts/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition: input }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      const newAlert = {
        id: Date.now(),
        text: input,
        status: "active",
      };

      setAlerts((prev) => [newAlert, ...prev]);
      setInput("");

      addToast("🚀 Alert deployed successfully!", "success");

    } catch (err) {
      console.error(err);
      addToast("❌ Failed to deploy alert", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">

      {/* 🔥 GRID BACKGROUND */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* 🔥 SCANLINES */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)",
        }}
      />

      <Navbar />

      <div className="relative z-10 max-w-5xl mx-auto pt-24 px-4">

        {/* 🔥 HEADER */}
        <div className="mb-12 text-center">
          <p className="text-[10px] tracking-[0.4em] text-cyan-400 animate-pulse">
            ALERT ENGINE
          </p>

          <h2
            className="text-5xl font-black mt-3"
            style={{ textShadow: "2px 0 #ea0212, -2px 0 #00d4ff" }}
          >
            TRIPWIRE SYSTEM
          </h2>

          <p className="text-sm text-gray-400 mt-3">
            Configure AI-based surveillance triggers in real-time
          </p>
        </div>

        {/* 🔥 INPUT PANEL */}
        <div className="relative group mb-10">

          {/* glow border */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-20 blur group-hover:opacity-40 transition"></div>

          <div className="relative border border-cyan-400/20 bg-[#0a0a0f]/80 backdrop-blur-md p-6">

            <p className="text-[10px] tracking-[0.3em] text-cyan-400 mb-4">
              DEFINE RULE
            </p>

            <div className="flex gap-4">

              {/* 🔥 INPUT */}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Person loitering near restricted area"
                className="flex-1 bg-black/60 border border-white/10 px-4 py-3 text-sm text-white 
                         placeholder:text-gray-500 outline-none 
                         focus:border-cyan-400 focus:shadow-[0_0_10px_#00d4ff]"
              />

              {/* 🔥 BUTTON */}
              <button
                onClick={handleAdd}
                className="relative overflow-hidden border border-cyan-400 
                         bg-[#00d4ff] text-black font-bold px-6 tracking-widest 
                         transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span className="relative z-10">DEPLOY</span>

                {/* animated shine */}
                <span className="absolute inset-0 bg-white/20 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700"></span>
              </button>

            </div>

            <p className="text-xs text-gray-500 mt-3 tracking-wide">
              AI will monitor this condition across all active feeds
            </p>

          </div>
        </div>

        {/* 🔥 ALERTS TABLE (wrapped in card) */}
        <div className="relative group">

          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 opacity-20 blur group-hover:opacity-40 transition"></div>

          <div className="relative border border-purple-400/20 bg-[#0a0a0f]/80 backdrop-blur-md p-6">

            <div className="flex justify-between mb-4">
              <span className="text-[10px] tracking-[0.3em] text-purple-400">
                ACTIVE TRIPWIRES
              </span>
              <span className="text-green-400 text-xs animate-pulse">
                ● LIVE
              </span>
            </div>

            <TripwireTable
              alerts={alerts}
              telegramHandle={telegramHandle}
            />

          </div>
        </div>

        {/* 🔥 FOOTER */}
        <div className="mt-10 text-[10px] text-slate-600 font-mono tracking-widest text-center">
          ALERT_ENGINE • REALTIME_MONITORING • AI_TRIGGER_ACTIVE
        </div>

      </div>
    </div>
  );
}