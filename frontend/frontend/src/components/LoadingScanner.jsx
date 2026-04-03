export default function LoadingScanner() {
    return (
        <div className="flex items-center gap-3 text-cyan-400 text-sm animate-pulse">

            {/* Spinner */}
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>

            {/* Text */}
            <span>Analyzing VectorDB...</span>

        </div>
    );
}