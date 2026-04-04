import { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

export default function CreateAlert() {
    const [condition, setCondition] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!condition.trim()) return;

        try {
            setLoading(true);

            await axios.post("http://localhost:8000/api/alerts/setup", {
                condition,
            });

            alert("✅ Alert created successfully!");
            setCondition("");

        } catch (err) {
            console.error(err);
            alert("❌ Failed to create alert");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">

            {/* 🔥 Grid */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                }}
            />

            {/* Scanlines */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    background:
                        "repeating-linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)",
                }}
            />

            <Navbar />

            {/* Content */}
            <div className="relative z-10 flex justify-center items-center pt-28 px-4">

                <div className="w-full max-w-2xl border border-cyan-400/20 bg-[#0a0a0f] p-8">

                    {/* Header */}
                    <div className="mb-6">
                        <p className="text-[10px] tracking-[0.35em] text-cyan-400">
                            ALERT CONFIGURATION
                        </p>

                        <h2 className="text-2xl font-bold text-white mt-2">
                            CREATE SURVEILLANCE RULE
                        </h2>

                        <p className="text-sm text-gray-400 mt-2">
                            Define a natural language condition to trigger automated alerts
                        </p>
                    </div>

                    {/* Input */}
                    <div className="border border-white/10 bg-[#0e0e13] p-4">
                        <textarea
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                            placeholder="e.g. Person loitering near restricted area for more than 30 seconds"
                            className="w-full h-32 bg-transparent text-white placeholder:text-gray-500 outline-none text-sm tracking-wide resize-none"
                        />
                    </div>

                    {/* Action */}
                    <button
                        onClick={handleCreate}
                        className="mt-6 w-full border border-cyan-400 bg-[#00d4ff] text-black font-bold py-3 tracking-widest hover:invert transition active:scale-95"
                    >
                        {loading ? "CREATING RULE..." : "DEPLOY ALERT"}
                    </button>

                    {/* Footer */}
                    <div className="mt-6 text-[10px] text-slate-600 font-mono tracking-widest text-center">
                        AI_RULE_ENGINE • REALTIME_MONITORING • ACTIVE_PIPELINE
                    </div>

                </div>
            </div>
        </div>
    );
}