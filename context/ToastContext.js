// context/ToastContext.js — Lightweight toast notification system
import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

const ICONS = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

const COLORS = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  warning: "bg-amber-500 text-gray-900",
  info: "bg-blue-600",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Toast container — bottom-right */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium
              animate-toast-in cursor-pointer hover:opacity-90 transition-opacity max-w-xs
              ${COLORS[toast.type] || COLORS.info}`}
          >
            <span className="text-base leading-none">{ICONS[toast.type] || ICONS.info}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback so components work without provider during SSR/tests
    return {
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
}
