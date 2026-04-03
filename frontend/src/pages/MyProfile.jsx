import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function MyProfile() {
    const navigate = useNavigate();

    // 🔥 Dummy data (later from backend GET /api/user/me)
    const user = {
        email: "user@example.com",
        phone: "+91 9876543210",
        telegram: "@your_handle",
        uploads: 3,
        lastUpload: "2026-03-28",
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white relative overflow-hidden">

            <Navbar />

            {/* 🌌 Glow Background */}
            <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] bg-cyan-500 opacity-10 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-purple-500 opacity-10 blur-[150px] rounded-full"></div>

            <div className="relative z-10 max-w-4xl mx-auto pt-28 px-4">

                {/* 🔥 Heading */}
                <h2 className="text-4xl font-bold text-center mb-10 pb-5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                    My Profile
                </h2>

                {/* 📊 Profile Card */}
                <div className="p-[4px] rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500">
                    <div className="bg-black rounded-2xl p-8 space-y-6">

                        {/* Email */}
                        <div className="flex justify-between border-b border-white/10 pb-4">
                            <span className="text-gray-400">Email</span>
                            <span className="text-white">{user.email}</span>
                        </div>

                        {/* Phone */}
                        <div className="flex justify-between border-b border-white/10 pb-4">
                            <span className="text-gray-400">Phone</span>
                            <span className="text-white">{user.phone}</span>
                        </div>

                        {/* Telegram */}
                        <div className="flex justify-between border-b border-white/10 pb-4">
                            <span className="text-gray-400">Telegram</span>
                            <span className="text-cyan-400">{user.telegram}</span>
                        </div>

                        {/* 📈 Stats */}
                        <div className="grid grid-cols-2 gap-4 pt-4">

                            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                                <p className="text-gray-400 text-sm">Videos Uploaded</p>
                                <p className="text-2xl font-bold text-cyan-400">
                                    {user.uploads}
                                </p>
                            </div>

                            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                                <p className="text-gray-400 text-sm">Last Upload</p>
                                <p className="text-lg font-semibold text-purple-400">
                                    {user.lastUpload}
                                </p>
                            </div>

                        </div>

                        {/* 🔘 Buttons Section */}
                        <div className="flex gap-4 mt-6">

                            {/* Update Profile */}
                            <button
                                onClick={() => navigate("/me/edit")}
                                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold hover:scale-105 transition"
                            >
                                Update Profile
                            </button>

                            {/* 🔥 Create Alert */}
                            <button
                                onClick={() => navigate("/alerts/create")}
                                className="flex-1 py-3 rounded-lg border border-cyan-400/40 text-cyan-400 font-semibold hover:bg-cyan-400/10 transition"
                            >
                                + Create Alert
                            </button>

                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}