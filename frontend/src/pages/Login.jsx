import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import useToastStore from "../store/useToastStore";

export default function Login() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        addToast("Please fill in all fields", "error");
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast("Logged in successfully!", "success", 2000);

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("email", data.email);

        window.dispatchEvent(new Event("auth-changed"));

        setTimeout(() => navigate("/"), 2100);
      } else {
        addToast(data.message || data.detail || "Login failed", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Server error", "error");
    } finally {
      isSubmittingRef.current = false;
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

      {/* Box */}
      <div className="relative z-10 w-[360px] border border-cyan-400/20 bg-[#0a0a0f] p-8">

        {/* Header */}
        <div className="mb-6 text-center">
          <p className="text-[10px] tracking-[0.35em] text-cyan-400">
            AUTH SYSTEM
          </p>

          <h2 className="text-2xl font-bold text-white mt-2">
            LOGIN ACCESS
          </h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">

          {/* Email */}
          <div className="border border-white/10 bg-[#0e0e13] p-3">
            <input
              type="email"
              placeholder="EMAIL_ADDRESS"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-white placeholder:text-gray-500 outline-none text-sm tracking-wide"
            />
          </div>

          {/* Password */}
          <div className="border border-white/10 bg-[#0e0e13] p-3">
            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-white placeholder:text-gray-500 outline-none text-sm tracking-wide"
            />
          </div>

          <p className="text-xs text-right text-gray-500 hover:text-cyan-400 cursor-pointer">
            FORGOT PASSWORD?
          </p>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full border border-cyan-400 bg-[#00d4ff] text-black font-bold py-3 tracking-widest transition 
              ${loading ? "opacity-50 cursor-not-allowed" : "hover:invert active:scale-95"}
            `}
          >
            {loading ? "AUTHENTICATING..." : "ENTER SYSTEM"}
          </button>

        </form>

        {/* Footer */}
        <p className="mt-6 text-xs text-center text-gray-500 tracking-wide">
          NO ACCESS?
          <Link to="/signup" className="ml-2 text-cyan-400 hover:underline">
            REGISTER
          </Link>
        </p>

        {/* Bottom system text */}
        <div className="mt-6 text-[10px] text-slate-600 font-mono tracking-widest text-center">
          SECURE_AUTH • JWT_ENABLED • SESSION_TRACKING
        </div>
      </div>
    </div>
  );
}
