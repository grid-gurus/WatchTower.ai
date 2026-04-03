import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="fixed top-0 w-full z-50">

      {/* 🌈 Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-900 to-black opacity-95 backdrop-blur-xl"></div>

      {/* ✨ Glow Line */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-purple-500 opacity-40"></div>

      <div className="relative max-w-7xl mx-auto flex items-center px-8 py-4">

        {/* 🔥 LEFT: Logo */}
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          CCTV AI
        </h1>

        {/* 🔗 CENTER: Navigation */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex gap-12 text-lg font-semibold tracking-wide">

          <Link
            to="/"
            className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent hover:from-cyan-400 hover:to-purple-500 transition"
          >
            Home
          </Link>

          <Link
            to="/dashboard"
            className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent hover:from-cyan-400 hover:to-purple-500 transition"
          >
            Dashboard
          </Link>

          <Link
            to="/tripwires"
            className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent hover:from-cyan-400 hover:to-purple-500 transition"
          >
            Tripwires
          </Link>

        </div>

        {/* 🔘 RIGHT: Buttons + Profile */}
        <div className="ml-auto flex items-center gap-4">

          {/* Login */}
          <Link to="/login">
            <div className="p-[1.5px] rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500">
              <button className="px-5 py-2 rounded-lg bg-black font-medium group">
                <span className="text-white group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent">
                  Login
                </span>
              </button>
            </div>
          </Link>

          {/* Sign Up */}
          <Link to="/signup">
            <div className="p-[1.5px] rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500">
              <button className="px-5 py-2 rounded-lg bg-black font-medium group">
                <span className="text-white group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent">
                  Sign Up
                </span>
              </button>
            </div>
          </Link>

          {/* 👤 Profile Avatar */}
          <Link to="/me">
            <div className="p-[1.5px] rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-105 transition">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-semibold">
                U
              </div>
            </div>
          </Link>

        </div>

      </div>
    </div>
  );
}