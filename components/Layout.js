import { Inter } from "next/font/google";
import { useRouter } from "next/router";
import { useEffect, useRef, useCallback } from "react";
import Nav from "@/components/Nav";
import { useToast } from "@/context/ToastContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Pages that don't require login
const PUBLIC_PATHS = ["/", "/expenses/getStarted"];

export default function Layout({ children }) {
  const router = useRouter();
  const { addToast } = useToast();
  const addToastRef = useRef(addToast);
  const routerRef = useRef(router);

  useEffect(() => { addToastRef.current = addToast; }, [addToast]);
  useEffect(() => { routerRef.current = router; }, [router]);

  // Redirect unauthenticated users away from protected pages
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isPublic = PUBLIC_PATHS.some(
      (p) => routerRef.current.pathname === p || routerRef.current.pathname.startsWith("/memo")
    );
    if (isPublic) return;

    const staff = localStorage.getItem("staff");
    if (!staff) {
      addToastRef.current("Please log in to continue", "warning");
      routerRef.current.replace("/");
    }
  }, [router.pathname]);

  // Global 401 interceptor — redirect to login on any unauthorized fetch
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 401) {
        const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
        // Only intercept our own API calls
        if (url.startsWith("/api/") && !url.includes("/api/staff/login")) {
          localStorage.removeItem("staff");
          addToastRef.current("Session expired. Please log in again.", "error");
          routerRef.current.replace("/");
        }
      }
      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <div className={`${inter.variable} font-sans`}>
      <Nav />
      <main className="px-4 sm:px-8 lg:px-16 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
}
