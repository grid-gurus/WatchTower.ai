import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, Menu, X, History, Clock3, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import useAlertStore from "../store/useAlertStore";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false); // notifications
  const [sidebarOpen, setSidebarOpen] = useState(false); // history sidebar
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [alertLogs, setAlertLogs] = useState([]);
  const [alertLogsLoading, setAlertLogsLoading] = useState(false);
  const [alertLogsError, setAlertLogsError] = useState("");

  // auth state
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("access_token"))
  );

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    const fetchHistory = async () => {
      // If sidebar is open but user is not logged in, keep it empty
      if (!sidebarOpen || !isLoggedIn) {
        setHistory([]);
        setHistoryLoading(false);
        setHistoryError("");
        return;
      }

      setHistoryLoading(true);
      setHistoryError("");

      try {
        const res = await fetch("http://127.0.0.1:8000/api/query/history");

        if (!res.ok) {
          const text = await res.text();
          console.error("Backend Error:", text);
          throw new Error("⚠️ Backend error (500)");
        }

        const data = await res.json();
        setHistory(Array.isArray(data?.history) ? data.history : []);
      } catch (err) {
        console.error("Fetch failed:", err);
        setHistoryError("⚠️ Unable to load history");
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [sidebarOpen, isLoggedIn]);

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

        if (!res.ok) {
          const text = await res.text();
          console.error("Alert Logs Backend Error:", text);
          throw new Error("⚠️ Unable to load alerts");
        }

        const data = await res.json();

        const logs =
          Array.isArray(data) ? data :
            Array.isArray(data?.alerts) ? data.alerts :
              Array.isArray(data?.logs) ? data.logs :
                Array.isArray(data?.history) ? data.history :
                  [];

        setAlertLogs(logs);
      } catch (err) {
        console.error("Alert logs fetch failed:", err);
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

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      const token = localStorage.getItem("access_token");
      if (token) {
        await fetch("http://127.0.0.1:8000/api/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      // Clear all auth tokens and data
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("email");
      setIsLoggedIn(false);
      setShowLogoutConfirm(false);
      
      // Dispatch event to sync auth state
      window.dispatchEvent(new Event("auth-changed"));
      
      // Redirect to home
      navigate("/");
    }
  };

  return (
    <>
      <div className="fixed top-0 w-full z-50">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-900 to-black opacity-95 backdrop-blur-xl"></div>

        {/* Glow Line */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-purple-500 opacity-40"></div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-3 items-center px-4 md:px-8 py-4 gap-4">
          {/* Left: Menu + Logo */}
          <div className="flex items-center justify-start gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-[1.5px] rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-105 transition"
              aria-label="Open history sidebar"
            >
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white">
                <Menu size={20} />
              </div>
            </button>

            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent shrink-0">
              CCTV AI
            </h1>
          </div>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center justify-center gap-8 lg:gap-12 text-base lg:text-lg font-semibold tracking-wide whitespace-nowrap">
            {location.pathname !== "/" && (
              <Link
                to="/"
                className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent hover:from-cyan-400 hover:to-purple-500 transition"
              >
                Home
              </Link>
            )}
            {location.pathname !== "/dashboard" && (
              <Link
                to="/dashboard"
                className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent hover:from-cyan-400 hover:to-purple-500 transition"
              >
                Dashboard
              </Link>
            )}
            {location.pathname !== "/tripwires" && (
              <Link
                to="/tripwires"
                className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent hover:from-cyan-400 hover:to-purple-500 transition"
              >
                Tripwires
              </Link>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center justify-end gap-5 shrink-0 whitespace-nowrap pr-4 md:pr-8">
            {isLoggedIn ? (
              <>
                {/* Create Alert */}
                <Link to="/alerts/create" className="shrink-0">
                  <div className="p-[1.5px] rounded-lg bg-gradient-to-r from-green-400 to-cyan-500">
                    <button className="px-4 py-2 rounded-lg bg-black font-medium group">
                      <span className="text-white text-sm group-hover:bg-gradient-to-r group-hover:from-green-400 group-hover:to-cyan-500 group-hover:bg-clip-text group-hover:text-transparent">
                        + Create Alert
                      </span>
                    </button>
                  </div>
                </Link>
              </>
            ) : (
              <>
                {/* Login */}
                <Link to="/login" className="shrink-0">
                  <div className="p-[1.5px] rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500">
                    <button className="px-5 md:px-4 py-2 rounded-lg bg-black font-medium group">
                      <span className="text-white text-sm group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent">
                        Login
                      </span>
                    </button>
                  </div>
                </Link>

                {/* Sign Up */}
                <Link to="/signup" className="shrink-0">
                  <div className="p-[1.5px] rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500">
                    <button className="px-3 md:px-4 py-2 rounded-lg bg-black font-medium group">
                      <span className="text-white text-sm group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent">
                        Sign Up
                      </span>
                    </button>
                  </div>
                </Link>
              </>
            )}

            {/* Notification */}
            <div className="relative shrink-0">
              <div
                onClick={handleNotificationClick}
                className="p-[1.5px] rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white hover:scale-105 transition">
                  <Bell size={18} />
                </div>
              </div>

              {isLoggedIn && (alertLogs.length > 0 || notifications.length > 0) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                  {alertLogs.length > 0 ? alertLogs.length : notifications.length}
                </span>
              )}

              {isLoggedIn && open && (
                <div className="absolute right-0 mt-3 w-72 bg-black border border-white/10 rounded-xl shadow-xl p-4 space-y-3 z-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Notifications</span>
                    <button
                      onClick={clearNotifications}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>

                  {alertLogsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-16 rounded-lg bg-white/5 border border-white/10 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : alertLogsError ? (
                    <p className="text-red-300 text-sm">{alertLogsError}</p>
                  ) : alertLogs.length > 0 ? (
                    <div className="space-y-3">
                      {alertLogs.map((item, i) => {
                        const message =
                          item.message ||
                          item.alert ||
                          item.text ||
                          item.title ||
                          "Alert";

                        const time =
                          item.created_at ||
                          item.timestamp ||
                          item.time ||
                          item.createdAt ||
                          "";

                        return (
                          <div
                            key={item.id || i}
                            className="p-3 rounded-lg bg-red-500/10 border border-red-400/30"
                          >
                            <p className="text-white text-sm">🚨 {message}</p>
                            {item.description && (
                              <p className="text-xs text-gray-300 mt-1">
                                {item.description}
                              </p>
                            )}
                            {time && (
                              <p className="text-xs text-gray-400 mt-1">
                                {time}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="text-gray-500 text-sm">No alerts yet</p>
                  ) : (
                    notifications.map((n, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-red-500/10 border border-red-400/30"
                      >
                        <p className="text-white text-sm">🚨 {n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <button
              type="button"
              onClick={handleProfileClick}
              className="shrink-0"
            >
              <div className="p-[1.5px] rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-105 transition">
                <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white font-semibold">
                  U
                </div>
              </div>
            </button>

            {/* Logout - Only show when logged in */}
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="shrink-0"
                title="Logout"
              >
                <div className="p-[1.5px] rounded-full bg-gradient-to-r from-red-400 to-pink-500 hover:scale-105 transition">
                  <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white hover:text-red-400 transition">
                    <LogOut size={18} />
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />

          {/* Modal - Minimal Design */}
          <div className="relative z-[71] p-[1.5px] rounded-xl bg-gradient-to-r from-red-400 to-pink-500">
            <div className="bg-black rounded-xl p-8 flex flex-col items-center">
              <button
                onClick={handleLogout}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-red-400 to-pink-500 text-white font-semibold hover:scale-105 transition mb-3"
              >
                Logout
              </button>
              
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition"
                title="Cancel"
              >
                <X size={20} className="text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="absolute left-0 top-0 h-full w-[90%] max-w-sm bg-gradient-to-b from-[#050816] via-[#020617] to-black border-r border-white/10 shadow-2xl">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/80">
                    Activity
                  </p>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    History
                  </h2>
                </div>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-[1.5px] rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-105 transition"
                  aria-label="Close history sidebar"
                >
                  <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white">
                    <X size={20} />
                  </div>
                </button>
              </div>

              {/* Summary Card */}
              <div className="px-5 pt-5">
                <div className="p-[1.5px] rounded-2xl bg-gradient-to-r from-cyan-400/70 to-purple-500/70">
                  <div className="rounded-2xl bg-black/90 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20">
                        <History size={20} className="text-cyan-300" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total records</p>
                        <p className="text-2xl font-semibold text-white">
                          {isLoggedIn ? history.length : 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {!isLoggedIn ? (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm">
                    History is available after login.
                  </div>
                ) : historyLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
                      />
                    ))}
                  </div>
                ) : historyError ? (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-200 text-sm">
                    {historyError}
                  </div>
                ) : history.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm">
                    No history found yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item, index) => {
                      const title =
                        item.user_query ||
                        item.query ||
                        item.condition ||
                        item.text ||
                        "Untitled item";

                      const subtitle =
                        item.ai_response ||
                        item.response ||
                        item.message ||
                        item.video_source_id ||
                        "History entry";

                      const time =
                        item.created_at ||
                        item.timestamp ||
                        item.time ||
                        item.createdAt ||
                        "";

                      return (
                        <div
                          key={item.id || index}
                          className="p-[1.5px] rounded-2xl bg-gradient-to-r from-cyan-400/40 to-purple-500/40"
                        >
                          <div className="rounded-2xl bg-black/85 p-4 border border-white/10 hover:border-cyan-400/30 transition">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-white font-medium leading-snug break-words">
                                  {title}
                                </p>
                                <p className="text-sm text-gray-400 mt-1 break-words">
                                  {subtitle}
                                </p>
                              </div>
                              <div className="shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-purple-300">
                                  <Clock3 size={18} />
                                </div>
                              </div>
                            </div>

                            {time && (
                              <p className="text-xs text-gray-500 mt-3">
                                {time}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}