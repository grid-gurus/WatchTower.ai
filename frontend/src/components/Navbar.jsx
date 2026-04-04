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

  const [activeRules, setActiveRules] = useState([]);
  const [activeRulesLoading, setActiveRulesLoading] = useState(false);
  const [showActiveRules, setShowActiveRules] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("access_token"))
  );
  const [userProfile, setUserProfile] = useState(null);

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
    const fetchProfile = async () => {
      if (!isLoggedIn) {
        setUserProfile(null);
        return;
      }
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://127.0.0.1:8000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
        }
      } catch (err) {
        console.error("Navbar profile fetch failed:", err);
      }
    };
    fetchProfile();
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchHistory = async () => {
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

  const fetchActiveRules = async () => {
    if (!isLoggedIn) return;
    setActiveRulesLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/alerts/active");
      if (res.ok) {
        const data = await res.json();
        setActiveRules(data.rules || []);
      }
    } catch (err) {
      console.error("Failed to fetch active rules:", err);
    } finally {
      setActiveRulesLoading(false);
    }
  };

  useEffect(() => {
    if (showActiveRules) fetchActiveRules();
  }, [showActiveRules, isLoggedIn]);

  const handleDeleteRule = async (ruleId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/alerts/${ruleId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchActiveRules();
      }
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://127.0.0.1:8000/api/alerts/logs/purge", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        clearNotifications();
        setAlertLogs([]);
        console.log("🔥 Notifications purged from DB successfully.");
      }
    } catch (err) {
      console.error("Failed to purge alert logs:", err);
    }
  };

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
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("email");
      setIsLoggedIn(false);
      setShowLogoutConfirm(false);
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/");
    }
  };

  return (
    <>
      <div className="fixed top-0 z-50 w-full">
        <div className="relative overflow-visible border-b border-[#00d4ff]/10 bg-[#131318]/90 backdrop-blur-md">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.12), rgba(0,0,0,0.12) 1px, transparent 1px, transparent 2px)",
            }}
          />
          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70" />

          <div className="relative mx-auto max-w-7xl px-4 py-4 md:px-8">
            {!isLoggedIn ? (
              <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="group border border-[#00d4ff]/20 bg-[#0e0e13] p-[1.5px] transition-transform duration-150 hover:scale-105"
                      aria-label="Open history sidebar"
                    >
                      <div className="flex h-10 w-10 items-center justify-center border border-[#00d4ff]/20 bg-black text-white transition-colors group-hover:text-[#00d4ff]">
                        <Menu size={20} />
                      </div>
                    </button>

                    <div>
                      <h1 className="text-xl font-black tracking-tighter text-[#00d4ff] md:text-2xl">
                        CCTV AI
                      </h1>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">
                        Guest Interface
                      </p>
                    </div>
                  </div>

                  <div className="border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-200 lg:hidden">
                    Access Required
                  </div>
                </div>

                <div className="hidden items-center justify-center gap-6 rounded-none border border-white/10 bg-black/30 px-5 py-3 md:flex">
                  {location.pathname !== "/" && (
                    <Link
                      to="/"
                      className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300 transition hover:text-[#00d4ff]"
                    >
                      Home
                    </Link>
                  )}
                  {location.pathname !== "/dashboard" && (
                    <Link
                      to="/dashboard"
                      className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300 transition hover:text-[#00d4ff]"
                    >
                      Dashboard
                    </Link>
                  )}
                  {location.pathname !== "/tripwires" && (
                    <Link
                      to="/tripwires"
                      className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300 transition hover:text-[#00d4ff]"
                    >
                      Tripwires
                    </Link>
                  )}
                  {location.pathname !== "/livestream" && (
                    <Link
                      to="/livestream"
                      className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300 transition hover:text-[#00d4ff]"
                    >
                      Live Stream
                    </Link>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <div className="mr-2 hidden border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-200 lg:block">
                    Access Required
                  </div>

                  <Link to="/login" className="shrink-0">
                    <button className="group border border-[#00d4ff]/25 bg-[#0e0e13] px-5 py-2 text-sm font-medium text-white transition-transform duration-150 hover:scale-[1.02] hover:border-[#00d4ff]/60 md:px-4">
                      <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent group-hover:from-[#00d4ff] group-hover:to-purple-400">
                        Login
                      </span>
                    </button>
                  </Link>

                  <Link to="/signup" className="shrink-0">
                    <button className="group border border-[#00d4ff]/25 bg-[#0e0e13] px-3 py-2 text-sm font-medium text-white transition-transform duration-150 hover:scale-[1.02] hover:border-[#00d4ff]/60 md:px-4">
                      <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent group-hover:from-[#00d4ff] group-hover:to-purple-400">
                        Sign Up
                      </span>
                    </button>
                  </Link>

                  <button
                    onClick={handleNotificationClick}
                    className="group relative border border-[#00d4ff]/25 bg-[#0e0e13] p-[1.5px] transition-transform duration-150 hover:scale-105"
                    aria-label="Open notifications"
                  >
                    <div className="flex h-9 w-9 items-center justify-center border border-[#00d4ff]/20 bg-black text-white transition-colors group-hover:text-[#00d4ff]">
                      <Bell size={18} />
                    </div>
                  </button>

                  <button type="button" onClick={handleProfileClick} className="shrink-0">
                    <div className="border border-[#00d4ff]/25 bg-[#0e0e13] p-[1.5px] transition-transform duration-150 hover:scale-105">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden border border-[#00d4ff]/20 bg-black text-white font-semibold">
                        <span>U</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 items-center gap-4">
                <div className="flex items-center justify-start gap-3">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="group border border-[#00d4ff]/20 bg-[#0e0e13] p-[1.5px] transition-transform duration-150 hover:scale-105"
                    aria-label="Open history sidebar"
                  >
                    <div className="flex h-10 w-10 items-center justify-center border border-[#00d4ff]/20 bg-black text-white transition-colors group-hover:text-[#00d4ff]">
                      <Menu size={20} />
                    </div>
                  </button>

                  <div className="leading-none">
                    <h1 className="text-xl font-black tracking-tighter text-[#00d4ff] md:text-2xl">
                      CCTV AI
                    </h1>
                    <p className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500 md:block">
                      Tactical Intelligence Substrate
                    </p>
                  </div>
                </div>

                <div className="hidden items-center justify-center gap-8 whitespace-nowrap text-base font-semibold tracking-wide lg:gap-12 md:flex lg:text-lg">
                  {location.pathname !== "/" && (
                    <Link
                      to="/"
                      className="border-b border-transparent bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent transition hover:border-[#00d4ff] hover:from-[#00d4ff] hover:to-purple-400"
                    >
                      Home
                    </Link>
                  )}
                  {location.pathname !== "/dashboard" && (
                    <Link
                      to="/dashboard"
                      className="border-b border-transparent bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent transition hover:border-[#00d4ff] hover:from-[#00d4ff] hover:to-purple-400"
                    >
                      Dashboard
                    </Link>
                  )}
                  {location.pathname !== "/tripwires" && (
                    <Link
                      to="/tripwires"
                      className="border-b border-transparent bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent transition hover:border-[#00d4ff] hover:from-[#00d4ff] hover:to-purple-400"
                    >
                      Tripwires
                    </Link>
                  )}
                  {location.pathname !== "/livestream" && (
                    <Link
                      to="/livestream"
                      className="border-b border-transparent bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent transition hover:border-[#00d4ff] hover:from-[#00d4ff] hover:to-purple-400"
                    >
                      Live Stream
                    </Link>
                  )}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-4 whitespace-nowrap pr-2 md:gap-5 md:pr-4">
                  <div className="relative overflow-visible">
                    <button
                      onClick={() => setShowActiveRules(!showActiveRules)}
                      className="group flex items-center gap-2 border border-[#00d4ff]/25 bg-[#0e0e13] px-4 py-2 text-sm font-medium text-white transition-transform duration-150 hover:scale-[1.02] hover:border-[#00d4ff]/60"
                    >
                      <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(0,212,255,0.8)]" />
                      <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent group-hover:from-[#00d4ff] group-hover:to-purple-400">
                        Active Alerts ({activeRules.length})
                      </span>
                    </button>

                    {showActiveRules && (
                      <div className="absolute right-0 top-full z-[999] mt-3 w-80 border border-white/10 bg-[#0a0a0f]/95 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-200">
                        <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2">
                          <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                            AI Watchlist
                          </h3>
                          <Link
                            to="/alerts/create"
                            onClick={() => setShowActiveRules(false)}
                            className="border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-gray-300 transition hover:bg-white/10"
                          >
                            + New Rule
                          </Link>
                        </div>

                        {activeRulesLoading ? (
                          <div className="py-4 text-center text-xs italic text-gray-500">
                            Scanning active rules...
                          </div>
                        ) : activeRules.length === 0 ? (
                          <div className="py-8 text-center">
                            <p className="text-xs text-gray-500">No active AI rules.</p>
                            <Link
                              to="/alerts/create"
                              onClick={() => setShowActiveRules(false)}
                              className="mt-2 block text-[10px] text-cyan-400 hover:underline"
                            >
                              Click here to create your first alert
                            </Link>
                          </div>
                        ) : (
                          <div className="custom-scrollbar max-h-64 space-y-3 overflow-y-auto pr-1">
                            {activeRules.map((rule) => (
                              <div
                                key={rule.id}
                                className="group flex items-center justify-between gap-3 border border-white/5 bg-white/[0.03] p-3 transition-all hover:border-cyan-400/30"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-medium italic text-white">
                                    "{rule.condition}"
                                  </p>
                                  <p className="mt-1 text-[10px] text-gray-500">
                                    Status: <span className="text-green-500">Monitoring...</span>
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="rounded-md p-1.5 text-gray-500 transition hover:bg-red-500/20 hover:text-red-400"
                                  title="Stop Monitoring"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative shrink-0 overflow-visible">
                    <button
                      onClick={handleNotificationClick}
                      className="group relative border border-[#00d4ff]/25 bg-[#0e0e13] p-[1.5px] transition-transform duration-150 hover:scale-105"
                      aria-label="Open notifications"
                    >
                      <div className="flex h-9 w-9 items-center justify-center border border-[#00d4ff]/20 bg-black text-white transition-colors group-hover:text-[#00d4ff]">
                        <Bell size={18} />
                      </div>
                    </button>

                    {(alertLogs.length > 0 || notifications.length > 0) && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                        {alertLogs.length > 0 ? alertLogs.length : notifications.length}
                      </span>
                    )}

                    {open && (
                      <div className="absolute right-0 top-full z-[999] mt-3 w-80 border border-white/10 bg-[#0a0a0f]/95 p-4 shadow-2xl backdrop-blur-xl">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm uppercase tracking-[0.2em] text-gray-400">
                            Notifications
                          </span>
                          <button
                            onClick={handleClearNotifications}
                            className="text-xs text-cyan-400 transition hover:underline"
                          >
                            Clear
                          </button>
                        </div>

                        {!isLoggedIn ? (
                          <p className="py-6 text-center text-sm text-gray-400">
                            Login to view alerts
                          </p>
                        ) : alertLogsLoading ? (
                          <div className="space-y-3">
                            {[1, 2].map((i) => (
                              <div
                                key={i}
                                className="h-16 animate-pulse border border-white/10 bg-white/5"
                              />
                            ))}
                          </div>
                        ) : alertLogsError ? (
                          <p className="text-sm text-red-300">{alertLogsError}</p>
                        ) : alertLogs.length > 0 ? (
                          <div className="space-y-3">
                            {alertLogs.map((item, i) => {
                              const rawMessage =
                                item.rule_tested ||
                                item.message ||
                                item.alert ||
                                item.text ||
                                item.title ||
                                "Alert";

                              const message =
                                rawMessage.length > 25
                                  ? rawMessage.substring(0, 25) + "..."
                                  : rawMessage;

                              const time =
                                item.created_at ||
                                item.timestamp ||
                                item.time ||
                                item.createdAt ||
                                "";

                              return (
                                <div
                                  key={item.id || i}
                                  className="border border-red-400/30 bg-red-500/10 p-3"
                                >
                                  <p className="text-sm text-white">🚨 {message}</p>
                                  {item.description && (
                                    <p className="mt-1 text-xs text-gray-300">
                                      {item.description}
                                    </p>
                                  )}
                                  {time && (
                                    <p className="mt-1 text-xs text-gray-400">
                                      {time}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : notifications.length === 0 ? (
                          <p className="text-sm text-gray-500">No alerts yet</p>
                        ) : (
                          notifications.map((n, i) => {
                            const rawMsg = n.message || "Alert";
                            const displayMsg =
                              rawMsg.length > 25 ? rawMsg.substring(0, 25) + "..." : rawMsg;
                            return (
                              <div
                                key={i}
                                className="border border-red-400/30 bg-red-500/10 p-3"
                              >
                                <p className="text-sm text-white" title={rawMsg}>
                                  🚨 {displayMsg}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">{n.time}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="shrink-0"
                  >
                    <div className="border border-[#00d4ff]/25 bg-[#0e0e13] p-[1.5px] transition-transform duration-150 hover:scale-105">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden border border-[#00d4ff]/20 bg-black text-white font-semibold">
                        {userProfile?.profile_picture && userProfile.profile_picture.trim() !== "" ? (
                          <img
                            src={userProfile.profile_picture}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>
                            {userProfile?.full_name?.[0]?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {isLoggedIn && (
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(true)}
                      className="shrink-0"
                      title="Logout"
                    >
                      <div className="border border-red-400/25 bg-[#0e0e13] p-[1.5px] transition-transform duration-150 hover:scale-105">
                        <div className="flex h-9 w-9 items-center justify-center border border-red-400/20 bg-black text-white transition hover:text-red-400">
                          <LogOut size={18} />
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />

          <div className="relative z-[71] border border-red-400/60 bg-[#0a0a0f] p-[1.5px]">
            <div className="flex flex-col items-center gap-4 bg-black p-8">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-400">
                  Session Termination
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                  Logout now?
                </h3>
                <p className="mt-2 max-w-xs text-sm text-slate-400">
                  You will be signed out and returned to the home screen.
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="border border-red-400/40 bg-red-500 px-8 py-3 text-sm font-semibold text-white transition-transform duration-150 hover:scale-105"
              >
                Logout
              </button>

              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-md p-2 transition hover:bg-white/10"
                title="Cancel"
              >
                <X size={20} className="text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-[90%] max-w-sm border-r border-white/10 bg-gradient-to-b from-[#050816] via-[#020617] to-black shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
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
                  className="border border-[#00d4ff]/25 bg-[#0e0e13] p-[1.5px] transition-transform duration-150 hover:scale-105"
                  aria-label="Close history sidebar"
                >
                  <div className="flex h-10 w-10 items-center justify-center bg-black text-white">
                    <X size={20} />
                  </div>
                </button>
              </div>

              <div className="px-5 pt-5">
                <div className="border border-cyan-400/20 bg-[#0e0e13] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                      <History size={20} />
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

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {!isLoggedIn ? (
                  <div className="border border-white/10 bg-white/5 p-5 text-sm text-gray-400">
                    History is available after login.
                  </div>
                ) : historyLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 animate-pulse border border-white/10 bg-white/5"
                      />
                    ))}
                  </div>
                ) : historyError ? (
                  <div className="border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                    {historyError}
                  </div>
                ) : history.length === 0 ? (
                  <div className="border border-white/10 bg-white/5 p-5 text-sm text-gray-400">
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
                          className="border border-cyan-400/20 bg-[#0e0e13] p-[1.5px] transition hover:border-cyan-400/40"
                        >
                          <div className="border border-white/10 bg-black/85 p-4 transition hover:bg-black/95">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="break-words font-medium leading-snug text-white">
                                  {title}
                                </p>
                                <p className="mt-1 break-words text-sm text-gray-400">
                                  {subtitle}
                                </p>
                              </div>
                              <div className="shrink-0">
                                <div className="flex h-10 w-10 items-center justify-center border border-purple-400/20 bg-purple-500/10 text-purple-300">
                                  <Clock3 size={18} />
                                </div>
                              </div>
                            </div>

                            {time && (
                              <p className="mt-3 text-xs text-gray-500">
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