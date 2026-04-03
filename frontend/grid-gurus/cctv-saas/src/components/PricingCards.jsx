export default function PricingCards() {
  return (
    <div className="py-20 px-6 bg-black text-white">
      <h2 className="text-4xl font-bold text-center mb-12">
        Pricing
      </h2>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">

        {/* Basic */}
        <div className="p-6 border border-white/10 rounded-xl bg-white/5">
          <h3 className="text-xl font-bold">Basic</h3>
          <p className="mt-2 text-gray-400">Free</p>
          <p className="mt-4">Upload local files</p>
        </div>

        {/* Pro */}
        <div className="p-6 border border-cyan-400 rounded-xl bg-white/5 shadow-lg shadow-cyan-500/20">
          <h3 className="text-xl font-bold text-cyan-400">Pro</h3>
          <p className="mt-2">$49/mo</p>
          <p className="mt-4">1 Live CCTV Stream</p>
        </div>

        {/* Enterprise */}
        <div className="p-6 border border-white/10 rounded-xl bg-white/5">
          <h3 className="text-xl font-bold">Enterprise</h3>
          <p className="mt-2">Contact Us</p>
          <p className="mt-4">Multi-camera + alerts</p>
        </div>

      </div>
    </div>
  )
}