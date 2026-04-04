import { useState } from "react";

export default function AuthModal({ isOpen, onClose, type }) {
    const [isLogin, setIsLogin] = useState(type === "login");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

            {/* Background */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

            {/* Grid */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}
            />

            {/* Scanlines */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    background:
                        "repeating-linear-gradient(0deg, rgba(0,0,0,0.12), rgba(0,0,0,0.12) 1px, transparent 1px, transparent 2px)",
                }}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md border border-[#00d4ff]/20 bg-[#0a0a0f] p-8 shadow-2xl">

                {/* Top strip */}
                <div className="flex items-center justify-between border-b border-[#00d4ff]/10 pb-4 mb-6">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400">
                            AUTH SYSTEM
                        </p>
                        <h2 className="text-xl font-black text-white tracking-tight">
                            {isLogin ? "LOGIN ACCESS" : "CREATE ACCOUNT"}
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white text-lg"
                    >
                        ✕
                    </button>
                </div>

                {/* Inputs */}
                <div className="flex flex-col gap-4">

                    <div className="border border-[#00d4ff]/15 bg-[#0e0e13] p-3">
                        <input
                            type="email"
                            placeholder="EMAIL_ADDRESS"
                            className="w-full bg-transparent text-white placeholder:text-gray-500 outline-none text-sm tracking-wide"
                        />
                    </div>

                    <div className="border border-[#00d4ff]/15 bg-[#0e0e13] p-3">
                        <input
                            type="password"
                            placeholder="PASSWORD"
                            className="w-full bg-transparent text-white placeholder:text-gray-500 outline-none text-sm tracking-wide"
                        />
                    </div>

                    {/* Button */}
                    <button className="mt-4 border border-[#00d4ff] bg-[#00d4ff] py-3 text-sm font-black tracking-[0.2em] text-[#001f27] transition hover:invert active:scale-95">
                        {isLogin ? "LOGIN" : "CREATE_ACCOUNT"}
                    </button>
                </div>

                {/* Switch */}
                <p className="mt-6 text-xs text-center text-slate-500 tracking-wide">
                    {isLogin ? "NO ACCOUNT?" : "ALREADY REGISTERED?"}
                    <span
                        className="ml-2 cursor-pointer text-[#00d4ff] hover:underline"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "SIGN UP" : "LOGIN"}
                    </span>
                </p>

                {/* Bottom terminal text */}
                <div className="mt-6 text-[10px] text-slate-600 font-mono tracking-widest text-center">
                    SECURE_AUTH_PROTOCOL_ENABLED
                </div>
            </div>
        </div>
    );
}