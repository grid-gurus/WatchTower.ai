import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAppStore from "../store/useAppStore";

export default function UploadDropzone() {
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const setVideoUrl = useAppStore((state) => state.setVideoUrl);

    const checkLoginAndUpload = () => {
        const token = localStorage.getItem("token");

        if (!token) {
            setMessage("🔒 Redirecting to login...");
            setTimeout(() => {
                navigate("/login");
            }, 800);
            return;
        }

        fileInputRef.current?.click();
    };

    const uploadFile = async (file) => {
        if (!file.type.startsWith("video/")) {
            setMessage("⚠️ Only video files are allowed");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            setLoading(true);
            setMessage("Uploading video... 🚀");

            await axios.post("http://localhost:8000/api/media/upload", formData);

            const localUrl = URL.createObjectURL(file);
            setVideoUrl(localUrl);

            pollStatus();
        } catch (err) {
            console.error(err);
            setMessage("❌ Upload failed. Try again.");
            setLoading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);

        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const file = e.dataTransfer.files[0];
        if (!file) return;

        uploadFile(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        uploadFile(file);
    };

    const pollStatus = async () => {
        const interval = setInterval(async () => {
            try {
                const res = await axios.get("http://localhost:8000/api/media/status");

                if (res.data.status === "completed") {
                    clearInterval(interval);
                    setLoading(false);
                    setMessage("✅ Video processed successfully!");
                } else if (res.data.status?.startsWith("error")) {
                    clearInterval(interval);
                    setLoading(false);
                    setMessage(`❌ ${res.data.status}`);
                }
            } catch (err) {
                console.error(err);
            }
        }, 3000);
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-[#050816] relative overflow-hidden">

            {/* 🔥 Grid */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
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

            {/* Upload Box */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`relative z-10 w-full max-w-xl border ${dragging ? "border-cyan-400" : "border-cyan-400/20"
                    } bg-[#0a0a0f] p-10 text-center transition`}
            >

                {/* Header */}
                <p className="text-[10px] tracking-[0.35em] text-cyan-400 mb-2">
                    MEDIA INGESTION
                </p>

                <h2 className="text-2xl font-bold text-white mb-4">
                    VIDEO UPLOAD MODULE
                </h2>

                <p className="text-sm text-gray-400 mb-8">
                    Drag & drop surveillance footage or initialize upload
                </p>

                <input
                    type="file"
                    accept="video/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Dropzone */}
                <div
                    className={`border-2 border-dashed px-6 py-10 transition ${dragging
                            ? "border-cyan-400 bg-cyan-400/10"
                            : "border-white/10"
                        }`}
                >
                    <div className="text-4xl mb-4">🎬</div>

                    {loading ? (
                        <div>
                            <p className="text-cyan-400 font-mono animate-pulse">
                                PROCESSING VIDEO...
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                INDEXING FRAMES → GENERATING EMBEDDINGS → READYING QUERY
                            </p>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={checkLoginAndUpload}
                                className="mt-4 border border-cyan-400 bg-[#00d4ff] text-black font-bold px-6 py-3 tracking-widest hover:invert transition"
                            >
                                INITIATE UPLOAD
                            </button>

                            <p className="mt-4 text-xs text-gray-500">
                                AUTH REQUIRED • SECURE CHANNEL
                            </p>
                        </>
                    )}
                </div>

                {/* Message */}
                {message && (
                    <div className="mt-6 border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-300">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}