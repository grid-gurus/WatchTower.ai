import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 pt-24 bg-[#050816] overflow-hidden">

      {/* 🔥 Grid Background */}
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

      {/* Glow */}
      <div className="absolute top-[-120px] left-[-120px] w-[400px] h-[400px] bg-cyan-400 opacity-10 blur-[180px] rounded-full"></div>
      <div className="absolute bottom-[-120px] right-[-120px] w-[400px] h-[400px] bg-purple-500 opacity-10 blur-[180px] rounded-full"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">

        {/* 🔥 Heading */}
        <div className="mb-12 text-center">
          <p className="text-[10px] tracking-[0.35em] text-cyan-400">
            ACCESS PORTAL
          </p>

          <h1
            className="text-4xl md:text-6xl font-black text-white tracking-tighter"
            style={{ textShadow: "2px 0 #ea0212, -2px 0 #00d4ff" }}
          >
            CCTV AI SYSTEM
          </h1>

          <p className="mt-4 text-gray-400 text-sm max-w-md">
            Select your access level to continue into the surveillance intelligence platform
          </p>
        </div>

        {/* 🔥 Cards */}
        <div className="flex flex-col md:flex-row gap-8">

          {/* LOGIN */}
          <div className="border border-cyan-400/20 bg-[#0a0a0f] p-8 w-[320px] transition hover:border-cyan-400/50">

            <p className="text-[10px] tracking-[0.3em] text-cyan-400 mb-2">
              EXISTING USER
            </p>

            <h2 className="text-xl font-bold text-white mb-3">
              LOGIN ACCESS
            </h2>

            <p className="text-sm text-gray-400 mb-6">
              Authenticate and continue monitoring your surveillance feeds.
            </p>

            <Link to="/login">
              <button className="w-full border border-cyan-400 bg-[#00d4ff] text-black font-bold py-3 tracking-widest hover:invert transition">
                ENTER SYSTEM
              </button>
            </Link>
          </div>

          {/* SIGNUP */}
          <div className="border border-purple-400/20 bg-[#0a0a0f] p-8 w-[320px] transition hover:border-purple-400/50">

            <p className="text-[10px] tracking-[0.3em] text-purple-400 mb-2">
              NEW USER
            </p>

            <h2 className="text-xl font-bold text-white mb-3">
              CREATE ACCESS
            </h2>

            <p className="text-sm text-gray-400 mb-6">
              Register and activate AI-powered surveillance intelligence.
            </p>

            <Link to="/signup">
              <button className="w-full border border-purple-400 bg-purple-500 text-white font-bold py-3 tracking-widest hover:invert transition">
                INITIALIZE
              </button>
            </Link>
          </div>

        </div>

        {/* 🔻 Bottom system text */}
        <div className="mt-12 text-[10px] text-slate-600 font-mono tracking-widest text-center">
          AUTH_GATEWAY • SECURE_CHANNEL • VIDEO-RAG_ENABLED
        </div>
      </div>
    </div>
  );
}
