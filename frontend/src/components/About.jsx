export default function About() {
  return (
    <section className="relative w-full overflow-hidden bg-[#0a0a0f] px-6 py-24 text-[#e4e1e9]">

      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.12), rgba(0,0,0,0.12) 1px, transparent 1px, transparent 2px)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-16 border-b border-[#00d4ff]/10 pb-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00d4ff] mb-3">
            SYSTEM PIPELINE
          </div>

          <h2
            className="text-4xl md:text-6xl font-black tracking-tighter text-white"
            style={{ textShadow: "2px 0 #ea0212, -2px 0 #00d4ff" }}
          >
            HOW IT WORKS
          </h2>

          <p className="mt-4 max-w-2xl text-sm text-slate-400">
            End-to-end intelligence pipeline transforming raw surveillance feeds into actionable insights.
          </p>
        </div>

        {/* Pipeline Grid */}
        <div className="grid md:grid-cols-3 border border-[#00d4ff]/10 bg-[#0e0e13]">

          {/* Stage 1 */}
          <div className="p-8 border-b md:border-b-0 md:border-r border-[#00d4ff]/10 hover:bg-white/[0.03] transition">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#00d4ff] font-bold">
              Stage 01
            </div>

            <h3 className="mt-4 text-xl font-black text-white">
              VECTOR INDEXING
            </h3>

            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Video frames are decomposed and encoded into high-dimensional vectors,
              enabling semantic understanding across massive datasets.
            </p>

            <div className="mt-6 text-[10px] tracking-widest text-slate-500 font-mono">
              MODULE_ID: VDB_CORE_01
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-8 border-b md:border-b-0 md:border-r border-[#00d4ff]/10 hover:bg-white/[0.03] transition">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#00d4ff] font-bold">
              Stage 02
            </div>

            <h3 className="mt-4 text-xl font-black text-white">
              SEMANTIC QUERY ENGINE
            </h3>

            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Natural language inputs are mapped against embeddings using VLMs,
              enabling precise retrieval from complex video streams.
            </p>

            <div className="mt-6 text-[10px] tracking-widest text-slate-500 font-mono">
              MODULE_ID: NLP_MATCH_02
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-8 hover:bg-white/[0.03] transition">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#00d4ff] font-bold">
              Output
            </div>

            <h3 className="mt-4 text-xl font-black text-white">
              REAL-TIME INTELLIGENCE
            </h3>

            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Relevant clips are surfaced instantly with timestamps, anomaly detection,
              and automated alert generation for rapid decision-making.
            </p>

            <div className="mt-6 text-[10px] tracking-widest text-slate-500 font-mono">
              STATUS: LIVE_RESPONSE_ACTIVE
            </div>
          </div>
        </div>

        {/* Bottom terminal strip */}
        <div className="mt-10 flex flex-col md:flex-row justify-between gap-4 text-[10px] font-mono tracking-widest text-slate-600">
          <div>PIPELINE_LATENCY: &lt; 20ms</div>
          <div>VECTOR_DIMENSIONS: 1536</div>
          <div>STREAM_PROCESSING: ACTIVE</div>
        </div>
      </div>
    </section>
  );
}