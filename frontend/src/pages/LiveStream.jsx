import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import useToastStore from "../store/useToastStore";

export default function LiveStream() {
  const [streamCount, setStreamCount] = useState(1);
  const [streamConfigs, setStreamConfigs] = useState([
    { url: "", name: "cam_1" },
    { url: "", name: "cam_2" },
    { url: "", name: "cam_3" },
  ]);
  const [activeStreams, setActiveStreams] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orientations, setOrientations] = useState({});
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    if (!isStreaming) return;

    const checkOrientations = async () => {
      const newOrientations = { ...orientations };
      try {
        await Promise.all(
          activeStreams.map(async (stream) => {
            const res = await axios.get(
              `http://localhost:8000/api/media/orientation/${stream.name}`
            );
            newOrientations[stream.name] = res.data.orientation;
          })
        );
        setOrientations(newOrientations);
      } catch (err) {
        console.error("Orientation update failed:", err);
      }
    };

    const interval = setInterval(checkOrientations, 3000);
    return () => clearInterval(interval);
  }, [isStreaming, activeStreams, orientations]);

  const handleStartStream = async (e) => {
    e.preventDefault();
    const currentStreams = streamConfigs.slice(0, streamCount);

    if (currentStreams.some((s) => !s.url.trim() || !s.name.trim())) {
      addToast("Please enter all stream names and URLs", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/media/livestream", {
        streams: currentStreams.map((s) => ({
          stream_url: s.url,
          source_name: s.name,
        })),
      });

      if (res.data.status === "success") {
        addToast(res.data.message, "success");
        setActiveStreams(currentStreams);
        setIsStreaming(true);
      } else {
        addToast("Failed to start stream", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Server error occurred while starting stream", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (idx, field, val) => {
    const newConfigs = [...streamConfigs];
    newConfigs[idx][field] = val;
    setStreamConfigs(newConfigs);
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div
        className="absolute inset-0 opacity-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 1px, transparent 1px, transparent 2px)",
        }}
      />

      <Navbar />

      <div className="relative z-10 max-w-6xl mx-auto pt-28 px-6 pb-16">
        <div className="mb-12 text-center">
          <p className="text-[10px] tracking-[0.45em] text-cyan-400 uppercase">
            Live Surveillance
          </p>

          <h1
            className="text-4xl md:text-6xl font-black mt-4 leading-tight"
            style={{ textShadow: "2px 0 #ea0212, -2px 0 #00d4ff" }}
          >
            Multi-Camera Control
          </h1>

          <p className="text-gray-400 mt-4 text-sm md:text-base max-w-2xl mx-auto">
            Configure and deploy real-time CCTV feeds with a cyber-style monitoring dashboard.
          </p>
        </div>

        <div className="relative group mb-10">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-20 blur group-hover:opacity-40 transition" />

          <div className="relative border border-cyan-400/20 bg-[#0a0a0f]/80 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-[0_0_40px_rgba(0,212,255,0.08)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] tracking-[0.3em] text-cyan-400 uppercase">
                  Camera Setup
                </p>
                <h2 className="text-xl md:text-2xl font-bold mt-2">
                  Stream Configuration Panel
                </h2>
              </div>

              <div className="text-right">
                <p className="text-[10px] tracking-[0.3em] text-slate-500 uppercase">
                  Status
                </p>
                <p className={`text-sm font-semibold mt-1 ${isStreaming ? "text-green-400" : "text-yellow-400"}`}>
                  ● {isStreaming ? "Active" : "Idle"}
                </p>
              </div>
            </div>

            <form onSubmit={handleStartStream} className="space-y-6">
              <div>
                <label className="text-[10px] tracking-[0.3em] text-cyan-400 uppercase">
                  Stream Count
                </label>

                <select
                  value={streamCount}
                  onChange={(e) => setStreamCount(Number(e.target.value))}
                  className="w-full mt-2 p-3 rounded-xl bg-[#0e0e13] border border-white/10 text-white outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,212,255,0.25)] transition"
                >
                  <option value={1}>1 Stream</option>
                  <option value={2}>2 Streams</option>
                  <option value={3}>3 Streams</option>
                </select>
              </div>

              <div className="grid gap-4">
                {streamConfigs.slice(0, streamCount).map((cfg, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4 md:p-5 hover:border-cyan-400/30 transition"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase">
                        Source {i + 1}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        CAM-{i + 1}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={cfg.name}
                        onChange={(e) => updateConfig(i, "name", e.target.value)}
                        placeholder="Camera name"
                        className="w-full p-3 rounded-xl bg-black border border-white/10 text-cyan-300 font-mono text-sm outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,212,255,0.2)] transition"
                      />

                      <input
                        type="text"
                        value={cfg.url}
                        onChange={(e) => updateConfig(i, "url", e.target.value)}
                        placeholder="rtsp:// or http://"
                        className="w-full p-3 rounded-xl bg-black border border-white/10 text-cyan-300 font-mono text-sm outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,212,255,0.2)] transition"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden rounded-xl border border-cyan-400 bg-[#00d4ff] text-black font-extrabold py-3.5 tracking-[0.35em] uppercase transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">
                  {loading ? "Initializing..." : "Activate Stream"}
                </span>
                <span className="absolute inset-0 bg-white/25 translate-x-[-120%] hover:translate-x-[120%] transition-transform duration-700" />
              </button>
            </form>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 opacity-20 blur group-hover:opacity-40 transition" />

          <div className="relative border border-purple-400/20 bg-[#0a0a0f]/80 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.08)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] tracking-[0.3em] text-purple-400 uppercase">
                  Live Feeds
                </p>
                <h3 className="text-lg font-semibold mt-2">
                  Multi-View Monitoring Grid
                </h3>
              </div>

              <span className="text-green-400 text-xs animate-pulse">
                ● {isStreaming ? "LIVE" : "WAITING"}
              </span>
            </div>

            <div
              className={`grid gap-4 min-h-[420px] ${activeStreams.length === 1
                  ? "grid-cols-1"
                  : activeStreams.length === 2
                    ? "grid-cols-1 md:grid-cols-2"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
                }`}
            >
              {isStreaming ? (
                activeStreams.map((stream, i) => {
                  const isPortrait = orientations[stream.name] === "portrait";

                  return (
                    <div
                      key={i}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg min-h-[240px] group"
                    >
                      <img
                        src={`http://localhost:8000/api/media/stream/${stream.name}`}
                        alt={stream.name}
                        className={`w-full h-full min-h-[240px] ${isPortrait ? "object-contain bg-black" : "object-cover"
                          }`}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute top-3 left-3 text-[10px] bg-black/70 px-3 py-1.5 rounded-full border border-cyan-400/20 backdrop-blur-md">
                        {stream.name.toUpperCase()}
                      </div>

                      <div className="absolute top-3 right-3 text-[10px] text-green-400 bg-black/50 px-2 py-1 rounded-full border border-green-400/20">
                        ● LIVE
                      </div>

                      <div className="absolute bottom-3 left-3 text-[10px] text-slate-300 bg-black/60 px-3 py-1.5 rounded-full border border-white/10">
                        {isPortrait ? "Portrait" : "Landscape"}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 min-h-[420px] text-gray-500">
                  Awaiting stream activation...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 text-[10px] text-slate-600 font-mono tracking-widest text-center">
          MULTI_CAM_ENGINE • LIVE_MONITORING • AI_READY
        </div>
      </div>
    </div>
  );
}
