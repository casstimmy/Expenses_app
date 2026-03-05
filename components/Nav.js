import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Menu, X, LogOut } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/context/ToastContext";

export default function Nav() {
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [staffName, setStaffName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { addToast } = useToast();

  const router = useRouter();
  const { pathname } = router;

  useEffect(() => {
    const stored = localStorage.getItem("staff");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRole(parsed.role);
        setStaffName(parsed.name || "");
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }

    const handleStart = () => setLoading(true);
    const handleStop = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/staff/logout", { method: "POST" });
    } catch {
      // Cookie clear failed — still log out locally
    }
    localStorage.removeItem("staff");
    setIsLoggedIn(false);
    setRole(null);
    setStaffName("");
    addToast("Logged out successfully", "info");
    router.push("/");
  }, [router, addToast]);

  let navLinks = [
    { href: "/expenses/expenses", label: "Expenses", icon: "📊" },
    { href: "/expenses/Stock_Order", label: "Vendors", icon: "📦" },
    { href: "/expenses/Web_Products", label: "Web Products", icon: "🌐" },
  ];

  if (role === "admin" || role === "Senior staff") {
    navLinks.push(
      { href: "/expenses/analysis", label: "Reports", icon: "📈" },
      { href: "/categories", label: "Categories", icon: "🏷️" },
      { href: "/expenses/Pay_Tracker", label: "Pay Tracker", icon: "💳" },
      { href: "/admin/staff", label: "Staff", icon: "👥" }
    );
  } else if (role === "account") {
    navLinks.push(
      { href: "/expenses/Pay_Tracker", label: "Pay Tracker", icon: "💳" },
      { href: "/admin/staff", label: "Staff", icon: "👥" }
    );
  }

  const isActive = (href) => pathname.startsWith(href);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gradient-to-r from-white/90 to-blue-50/90 shadow-md border-b border-gray-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 bg-clip-text text-transparent drop-shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:brightness-110"
            >
              <Image
                src="/image/Logo.png"
                alt="BizSuits Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
              <span className="select-none">BizSuits™</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-1">
              {isLoggedIn &&
                navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative text-sm font-medium transition-all duration-200 ease-in-out px-3 py-2 rounded-lg ${
                      isActive(link.href)
                        ? "text-blue-700 bg-blue-50"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/60"
                    }`}
                  >
                    <span className="relative z-10">{link.label}</span>
                    {isActive(link.href) && (
                      <span className="absolute left-1/2 -translate-x-1/2 -bottom-[9px] w-6 h-[3px] bg-blue-600 rounded-full" />
                    )}
                  </Link>
                ))}

              {isLoggedIn && (
                <div className="flex items-center ml-4 pl-4 border-l border-gray-200 gap-3">
                  <span className="text-xs text-gray-500 font-medium hidden lg:block">
                    {staffName}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all duration-200"
                  >
                    <LogOut size={16} />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </div>
              )}
            </nav>

            {/* Mobile Button */}
            <div className="md:hidden flex items-center gap-2">
              {isLoggedIn && staffName && (
                <span className="text-xs text-gray-500 font-medium max-w-[80px] truncate">
                  {staffName}
                </span>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-blue-700 transition p-1 rounded-lg hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white/95 shadow-inner border-t border-gray-200 px-4 py-3 space-y-1">
            {isLoggedIn &&
              navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 text-base font-medium px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </Link>
              ))}

            {isLoggedIn && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 w-full text-left text-base font-medium text-red-600 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all duration-200 mt-1"
              >
                <LogOut size={18} />
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16" />

      {/* Route-change loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-[3px] border-white border-t-blue-600 rounded-full animate-spin" />
            <span className="text-white text-sm font-medium drop-shadow">Loading...</span>
          </div>
        </div>
      )}
    </>
  );
}
