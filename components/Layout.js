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
      (p) => routerRef.current.pathname === p || routerRef.current.pathname.startsWith("/memo") || routerRef.current.pathname.startsWith("/onboarding") || routerRef.current.pathname.startsWith("/projects")
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
    <div className={`${inter.variable} font-sans min-h-screen overflow-x-hidden`}>
      <Nav />
      <main className="min-h-screen overflow-x-hidden bg-gray-50 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-4 sm:pb-6">
        {children}
      </main>
    </div>
  );
}
