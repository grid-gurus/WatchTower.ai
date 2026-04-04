export default function PricingCards() {
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
                        ACCESS PROTOCOLS
                    </div>

                    <h2
                        className="text-4xl md:text-6xl font-black tracking-tighter text-white"
                        style={{ textShadow: "2px 0 #ea0212, -2px 0 #00d4ff" }}
                    >
                        PRICING MATRIX
                    </h2>

                    <p className="mt-4 max-w-2xl text-sm text-slate-400">
                        Select an operational tier based on surveillance scale and intelligence requirements.
                    </p>
                </div>

                {/* Pricing grid */}
                <div className="grid md:grid-cols-3 border border-[#00d4ff]/10 bg-[#0e0e13]">

                    {/* BASIC */}
                    <div className="p-8 border-b md:border-b-0 md:border-r border-[#00d4ff]/10 hover:bg-white/[0.03] transition">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-[#00d4ff] font-bold">
                            Tier 01
                        </div>

                        <h3 className="mt-4 text-xl font-black text-white">
                            BASIC
                        </h3>

                        <div className="mt-4 text-3xl font-black text-slate-300">
                            FREE
                        </div>

                        <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                            Local file uploads with standard semantic indexing and query support.
                        </p>

                        <div className="mt-6 text-[10px] font-mono tracking-widest text-slate-500">
                            ACCESS_LEVEL: LOCAL_ONLY
                        </div>
                    </div>

                    {/* PRO (highlight) */}
                    <div className="p-8 border-b md:border-b-0 md:border-r border-[#00d4ff]/10 bg-[#00d4ff]/5 hover:bg-[#00d4ff]/10 transition">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-[#00d4ff] font-bold">
                            Tier 02
                        </div>

                        <h3 className="mt-4 text-xl font-black text-white">
                            PRO
                        </h3>

                        <div className="mt-4 text-3xl font-black text-[#00d4ff]">
                            $49/mo
                        </div>

                        <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                            Single live CCTV stream integration with real-time query and alert system.
                        </p>

                        <div className="mt-6 text-[10px] font-mono tracking-widest text-slate-400">
                            ACCESS_LEVEL: LIVE_STREAM_ENABLED
                        </div>

                        {/* Highlight badge */}
                        <div className="mt-6 inline-block border border-[#00d4ff] px-3 py-1 text-[10px] font-bold tracking-widest text-[#00d4ff]">
                            MOST USED
                        </div>
                    </div>

                    {/* ENTERPRISE */}
                    <div className="p-8 hover:bg-white/[0.03] transition">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-[#00d4ff] font-bold">
                            Tier 03
                        </div>

                        <h3 className="mt-4 text-xl font-black text-white">
                            ENTERPRISE
                        </h3>

                        <div className="mt-4 text-2xl font-black text-slate-300">
                            CONTACT
                        </div>

                        <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                            Multi-camera WebRTC streams, unlimited alerts, and enterprise-grade deployment.
                        </p>

                        <div className="mt-6 text-[10px] font-mono tracking-widest text-slate-500">
                            ACCESS_LEVEL: UNLIMITED
                        </div>
                    </div>
                </div>

                {/* Bottom system stats */}
                <div className="mt-10 flex flex-col md:flex-row justify-between gap-4 text-[10px] font-mono tracking-widest text-slate-600">
                    <div>STREAM_SUPPORT: RTSP / WebRTC</div>
                    <div>ALERT_ENGINE: ACTIVE</div>
                    <div>SCALABILITY: HORIZONTAL</div>
                </div>
            </div>
        </section>
    );
}