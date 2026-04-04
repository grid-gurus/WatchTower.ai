import { Link, useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { useState, useEffect } from "react";
import useAlertStore from "../store/useAlertStore";

export default function MinimalNavbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("access_token"))
  );
  const [open, setOpen] = useState(false);
  const [alertLogs, setAlertLogs] = useState([]);
  const [alertLogsLoading, setAlertLogsLoading] = useState(false);
  const [alertLogsError, setAlertLogsError] = useState("");

  const notifications = useAlertStore((s) => s.notifications);
  const clearNotifications = useAlertStore((s) => s.clearNotifications);

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("access_token")));
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth-changed", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth-changed", syncAuthState);
    };
  }, []);

  useEffect(() => {
    const fetchAlertLogs = async () => {
      if (!open || !isLoggedIn) {
        setAlertLogs([]);
        setAlertLogsLoading(false);
        setAlertLogsError("");
        return;
      }

      setAlertLogsLoading(true);
      setAlertLogsError("");

      try {
        const res = await fetch("http://127.0.0.1:8000/api/alerts/logs");

        if (!res.ok) throw new Error("⚠️ Unable to load alerts");

        const data = await res.json();

        const logs =
          Array.isArray(data) ? data :
            Array.isArray(data?.alerts) ? data.alerts :
              Array.isArray(data?.logs) ? data.logs :
                Array.isArray(data?.history) ? data.history :
                  [];

        setAlertLogs(logs);
      } catch (err) {
        setAlertLogsError("⚠️ Unable to load alerts");
        setAlertLogs([]);
      } finally {
        setAlertLogsLoading(false);
      }
    };

    fetchAlertLogs();
  }, [open, isLoggedIn]);

  const handleNotificationClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    setOpen((prev) => !prev);
  };

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    navigate("/me");
  };

  return (
    <div className="fixed top-0 w-full z-50">

      {/* 🔥 Tactical Background */}
      <div className="absolute inset-0 bg-[#131318]/90 backdrop-blur-md"></div>

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Scanline */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.12), rgba(0,0,0,0.12) 1px, transparent 1px, transparent 2px)",
        }}
      />

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70"></div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#00d4ff]">
            CCTV AI
          </h1>
          <span className="hidden md:block text-[10px] tracking-[0.3em] text-slate-500">
            GUEST MODE
          </span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {isLoggedIn ? (
            <>
              {/* Notification */}
              <div className="relative">
                <button
                  onClick={handleNotificationClick}
                  className="border border-[#00d4ff]/25 bg-[#0e0e13] p-[1.5px] hover:scale-105 transition"
                >
                  <div className="w-9 h-9 flex items-center justify-center bg-black text-white">
                    <Bell size={18} />
                  </div>
                </button>

                {(alertLogs.length > 0 || notifications.length > 0) && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                    {alertLogs.length || notifications.length}
                  </span>
                )}

                {open && (
                  <div className="absolute right-0 mt-3 w-72 bg-[#0a0a0f] border border-white/10 p-4 space-y-3 z-50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase tracking-widest text-gray-400">
                        Notifications
                      </span>
                      <button
                        onClick={clearNotifications}
                        className="text-xs text-cyan-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>

                    {alertLogsLoading ? (
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-12 bg-white/5 animate-pulse" />
                        ))}
                      </div>
                    ) : alertLogs.length > 0 ? (
                      alertLogs.map((item, i) => (
                        <div key={i} className="p-3 bg-red-500/10 border border-red-400/30">
                          <p className="text-sm text-white">🚨 {item.message || "Alert"}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No alerts</p>
                    )}
                  </div>
                )}
              </div>

              {/* Profile */}
              <button
                onClick={handleProfileClick}
                className="border border-[#00d4ff]/25 bg-[#0e0e13] p-[1.5px] hover:scale-105 transition"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-black text-white">
                  <User size={18} />
                </div>
              </button>
            </>
          ) : (
            <>
              {/* Login */}
              <Link to="/login">
                <button className="border border-[#00d4ff]/25 px-5 py-2 text-sm text-white hover:border-[#00d4ff] transition">
                  Login
                </button>
              </Link>

              {/* Sign Up */}
              <Link to="/signup">
                <button className="bg-[#00d4ff] px-5 py-2 text-sm font-bold text-black hover:invert transition">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
