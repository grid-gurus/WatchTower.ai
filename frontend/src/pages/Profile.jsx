import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [phone, setPhone] = useState("");

  const handleSave = () => {
    console.log({ email, telegram, phone });
    alert("Profile updated (connect backend later)");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#000000] via-[#020617] to-[#000000] text-white overflow-hidden">

      {/* 🌌 Subtle Glow (reduced brightness for darker feel) */}
      <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] bg-cyan-400 opacity-15 blur-[200px] rounded-full"></div>
      <div className="absolute bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-purple-500 opacity-15 blur-[200px] rounded-full"></div>
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-indigo-500 opacity-10 blur-[180px] rounded-full"></div>

      {/* Navbar (optional) */}
      {/* <Navbar /> */}

      <div className="relative z-10 flex justify-center items-center py-24 px-4">

        <div className="w-full max-w-xl p-[1.5px] rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500">

          <div className="bg-black rounded-xl p-8">

            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Profile Settings
            </h2>

            <div className="mb-6">
              <label className="text-sm text-gray-400">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@gmail.com"
                className="w-full mt-1 p-3 rounded-lg bg-white/[0.05] border border-white/10 outline-none focus:border-cyan-400"
              />
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-400">
                Telegram Handle
              </label>
              <input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@your_handle"
                className="w-full mt-1 p-3 rounded-lg bg-white/[0.05] border border-white/10 outline-none focus:border-cyan-400"
              />
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-400">
                Notification Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full mt-1 p-3 rounded-lg bg-white/[0.05] border border-white/10 outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold hover:scale-[1.02] transition"
            >
              Save Changes
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}