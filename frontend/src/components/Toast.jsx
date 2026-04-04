import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import useToastStore from "../store/useToastStore";

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  const getIconColor = (type) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "info":
        return "text-cyan-400";
      default:
        return "text-gray-400";
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case "success":
        return "border-green-400/40";
      case "error":
        return "border-red-400/40";
      case "info":
        return "border-cyan-400/40";
      default:
        return "border-gray-400/40";
    }
  };

  const getGlow = (type) => {
    switch (type) {
      case "success":
        return "shadow-[0_0_15px_rgba(34,197,94,0.3)]";
      case "error":
        return "shadow-[0_0_20px_rgba(255,0,0,0.4)]";
      case "info":
        return "shadow-[0_0_15px_rgba(0,212,255,0.3)]";
      default:
        return "";
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle size={18} />;
      case "error":
        return <AlertCircle size={18} />;
      case "info":
        return <Info size={18} />;
      default:
        return null;
    }
  };

  const getLabel = (type) => {
    switch (type) {
      case "success":
        return "SUCCESS";
      case "error":
        return "ERROR";
      case "info":
        return "INFO";
      default:
        return "LOG";
    }
  };

  return (
    <div className="fixed top-20 right-6 z-[999] space-y-4 pointer-events-none">

      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`relative w-[320px] border ${getBorderColor(
            toast.type
          )} bg-[#0a0a0f] p-4 flex items-start gap-3 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300 ${getGlow(
            toast.type
          )}`}
        >

          {/* Left indicator bar */}
          <div
            className={`absolute left-0 top-0 h-full w-[2px] ${toast.type === "error"
                ? "bg-red-400"
                : toast.type === "success"
                  ? "bg-green-400"
                  : "bg-cyan-400"
              }`}
          />

          {/* Icon */}
          <div className={`mt-1 ${getIconColor(toast.type)}`}>
            {getIcon(toast.type)}
          </div>

          {/* Content */}
          <div className="flex-1">
            <p className="text-[10px] tracking-[0.25em] text-slate-500 mb-1">
              {getLabel(toast.type)}
            </p>

            <p className="text-sm text-white leading-snug">
              {toast.message}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-500 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
