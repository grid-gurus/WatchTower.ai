import { useState } from "react";
import Navbar from "../components/Navbar";
import TripwireTable from "../components/TripWireTable";

export default function TripWires() {
  const [input, setInput] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [message, setMessage] = useState(null); // 🔥 for popup message

  const telegramHandle = "@your_handle"; // later from backend

  const handleAdd = async () => {
    if (!input.trim()) return;

    try {
      // 🔥 POST request to backend
      const res = await fetch("http://127.0.0.1:8000/api/alerts/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          condition: input,
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed");

      // ✅ Add alert to UI
      const newAlert = {
        id: Date.now(),
        text: input,
        status: "active",
      };

      setAlerts((prev) => [newAlert, ...prev]);
      setInput("");

      // 🎉 Success message
      setMessage({ type: "success", text: "🚀 Alert added successfully!" });

    } catch (err) {
      console.error(err);

      // ❌ Error message
      setMessage({ type: "error", text: "❌ Failed to add alert" });
    }

    // ⏳ Auto hide message
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#020617] to-[#000000] text-white overflow-x-hidden relative">

      {/* Glow Background */}
      <div className="fixed top-[-120px] left-[-120px] w-[500px] h-[500px] bg-cyan-400 opacity-15 blur-[200px] rounded-full"></div>
      <div className="fixed bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-purple-500 opacity-15 blur-[200px] rounded-full"></div>
      <div className="fixed top-[40%] left-[30%] w-[300px] h-[300px] bg-indigo-500 opacity-10 blur-[180px] rounded-full"></div>

      {/* Navbar */}
      <Navbar />

      {/* 🔔 Toast Message */}
      {message && (
        <div className={`fixed top-6 right-6 px-6 py-3 rounded-xl shadow-lg backdrop-blur-md border 
          ${message.type === "success"
            ? "bg-green-500/20 border-green-400 text-green-300"
            : "bg-red-500/20 border-red-400 text-red-300"}`}>
          {message.text}
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto pt-24 px-4">

        {/* Heading */}
        <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          🚨 Tripwire Alerts
        </h2>

        {/* Input Section */}
        <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 mb-8">
          <div className="bg-black rounded-xl p-6 flex gap-4">

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What should we watch out for?"
              className="flex-1 p-3 rounded-lg bg-white/[0.05] border border-white/10 outline-none focus:border-cyan-400"
            />

            <button
              onClick={handleAdd}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold hover:scale-105 transition"
            >
              Add
            </button>

          </div>
        </div>

        {/* Alerts Table */}
        <TripwireTable
          alerts={alerts}
          telegramHandle={telegramHandle}
        />

      </div>
    </div>
  );
}