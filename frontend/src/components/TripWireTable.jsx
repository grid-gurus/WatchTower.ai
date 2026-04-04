export default function TripWireTable({ alerts, telegramHandle }) {
    return (
        <div className="space-y-4">

            {/* Empty State */}
            {alerts.length === 0 && (
                <div className="border border-cyan-400/20 bg-[#0a0a0f] p-6 text-center">
                    <p className="text-[10px] tracking-[0.3em] text-cyan-400 mb-2">
                        NO ACTIVE RULES
                    </p>
                    <p className="text-gray-500 text-sm">
                        Surveillance system is idle. No alerts configured.
                    </p>
                </div>
            )}

            {/* Alerts */}
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className="relative border border-cyan-400/20 bg-[#0a0a0f] p-5 transition hover:border-cyan-400/50"
                >

                    {/* Left indicator */}
                    <div className="absolute left-0 top-0 h-full w-[2px] bg-cyan-400" />

                    {/* Top Row */}
                    <div className="flex justify-between items-center gap-4">

                        <div>
                            <p className="text-[10px] tracking-[0.3em] text-cyan-400 mb-1">
                                RULE ACTIVE
                            </p>

                            <p className="text-white text-sm font-medium">
                                {alert.text}
                            </p>
                        </div>

                        <span className="flex items-center gap-2 text-green-400 text-xs tracking-wide">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            ACTIVE
                        </span>

                    </div>

                    {/* Routing Info */}
                    <div className="mt-4 border-t border-white/5 pt-3 text-xs text-gray-400 tracking-wide">
                        ROUTE →
                        <span className="ml-2 text-cyan-400 font-mono">
                            {telegramHandle}
                        </span>
                    </div>

                </div>
            ))}
        </div>
    );
}