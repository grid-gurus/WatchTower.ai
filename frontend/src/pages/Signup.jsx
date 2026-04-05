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

        // Prevent double-submit using ref (synchronous check)
        if (requestInProgressRef.current) return;
        requestInProgressRef.current = true;

        // ✅ Validation
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
            const res = await fetch("http://localhost:8000/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
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
                // Show success toast
                addToast("Profile created successfully! Redirecting to login...", "success", 2000);

                // Redirect to login after a short delay to let user see the toast
                setTimeout(() => {
                    navigate("/login");
                }, 2100);
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
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#000000] via-[#020617] to-[#000000] text-white overflow-hidden">

            {/* Glow */}
            <div className="fixed top-[-120px] left-[-120px] w-[500px] h-[500px] bg-cyan-400 opacity-15 blur-[200px] rounded-full"></div>
            <div className="fixed bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-purple-500 opacity-15 blur-[200px] rounded-full"></div>
            <div className="fixed top-[40%] left-[30%] w-[300px] h-[300px] bg-indigo-500 opacity-10 blur-[180px] rounded-full"></div>

            <div className="relative z-10 p-[1.5px] rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500">
                <div className="bg-black p-8 rounded-xl w-[360px]">

                    <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                        Create Account
                    </h2>

                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* Name */}
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            required
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 bg-white/[0.05] border border-white/10 rounded-lg outline-none focus:border-cyan-400"
                        />

                        {/* Email */}
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            required
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-white/[0.05] border border-white/10 rounded-lg outline-none focus:border-cyan-400"
                        />

                        {/* Telegram Handle */}
                        <input
                            type="text"
                            placeholder="Telegram Handle (e.g., @yourhandle)"
                            value={telegram}
                            required
                            onChange={(e) => setTelegram(e.target.value)}
                            className="w-full p-3 bg-white/[0.05] border border-white/10 rounded-lg outline-none focus:border-cyan-400"
                        />

                        {/* Profile Picture URL */}
                        <input
                            type="text"
                            placeholder="Profile Picture URL (Online or Local)"
                            value={profilePic}
                            onChange={(e) => setProfilePic(e.target.value)}
                            className="w-full p-3 bg-white/[0.05] border border-white/10 rounded-lg outline-none focus:border-cyan-400"
                        />

                        {/* Password */}
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            required
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-white/[0.05] border border-white/10 rounded-lg outline-none focus:border-cyan-400"
                        />

                        {/* Confirm Password */}
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            required
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 bg-white/[0.05] border border-white/10 rounded-lg outline-none focus:border-cyan-400"
                        />

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-center text-gray-400">
                        Already have an account?
                        <Link to="/login" className="ml-2 text-cyan-400 hover:underline">
                            Login
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    );
}