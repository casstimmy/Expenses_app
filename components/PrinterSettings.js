import { useState, useEffect, useCallback } from "react";
import { Printer, CheckCircle, XCircle, AlertCircle, Settings, Zap, FileText } from "lucide-react";

const STORAGE_KEY = "printerSettings";

function loadSettings() {
  if (typeof window === "undefined") return getDefaults();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...getDefaults(), ...JSON.parse(stored) };
  } catch {}
  return getDefaults();
}

function getDefaults() {
  return {
    autoPrint: false,
    paperSize: "80mm",
    copies: 1,
    showDialog: true,
    fontSize: "normal",
  };
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export default function PrinterSettings({ isOpen, onClose }) {
  const [settings, setSettings] = useState(getDefaults);
  const [printerStatus, setPrinterStatus] = useState("checking"); // checking, connected, disconnected, unknown
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  // Load settings on mount
  useEffect(() => {
    setSettings(loadSettings());
    checkPrinterStatus();
  }, []);

  // Persist settings on change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const checkPrinterStatus = useCallback(() => {
    setPrinterStatus("checking");
    // Use matchMedia to detect if a print device is available
    try {
      if (typeof window !== "undefined" && window.matchMedia) {
        // We can check if print media is supported
        const printQuery = window.matchMedia("print");
        // If the browser supports printing, it has access to the print subsystem
        if (printQuery !== undefined) {
          setPrinterStatus("connected");
        } else {
          setPrinterStatus("unknown");
        }
      } else {
        setPrinterStatus("unknown");
      }
    } catch {
      setPrinterStatus("disconnected");
    }
  }, []);

  const handleTestConnection = useCallback(() => {
    setTesting(true);
    setTestResult(null);

    // Create a hidden iframe, write test content, and attempt to print
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 20px; text-align: center; }
              h2 { color: #2563eb; margin-bottom: 10px; }
              p { color: #374151; font-size: 14px; }
              .line { border-top: 1px dashed #d1d5db; margin: 15px 0; }
            </style>
          </head>
          <body>
            <h2>BizSuits - Printer Test</h2>
            <div class="line"></div>
            <p>Printer connection successful!</p>
            <p>Date: ${new Date().toLocaleString()}</p>
            <div class="line"></div>
            <p style="font-size:12px; color:#9ca3af;">This is a test print from BizSuits POS</p>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.print();
          setTestResult("success");
          setPrinterStatus("connected");
        } catch {
          setTestResult("error");
          setPrinterStatus("disconnected");
        }
        setTesting(false);
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 300);
    } else {
      setTesting(false);
      setTestResult("error");
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  const statusConfig = {
    checking: { icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-50", label: "Checking..." },
    connected: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", label: "Connected" },
    disconnected: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", label: "Disconnected" },
    unknown: { icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-50", label: "Unknown" },
  };

  const sc = statusConfig[printerStatus];
  const StatusIcon = sc.icon;

  return (
    <div className="space-y-4">
      {/* Printer Status */}
      <div className={`flex items-center gap-3 p-3 rounded-xl ${sc.bg} border border-gray-200`}>
        <div className={`p-2 rounded-full ${sc.bg}`}>
          <StatusIcon size={20} className={sc.color} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">Printer Status</p>
          <p className={`text-xs font-medium ${sc.color}`}>{sc.label}</p>
        </div>
        <button
          onClick={checkPrinterStatus}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
        >
          Refresh
        </button>
      </div>

      {/* Test Connection */}
      <button
        onClick={handleTestConnection}
        disabled={testing}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {testing ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Zap size={16} />
        )}
        {testing ? "Sending Test Print..." : "Test Connection"}
      </button>

      {testResult === "success" && (
        <p className="text-xs text-green-600 font-medium text-center">
          Test print sent successfully! Check your printer.
        </p>
      )}
      {testResult === "error" && (
        <p className="text-xs text-red-500 font-medium text-center">
          Could not connect to printer. Check your printer is turned on and connected.
        </p>
      )}

      {/* Settings */}
      <div className="space-y-3 border-t border-gray-200 pt-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Settings size={12} /> Print Settings
        </h4>

        {/* Auto Print without dialog */}
        <label className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-800">Auto Print without dialog</p>
            <p className="text-xs text-gray-500">Skip the system print dialog</p>
          </div>
          <div
            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
              settings.autoPrint ? "bg-blue-600" : "bg-gray-300"
            }`}
            onClick={() => updateSetting("autoPrint", !settings.autoPrint)}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.autoPrint ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
        </label>

        {/* Show Print Dialog */}
        <label className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-800">Show Print Preview</p>
            <p className="text-xs text-gray-500">Display preview before printing</p>
          </div>
          <div
            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
              settings.showDialog ? "bg-blue-600" : "bg-gray-300"
            }`}
            onClick={() => updateSetting("showDialog", !settings.showDialog)}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.showDialog ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
        </label>

        {/* Paper Size */}
        <div className="p-2 rounded-lg hover:bg-gray-50 transition">
          <p className="text-sm font-medium text-gray-800 mb-1">Paper Size</p>
          <select
            value={settings.paperSize}
            onChange={(e) => updateSetting("paperSize", e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="58mm">58mm (Thermal)</option>
            <option value="80mm">80mm (Thermal)</option>
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="p-2 rounded-lg hover:bg-gray-50 transition">
          <p className="text-sm font-medium text-gray-800 mb-1">Print Font Size</p>
          <select
            value={settings.fontSize}
            onChange={(e) => updateSetting("fontSize", e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="small">Small</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </div>

        {/* Copies */}
        <div className="p-2 rounded-lg hover:bg-gray-50 transition">
          <p className="text-sm font-medium text-gray-800 mb-1">Number of Copies</p>
          <input
            type="number"
            min={1}
            max={5}
            value={settings.copies}
            onChange={(e) => updateSetting("copies", Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
    </div>
  );
}

// Utility: Print content using stored settings
export function printContent(htmlContent, title = "Print") {
  const settings = loadSettings();
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  document.body.appendChild(iframe);

  const fontSizeMap = { small: "11px", normal: "13px", large: "15px" };
  const paperWidthMap = { "58mm": "58mm", "80mm": "80mm", A4: "210mm", Letter: "216mm" };

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: ${paperWidthMap[settings.paperSize] || "80mm"} auto;
            margin: 4mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: ${fontSizeMap[settings.fontSize] || "13px"};
            color: #000;
            margin: 0;
            padding: 8px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 4px 6px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { font-weight: 600; font-size: 0.85em; text-transform: uppercase; color: #6b7280; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .text-green { color: #15803d; }
          .text-red { color: #dc2626; }
          .divider { border-top: 1px dashed #d1d5db; margin: 8px 0; }
          .header { text-align: center; margin-bottom: 10px; }
          .header img { max-width: 120px; margin: 0 auto 6px; display: block; }
          .header h2 { margin: 0; font-size: 1.1em; }
          .header p { margin: 2px 0; font-size: 0.8em; color: #6b7280; }
          .footer { text-align: center; font-size: 0.75em; color: #9ca3af; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #d1d5db; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `);
  doc.close();

  const copies = settings.copies || 1;
  setTimeout(() => {
    for (let i = 0; i < copies; i++) {
      iframe.contentWindow.print();
    }
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 300);
}
