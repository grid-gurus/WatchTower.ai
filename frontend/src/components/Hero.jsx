import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* bg-gradient-to-br from-black via-zinc-900 to-black text-white */}
      {/* Glow Effects */}
      {/* <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] bg-cyan-500 opacity-20 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-purple-500 opacity-20 blur-[150px] rounded-full"></div>
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-blue-500 opacity-10 blur-[120px] rounded-full"></div> */}

      {/* Video */}
      {/* <video autoPlay loop muted className="absolute w-full h-full object-cover opacity-30">
        <source src="/cctv.mp4" type="video/mp4" />
      </video> */}

      {/* Overlay */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/90"></div> */}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">

        <div className="mb-4 px-4 py-1 border border-cyan-400 text-cyan-400 rounded-full text-sm">
          AI-Powered Surveillance
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          Query the Unseen
        </h1>

        <p className="mt-4 text-xl text-gray-300 max-w-2xl">
          Natural Language CCTV Intelligence powered by Video-RAG.
        </p>

        <div className="mt-8 flex gap-4">

          {/* Get Started */}
          <Link to="/signup">
            <div className="p-[1.5px] rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500">
              <button className="px-6 py-3 rounded-lg bg-black font-semibold transition-all duration-300 group">
                <span className="text-white group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent">
                  Get Started
                </span>
              </button>
            </div>
          </Link>

          {/* Live Demo */}
          <Link to="/uploaddropzone">
            <div className="p-[1.5px] rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500">
              <button className="px-6 py-3 rounded-lg bg-black font-semibold transition-all duration-300 group">
                <span className="text-white group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent">
                  Live Demo
                </span>
              </button>
            </div>
          </Link>

        </div>

      </div>
    </div>
  )
}