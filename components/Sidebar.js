import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  HelpCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from "lucide-react";
import PrinterSettings from "./PrinterSettings";
import POSAssistant from "./POSAssistant";

const SIDEBAR_KEY = "sidebarState";

function loadSidebarState() {
  if (typeof window === "undefined") return { collapsed: true, sections: {}, contentScale: "normal" };
  try {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { collapsed: true, sections: {}, contentScale: "normal" };
}

function saveSidebarState(state) {
  try {
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(state));
  } catch {}
}

const SCALE_OPTIONS = [
  { key: "compact", label: "Compact", value: "max-w-5xl", icon: Minimize2 },
  { key: "normal", label: "Normal", value: "max-w-7xl", icon: null },
  { key: "wide", label: "Wide", value: "max-w-[1400px]", icon: null },
  { key: "full", label: "Full Width", value: "max-w-full", icon: Maximize2 },
];

export default function Sidebar({ onScaleChange }) {
  const [collapsed, setCollapsed] = useState(true);
  const [openSections, setOpenSections] = useState({});
  const [contentScale, setContentScale] = useState("normal");
  const [showAssistant, setShowAssistant] = useState(false);

  // Load state on mount
  useEffect(() => {
    const saved = loadSidebarState();
    setCollapsed(saved.collapsed ?? true);
    setOpenSections(saved.sections || {});
    setContentScale(saved.contentScale || "normal");
    if (onScaleChange) {
      const scale = SCALE_OPTIONS.find((s) => s.key === (saved.contentScale || "normal"));
      onScaleChange(scale?.value || "max-w-7xl");
    }
  }, []);

  // Persist state on change
  useEffect(() => {
    saveSidebarState({ collapsed, sections: openSections, contentScale });
  }, [collapsed, openSections, contentScale]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleScaleChange = (key) => {
    setContentScale(key);
    const scale = SCALE_OPTIONS.find((s) => s.key === key);
    if (onScaleChange && scale) onScaleChange(scale.value);
  };

  return (
    <>
      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 shadow-lg z-40 transition-all duration-300 ease-in-out flex flex-col ${
          collapsed ? "w-12" : "w-72"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-4 w-6 h-6 bg-white border border-gray-300 rounded-full shadow-md flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition z-50"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} className="text-gray-600" /> : <ChevronLeft size={14} className="text-gray-600" />}
        </button>

        {/* Collapsed icons */}
        {collapsed && (
          <div className="flex flex-col items-center gap-3 pt-10">
            <button
              onClick={() => { setCollapsed(false); setOpenSections((p) => ({ ...p, printer: true })); }}
              className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-blue-600"
              title="Printer Settings"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={() => { setCollapsed(false); setOpenSections((p) => ({ ...p, display: true })); }}
              className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-blue-600"
              title="Display Settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => setShowAssistant(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-blue-600"
              title="Help & Support"
            >
              <HelpCircle size={18} />
            </button>
          </div>
        )}

        {/* Expanded content */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto pt-10 px-3 pb-4 space-y-2">
            {/* ── Printer Settings Section ── */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("printer")}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-2">
                  <Printer size={16} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">Printer Settings</span>
                </div>
                {openSections.printer ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>
              {openSections.printer && (
                <div className="px-3 py-3 border-t border-gray-100">
                  <PrinterSettings isOpen={true} />
                </div>
              )}
            </div>

            {/* ── Display & Layout Section ── */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("display")}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-2">
                  <Settings size={16} className="text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">Display & Layout</span>
                </div>
                {openSections.display ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>
              {openSections.display && (
                <div className="px-3 py-3 border-t border-gray-100 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Content Width</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SCALE_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => handleScaleChange(opt.key)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition border ${
                          contentScale === opt.key
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-blue-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Adjusts the main content area width across all pages.
                  </p>
                </div>
              )}
            </div>

            {/* ── Help & Support Section ── */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("help")}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle size={16} className="text-green-600" />
                  <span className="text-sm font-semibold text-gray-700">Help & Support</span>
                </div>
                {openSections.help ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>
              {openSections.help && (
                <div className="px-3 py-3 border-t border-gray-100 space-y-3">
                  <p className="text-xs text-gray-600">
                    Need help with the system? Open the POS Assistant for quick answers and guidance.
                  </p>
                  <button
                    onClick={() => setShowAssistant(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-medium"
                  >
                    <HelpCircle size={16} />
                    Open POS Assistant
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* POS Assistant - only shows when explicitly opened */}
      <POSAssistant isOpen={showAssistant} onClose={() => setShowAssistant(false)} />
    </>
  );
}
