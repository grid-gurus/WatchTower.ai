export default function About() {
  return (
    <div className="py-20 px-6 bg-black text-white">
      <h2 className="text-4xl font-bold text-center mb-12">
        How It Works
      </h2>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">

        <div className="p-6 border border-white/10 rounded-xl backdrop-blur bg-white/5 hover:border-cyan-400 transition">
          <h3 className="text-xl font-semibold mb-2 text-cyan-400">
            Stage 1
          </h3>
          <p>Video is processed and indexed into a Vector Database.</p>
        </div>

        <div className="p-6 border border-white/10 rounded-xl backdrop-blur bg-white/5 hover:border-cyan-400 transition">
          <h3 className="text-xl font-semibold mb-2 text-cyan-400">
            Stage 2
          </h3>
          <p>Natural language queries are matched against video embeddings.</p>
        </div>

        <div className="p-6 border border-white/10 rounded-xl backdrop-blur bg-white/5 hover:border-cyan-400 transition">
          <h3 className="text-xl font-semibold mb-2 text-cyan-400">
            Result
          </h3>
          <p>Instant clip retrieval + real-time alert triggering.</p>
        </div>

      </div>
    </div>
  )
}