export default function About() {
  return (
    <div className="relative py-24 px-6 overflow-hidden">
      {/* bg-gradient-to-br from-black via-zinc-900 to-black text-white */}

      {/* 🌌 Same Glow as Hero (soft) */}
      {/* <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] bg-cyan-500 opacity-10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-purple-500 opacity-10 blur-[150px] rounded-full"></div>
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-blue-500 opacity-5 blur-[120px] rounded-full"></div> */}

      <div className="relative z-10">

        {/* 🔥 Heading */}
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          How It Works
        </h2>

        {/* Cards */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">

          {/* Stage 1 */}
          <div className="p-6 rounded-xl bg-white/[0.03] backdrop-blur border border-white/10 hover:border-purple-400 transition duration-300">
            <h3 className="text-xl font-semibold mb-3 text-cyan-400">
              Stage 1
            </h3>
            <p className="text-gray-300">
              Video is processed and indexed into a Vector Database for semantic understanding.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="p-6 rounded-xl bg-white/[0.03] backdrop-blur border border-white/10 hover:border-purple-400 transition duration-300">
            <h3 className="text-xl font-semibold mb-3 text-cyan-400">
              Stage 2
            </h3>
            <p className="text-gray-300">
              Natural language queries are matched against video embeddings using AI.
            </p>
          </div>

          {/* Result */}
          <div className="p-6 rounded-xl bg-white/[0.03] backdrop-blur border border-white/10 hover:border-purple-400 transition duration-300">
            <h3 className="text-xl font-semibold mb-3 text-cyan-400">
              Result
            </h3>
            <p className="text-gray-300">
              Instant clip retrieval with precise timestamps and real-time alert triggering.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}