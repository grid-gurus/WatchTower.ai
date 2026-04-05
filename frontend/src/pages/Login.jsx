import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import useToastStore from "../store/useToastStore";

export default function Login() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 🔥 HARD BLOCK (sync, instant)
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  // const handleLogin = (e) => {
  //     e.preventDefault();

  //     // 🚫 Prevent multiple clicks instantly
  //     if (isSubmittingRef.current) return;
  //     isSubmittingRef.current = true;

  //     run(async () => {
  //         // Validation
  //         if (!email.trim() || !password.trim()) {
  //             addToast("Please fill in all fields", "error");
  //             isSubmittingRef.current = false;
  //             return;
  //         }

  //         try {
  //             const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
  //                 method: "POST",
  //                 headers: {
  //                     "Content-Type": "application/json"
  //                 },
  //                 body: JSON.stringify({ email, password })
  //             });

  //             const data = await res.json();

  //             if (res.ok) {
  //                 addToast("Logged in successfully!", "success", 2000);

  //                 // Save token
  //                 localStorage.setItem("token", data.token);

  //                 // Sync navbar/auth
  //                 window.dispatchEvent(new Event("auth-changed"));

  //                 // Redirect
  //                 setTimeout(() => navigate("/"), 2100);
  //             } else {
  //                 addToast(data.message || "Login failed", "error");
  //             }

  //         } catch (err) {
  //             console.error(err);
  //             addToast("Server error", "error");
  //         } finally {
  //             // 🔥 ALWAYS reset
  //             isSubmittingRef.current = false;
  //         }
  //     });
  // };

  const handleLogin = async (e) => {
    e.preventDefault();

    // 🔥 HARD BLOCK (sync, instant)
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true; // lock immediately
    setLoading(true);

    try {
      console.log("LOGIN CALLED");

      // Validation
      if (!email.trim() || !password.trim()) {
        addToast("Please fill in all fields", "error");

        // 🔥 IMPORTANT: unlock BEFORE return
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast("Logged in successfully!", "success", 2000);

        // Save JWT token (frontend storage)
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
      // 🔥 ALWAYS RUNS (no freeze)
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#000000] via-[#020617] to-[#000000] text-white overflow-hidden">
      {/* Glow Effects */}
      <div className="fixed top-[-120px] left-[-120px] w-[500px] h-[500px] bg-cyan-400 opacity-15 blur-[200px] rounded-full"></div>
      <div className="fixed bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-purple-500 opacity-15 blur-[200px] rounded-full"></div>
      <div className="fixed top-[40%] left-[30%] w-[300px] h-[300px] bg-indigo-500 opacity-10 blur-[180px] rounded-full"></div>

      <div className="relative z-10 p-[1.5px] rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500">
        <div className="bg-black p-8 rounded-xl w-[360px]">
          <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Welcome Back
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
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

            <p className="text-sm text-gray-400 text-right hover:text-cyan-400 cursor-pointer">
              Forgot Password?
            </p>

            {/* 🔥 BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold 
    ${loading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-gray-400">
            Don't have an account?
            <Link to="/signup" className="ml-2 text-cyan-400 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
