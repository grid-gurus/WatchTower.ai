import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0f] text-[#e4e1e9]">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-20"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)",
        }}
      />

      {/* Glow / focal background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute left-1/2 top-[45%] h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20" />
        <div className="absolute left-1/2 top-[45%] h-[10rem] w-[10rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20" />
        <div className="absolute left-1/2 top-[45%] h-[4rem] w-[4rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-lg" />
      </div>

      <div className="relative z-20 flex min-h-screen flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-[#00d4ff]/10 bg-[#131318]/80 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-8">
            <span className="text-xl font-black tracking-tighter text-[#00d4ff]">
              WATCHTOWER AI
            </span>

            <nav className="hidden gap-6 md:flex">
              <a
                href="#"
                className="border-b border-[#00d4ff] pb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#00d4ff]"
              >
                Home
              </a>
              <a
                href="#"
                className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-[#00d4ff]"
              >
                Features
              </a>
              <a
                href="#"
                className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-[#00d4ff]"
              >
                Solutions
              </a>
            </nav>
          </div>

          <Link to="/signup">
            <button className="bg-[#00d4ff] px-6 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#001f27] transition-all duration-150 hover:invert active:scale-95">
              Request Access
            </button>
          </Link>
        </header>

        {/* Hero */}
        <main className="relative flex flex-1 items-center justify-center px-6 py-16">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 border border-[#00d4ff]/30 bg-[#00d4ff]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#00d4ff]">
              <span className="text-xs">security</span>
              System Status: Active_Operational
            </div>

            <h1
              className="text-5xl font-black leading-none tracking-tighter text-white md:text-8xl"
              style={{
                textShadow: "2px 0 #ea0212, -2px 0 #00d4ff",
              }}
            >
              THE SYNTHETIC EYE:
              <br />
              <span className="text-[#00d4ff]">
                UNMATCHED TACTICAL INTELLIGENCE
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-slate-400">
              Natural Language CCTV Intelligence powered by Video-RAG. Query footage,
              track behavior, and surface critical incidents with precision.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 md:flex-row">
              <Link to="/signup">
                <button className="bg-[#00d4ff] px-10 py-4 text-sm font-black uppercase tracking-[0.2em] text-[#001f27] transition-all duration-150 hover:invert active:scale-95">
                  Request Access
                </button>
              </Link>

              <Link to="/uploaddropzone">
                <button className="border border-[#3c494e] bg-transparent px-10 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition-all duration-150 hover:bg-white/5 active:scale-95">
                  View Protocols
                </button>
              </Link>
            </div>
          </div>

          {/* Corner terminal details */}
          <div className="pointer-events-none absolute bottom-10 left-10 hidden space-y-1 font-mono text-[10px] tracking-widest text-slate-600 xl:block">
            <div>LAT: 37.7749° N</div>
            <div>LONG: 122.4194° W</div>
            <div>V-DB SYNC: 100%</div>
          </div>

          <div className="pointer-events-none absolute bottom-10 right-10 hidden space-y-1 text-right font-mono text-[10px] tracking-widest text-slate-600 xl:block">
            <div>ENCRYPTION: AES-256-GCM</div>
            <div>SIGNAL: ENCRYPTED_TUNNEL</div>
            <div>UPTIME: 99.9999%</div>
          </div>
        </main>
      </div>
    </section>
  );
}