import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function MyProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get("http://localhost:8000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center text-cyan-400 font-mono tracking-widest">
        INITIALIZING USER NODE...
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center text-red-400 font-mono tracking-widest">
        USER NODE NOT FOUND
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">

      {/* Grid */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Scanlines */}
      <div className="absolute inset-0 opacity-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)",
        }}
      />

      <Navbar />

      <div className="relative z-10 max-w-4xl mx-auto pt-28 px-4">

        {/* HEADER */}
        <div className="mb-12 text-center">
          <p className="text-[10px] tracking-[0.4em] text-cyan-400">
            USER PROFILE
          </p>

          <h2
            className="text-4xl font-black mt-3"
            style={{ textShadow: "2px 0 #ea0212, -2px 0 #00d4ff" }}
          >
            SURVEILLANCE IDENTITY
          </h2>
        </div>

        {/* MAIN PANEL */}
        <div className="border border-cyan-400/20 bg-[#0a0a0f] p-8 shadow-[0_0_40px_rgba(0,212,255,0.05)]">

          {/* AVATAR */}
          <div className="flex flex-col items-center border-b border-cyan-400/10 pb-8">

            {user.profile_picture && user.profile_picture.trim() !== "" ? (
              <img
                src={user.profile_picture}
                alt="profile"
                className="w-28 h-28 object-cover border border-cyan-400 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              />
            ) : (
              <div className="w-28 h-28 border border-cyan-400 flex items-center justify-center text-4xl font-bold text-cyan-400 shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                {user.full_name?.[0]?.toUpperCase() || "U"}
              </div>
            )}

            <h3 className="mt-5 text-2xl font-bold tracking-wide">
              {user.full_name || "UNKNOWN USER"}
            </h3>

            <p className="text-xs text-slate-500 tracking-[0.3em] mt-2">
              WATCHTOWER OPERATOR
            </p>
          </div>

          {/* INFO */}
          <div className="mt-8 space-y-5 text-sm">

            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-slate-500 tracking-wider">EMAIL</span>
              <span className="text-white">{user.email}</span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-slate-500 tracking-wider">TELEGRAM</span>
              <span className="text-cyan-400 font-mono">
                {user.telegram_handle || "@not_set"}
              </span>
            </div>

          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 gap-4 mt-8">

            <div className="border border-cyan-400/10 p-5 text-center hover:border-cyan-400/40 transition">
              <p className="text-xs text-slate-500">STATUS</p>
              <p className="text-xl font-bold text-cyan-400">
                {user.is_active ? "ACTIVE" : "INACTIVE"}
              </p>
            </div>

            <div className="border border-purple-400/10 p-5 text-center hover:border-purple-400/40 transition">
              <p className="text-xs text-slate-500">JOINED</p>
              <p className="text-sm text-purple-400">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="border border-white/10 p-5 text-center col-span-2">
              <p className="text-xs text-slate-500">LAST UPLOAD</p>
              <p className="text-sm text-purple-400">
                {user.lastUpload || "N/A"}
              </p>
            </div>

          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 mt-8">

            <button
              onClick={() => navigate("/me/edit")}
              className="flex-1 border border-cyan-400 bg-[#00d4ff] text-black font-bold py-3 tracking-widest hover:invert transition active:scale-95"
            >
              EDIT PROFILE
            </button>

            <button
              onClick={() => navigate("/alerts/create")}
              className="flex-1 border border-purple-400 text-purple-400 py-3 tracking-widest hover:bg-purple-400/10 transition active:scale-95"
            >
              CREATE ALERT
            </button>

          </div>

          {/* FOOTER */}
          <div className="mt-8 text-[10px] text-slate-600 font-mono tracking-widest text-center">
            USER_NODE • VERIFIED • AI_MONITORING_ENABLED
          </div>

        </div>
      </div>
    </div>
  );
}