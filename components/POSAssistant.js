import { useState, useRef, useEffect } from "react";
import { X, Send, HelpCircle } from "lucide-react";

const FAQ_DATA = [
  {
    q: "How do I add an expense?",
    a: "Go to Expenses page, fill in the title, amount, select a category, then click Save. The expense will be recorded under today's date and your location.",
  },
  {
    q: "How do I close the till?",
    a: "Navigate to Reports (Analysis page), select today's date and your location. Scroll down to the End of Day Report section and click 'Close Till'. This will print your EOD summary.",
  },
  {
    q: "How do I check printer status?",
    a: "Open the sidebar and go to 'Printer Settings'. You'll see the current printer connection status and can test the connection or adjust print preferences.",
  },
  {
    q: "How do I add daily cash?",
    a: "On the Expenses page, use the 'Add Cash for the Day' section at the top. Enter the date and amount, then click Save.",
  },
  {
    q: "How do I view reports?",
    a: "Go to Reports page. Select a date and location to see Cash Received, Expenses, Cash at Hand, and the full End of Day Report with payment breakdown.",
  },
  {
    q: "How do I place a stock order?",
    a: "Go to Vendors page, select a vendor, add products with quantities and prices, then submit the order.",
  },
  {
    q: "How do I export data?",
    a: "On the Reports page, use the Export to PDF or Export to Excel buttons to download your expense data.",
  },
  {
    q: "How do I edit an expense?",
    a: "On the Expenses page, find the expense you want to edit (admin only), click the Edit button, make changes, then click Save.",
  },
];

export default function POSAssistant({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm the POS Assistant. How can I help you today? You can ask me questions or tap a topic below.",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const q = input.trim();
    if (!q) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");

    // Simple keyword matching for answers
    const lower = q.toLowerCase();
    const match = FAQ_DATA.find(
      (f) =>
        f.q.toLowerCase().includes(lower) ||
        lower.includes(f.q.toLowerCase().split(" ").slice(2).join(" ")) ||
        f.q
          .toLowerCase()
          .split(" ")
          .some((word) => word.length > 3 && lower.includes(word))
    );

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: match
            ? match.a
            : "I'm not sure about that. Try asking about expenses, daily cash, reports, stock orders, printer settings, or closing the till.",
        },
      ]);
    }, 400);
  };

  const handleQuickQuestion = (faq) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: faq.q },
      { role: "assistant", text: faq.a },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[100] animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <HelpCircle size={20} className="text-white" />
          <h3 className="text-white font-semibold text-sm">POS Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white text-gray-700 border border-gray-200 rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {/* Quick Questions */}
        {messages.length <= 2 && (
          <div className="space-y-1.5 pt-2">
            <p className="text-xs text-gray-500 font-medium">Quick questions:</p>
            {FAQ_DATA.slice(0, 5).map((faq, i) => (
              <button
                key={i}
                onClick={() => handleQuickQuestion(faq)}
                className="block w-full text-left text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-blue-50 hover:border-blue-200 transition text-gray-700"
              >
                {faq.q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white rounded-b-2xl">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
