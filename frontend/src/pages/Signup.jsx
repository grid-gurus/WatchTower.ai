import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import useToastStore from "../store/useToastStore";

export default function Signup() {
    const navigate = useNavigate();
    const addToast = useToastStore((s) => s.addToast);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [telegram, setTelegram] = useState("");
    const [profilePic, setProfilePic] = useState("");
    const [loading, setLoading] = useState(false);
    const requestInProgressRef = useRef(false);

    const handleSignup = async (e) => {
        e.preventDefault();

        if (requestInProgressRef.current) return;
        requestInProgressRef.current = true;

        if (!name.trim() || !email.trim() || !telegram.trim() || !password.trim() || !confirmPassword.trim()) {
            requestInProgressRef.current = false;
            addToast("Please fill in all fields", "error");
            return;
        }

        if (password !== confirmPassword) {
            requestInProgressRef.current = false;
            addToast("Passwords do not match", "error");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("http://127.0.0.1:8000/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: name,
                    email: email,
                    password: password,
                    telegram_handle: telegram,
                    profile_picture: profilePic
                })
            });

            const data = await res.json();

            if (res.ok) {
                addToast("Profile created successfully! Redirecting...", "success", 2000);
                setTimeout(() => navigate("/login"), 2100);
            } else {
                addToast(data.message || data.detail || "Signup failed", "error");
            }

        } catch (err) {
            console.error(err);
            addToast("Server error", "error");
        } finally {
            requestInProgressRef.current = false;
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-[#050816] text-white overflow-hidden">

            {/* 🔥 Grid */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                }}
            />

            {/* Scanlines */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    background:
                        "repeating-linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)",
                }}
            />

            {/* Glow */}
            <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-cyan-400 opacity-10 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-purple-500 opacity-10 blur-[150px] rounded-full"></div>

            {/* BOX */}
            <div className="relative z-10 w-[380px] border border-cyan-400/20 bg-[#0a0a0f] p-8">

                {/* HEADER */}
                <div className="mb-6 text-center">
                    <p className="text-[10px] tracking-[0.35em] text-cyan-400">
                        USER ONBOARDING
                    </p>

                    <h2 className="text-2xl font-bold mt-2">
                        CREATE ACCESS NODE
                    </h2>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">

                    {/* Inputs */}
                    {[
                        { placeholder: "FULL NAME", value: name, setter: setName },
                        { placeholder: "EMAIL ADDRESS", value: email, setter: setEmail, type: "email" },
                        { placeholder: "TELEGRAM HANDLE (@...)", value: telegram, setter: setTelegram },
                        { placeholder: "PROFILE IMAGE URL (optional)", value: profilePic, setter: setProfilePic },
                        { placeholder: "PASSWORD", value: password, setter: setPassword, type: "password" },
                        { placeholder: "CONFIRM PASSWORD", value: confirmPassword, setter: setConfirmPassword, type: "password" },
                    ].map((field, i) => (
                        <div key={i} className="border border-white/10 bg-[#0e0e13] p-3">
                            <input
                                type={field.type || "text"}
                                placeholder={field.placeholder}
                                value={field.value}
                                onChange={(e) => field.setter(e.target.value)}
                                className="w-full bg-transparent text-white placeholder:text-gray-500 outline-none text-sm tracking-wide"
                                required={i !== 3} // profile pic optional
                            />
                        </div>
                    ))}

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full border border-cyan-400 bg-[#00d4ff] text-black font-bold py-3 tracking-widest transition 
              ${loading ? "opacity-50" : "hover:invert active:scale-95"}
            `}
                    >
                        {loading ? "INITIALIZING..." : "CREATE ACCOUNT"}
                    </button>

                </form>

                {/* Footer */}
                <p className="mt-6 text-xs text-center text-gray-500">
                    ALREADY REGISTERED?
                    <Link to="/login" className="ml-2 text-cyan-400 hover:underline">
                        LOGIN
                    </Link>
                </p>

                {/* System footer */}
                <div className="mt-6 text-[10px] text-slate-600 font-mono tracking-widest text-center">
                    AUTH_NODE • VERIFIED_PIPELINE • AI_READY
                </div>

            </div>
        </div>
    );
}