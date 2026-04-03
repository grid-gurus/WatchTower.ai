import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Signup() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");

    const handleSignup = async () => {

        // ✅ simple validation
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            const res = await fetch("http://localhost:8000/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    telegram_handle: name   // optional field
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message);

                // ✅ redirect to login
                navigate("/login");
            } else {
                alert(data.message || "Signup failed");
            }

        } catch (err) {
            console.error(err);
            alert("Server error");
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

                    {/* Name */}
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 mb-4 bg-white/[0.05] border border-white/10 rounded-lg outline-none focus:border-cyan-400"
                    />

                    {/* Email */}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 mb-4 bg-white/[0.05] border border-white/10 rounded-lg outline-none focus:border-cyan-400"
                    />

                    {/* Password */}
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 mb-4 bg-white/[0.05] border border-white/10 rounded-lg outline-none focus:border-cyan-400"
                    />

                    {/* Confirm Password */}
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 mb-4 bg-white/[0.05] border border-white/10 rounded-lg outline-none focus:border-cyan-400"
                    />

                    {/* Button */}
                    <button
                        onClick={handleSignup}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold"
                    >
                        Create Account
                    </button>

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