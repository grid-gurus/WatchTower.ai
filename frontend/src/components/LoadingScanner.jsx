export default function LoadingScanner() {
    return (
        <div className="flex items-center gap-4 text-cyan-400 text-sm font-mono tracking-widest">

            {/* 🔥 Radar Spinner */}
            <div className="relative w-6 h-6">
                <div className="absolute inset-0 border border-cyan-400/30 rounded-full"></div>
                <div className="absolute inset-0 border-t-2 border-cyan-400 rounded-full animate-spin"></div>
                <div className="absolute inset-1 border border-cyan-400/20 rounded-full"></div>
            </div>

            {/* 🔍 Scanning Text */}
            <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-slate-500 tracking-[0.3em]">
                    AI SCAN
                </span>

                <span className="text-cyan-400 animate-pulse">
                    ANALYZING VECTOR DB...
                </span>
            </div>

            {/* ⚡ Blinking dots */}
            <div className="flex gap-1">
                <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-150"></span>
                <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-300"></span>
            </div>

        </div>
    );
}