import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export default function Nav() {
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const router = useRouter();
  const { pathname } = router;

  useEffect(() => {
    const stored = localStorage.getItem("staff");
    if (stored) {
      const parsed = JSON.parse(stored);
      setRole(parsed.role);
      setIsLoggedIn(true); // ✅ mark as logged in
    } else {
      setIsLoggedIn(false); // ❌ no login
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

  let navLinks = [
    { href: "/expenses/expenses", label: "Expenses" },
    { href: "/expenses/Stock_Order", label: "Inventory" },
  ];

  if (role === "admin" || role === "Senior staff") {
    navLinks.push(
      { href: "/expenses/analysis", label: "Reports" },
      { href: "/categories", label: "Categories" },
      { href: "/expenses/Pay_Tracker", label: "Pay Tracker" },
      { href: "/admin/staff", label: "Staff" }
    );
  } else if (role === "account") {
    navLinks.push(
      { href: "/expenses/Pay_Tracker", label: "Pay Tracker" },
      { href: "/admin/staff", label: "Staff" },

    );
  }

  const isActive = (href) => pathname.startsWith(href);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gradient-to-r from-white/90 to-blue-50/90 shadow-md border-b border-gray-200 transition-all">
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
            <nav className="hidden md:flex items-center space-x-6">
              {isLoggedIn &&
                navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative text-sm font-medium transition-all duration-200 ease-in-out px-2 py-1 ${
                      isActive(link.href)
                        ? "text-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                  >
                    <span className="relative z-10">{link.label}</span>
                    {isActive(link.href) && (
                      <span className="absolute left-0 bottom-0 w-full h-[2px] bg-blue-600 rounded-full transition-all" />
                    )}
                  </Link>
                ))}
              {isLoggedIn && (
                <button
                  onClick={() => {
                    localStorage.removeItem("staff");
                    router.push("/"); // log out and redirect
                  }}
                  className="text-sm text-red-500 hover:underline ml-4"
                >
                  Logout
                </button>
              )}
            </nav>

            {/* Mobile Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-blue-700 transition"
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 shadow border-t border-gray-200">
            <div className="px-4 py-4 space-y-2">
              {isLoggedIn &&
                navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block text-base font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(link.href)
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

              {/* 🔴 Logout button for mobile */}
              {isLoggedIn && (
                <button
                  onClick={() => {
                    localStorage.removeItem("staff");
                    setIsMobileMenuOpen(false);
                    router.push("/");
                  }}
                  className="block w-full text-left text-base font-medium text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Spacer */}
      <div className="h-16" />

      {/* Optional Loading Spinner */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-white border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </>
  );
}
