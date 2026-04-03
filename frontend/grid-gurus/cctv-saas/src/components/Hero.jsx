export default function Hero() {
  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden">

      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        className="absolute w-full h-full object-cover opacity-30"
      >
        <source src="/cctv.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">

        {/* 🔥 Badge */}
        <div className="mb-4 px-4 py-1 border border-cyan-400 text-cyan-400 rounded-full text-sm">
          AI-Powered Surveillance
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
          Query the Unseen
        </h1>

        <p className="mt-4 text-xl text-gray-300 max-w-2xl">
          Natural Language CCTV Intelligence powered by Video-RAG.
          Ask questions. Get answers. Instantly.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex gap-4">
          <button className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition shadow-lg shadow-cyan-500/20">
            Get Started
          </button>

          <button className="px-6 py-3 border border-white/30 hover:border-cyan-400 rounded-lg transition">
            Live Demo
          </button>
        </div>

      </div>
    </div>
  )
}