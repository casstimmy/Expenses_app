import { Inter } from "next/font/google";
import Nav from "@/components/Nav";


const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function Layout({ children }) {
  return (
    <div className={`${inter.variable} font-sans`}>
      {/* Top Navigation */}
      <Nav />
      {/* Main Content Area */}
      <main className="px-4 sm:px-8 lg:px-16 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
}
