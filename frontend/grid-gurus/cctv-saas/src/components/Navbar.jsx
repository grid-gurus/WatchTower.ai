export default function Navbar() {
  return (
    <div className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">

        {/* Logo */}
        <h1 className="text-xl font-bold text-cyan-400">
          CCTV AI
        </h1>

        {/* Links */}
        <div className="flex gap-6 text-sm text-gray-300">
          <a href="#" className="hover:text-white">Features</a>
          <a href="#" className="hover:text-white">Pricing</a>
          <a href="#" className="hover:text-white">Tripwires</a>
        </div>

        {/* Auth Buttons */}
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-white/20 rounded-lg hover:border-cyan-400">
            Login
          </button>
          <button className="px-4 py-2 bg-cyan-500 text-black rounded-lg font-semibold hover:bg-cyan-400">
            Sign Up
          </button>
        </div>

      </div>
    </div>
  )
}