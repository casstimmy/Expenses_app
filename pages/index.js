import Layout from "@/components/Layout";
import Link from "next/link";
import Particles from "react-particles";
import { useMemo, useState, useEffect } from "react";
import { loadBasic } from "tsparticles-basic";
import { useRouter } from "next/router";

export default function Home({ staffList, locations }) {
  const [name, setName] = useState(staffList?.[0] || "");
  const [location, setLocation] = useState(locations?.[0] || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("staff");
  }, []);

  const particlesOptions = useMemo(
    () => ({
      background: { color: { value: "#f0f4f8" } },
      fpsLimit: 60,
      interactivity: {
        events: { onHover: { enable: true, mode: "repulse" }, resize: true },
        modes: { repulse: { distance: 100, duration: 0.4 } },
      },
      particles: {
        color: { value: "#3b82f6" },
        links: {
          color: "#3b82f6",
          distance: 150,
          enable: true,
          opacity: 0.3,
          width: 1,
        },
        move: { enable: true, speed: 1, outModes: { default: "bounce" } },
        number: { value: 40 },
        opacity: { value: 0.4 },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 5 } },
      },
      detectRetina: true,
    }),
    []
  );

  const particlesInit = async (engine) => {
    await loadBasic(engine);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length !== 4) {
      setError("PIN must be 4 digits.");
      return;
    }

    const res = await fetch("/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("staff", JSON.stringify({ ...data, location }));
      router.push("/expenses/expenses");
    } else {
      const err = await res.json();
      setError(err.message || "Login failed");
      setPassword("");
    }
  };

  const handleKeypad = (value) => {
    if (value === "clear") {
      setPassword("");
    } else if (value === "back") {
      setPassword((prev) => prev.slice(0, -1));
    } else if (password.length < 4) {
      setPassword((prev) => prev + value);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-auto relative">
        {/* Particle Background */}
        <div className="absolute inset-0 z-0">
          <Particles id="tsparticles" init={particlesInit} options={particlesOptions} />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-20 py-8 sm:py-12">
          <div className="w-full flex flex-col lg:flex-row items-center justify-between max-w-7xl">
            {/* Hero Section */}
            <div className="text-center lg:text-left lg:w-1/2 mb-10 sm:mb-12 lg:mb-0 animate-fade-in px-2 sm:px-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-800 mb-4 drop-shadow">
                Ibile Expense
              </h1>
              <p className="text-base sm:text-lg text-gray-700 mb-6 max-w-xl mx-auto lg:mx-0">
                Simple, powerful cash expense tracking for your business or personal use.
              </p>
              <Link
                href="/expenses/getStarted"
                className="inline-block bg-blue-600 text-white text-sm sm:text-base font-semibold px-6 py-3 rounded-full shadow hover:bg-blue-700 transition duration-300"
              >
                ➤ Get Started
              </Link>
            </div>

            {/* Login Box */}
            <div className="w-full max-w-sm bg-white rounded-xl shadow-md px-6 py-8 sm:px-8 animate-fade-in">
              <h2 className="text-xl sm:text-2xl font-bold text-center text-blue-700 mb-6">
                Staff Login
              </h2>
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff Name
                  </label>
                  <select
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.isArray(staffList) &&
                      staffList.map((staff) => (
                        <option key={staff} value={staff}>
                          {staff}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.isArray(locations) &&
                      locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password (PIN)
                  </label>
                  <div className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-lg tracking-widest select-none flex items-center">
                    {"•".repeat(password.length)}
                  </div>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3 my-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, "clear", 0, "back"].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeypad(key)}
                      className="bg-blue-100 hover:bg-blue-300 text-blue-800 font-bold py-3 sm:py-2 rounded-lg text-lg sm:text-base"
                    >
                      {key === "clear" ? "C" : key === "back" ? "←" : key}
                    </button>
                  ))}
                </div>

                {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 sm:py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm sm:text-base"
                >
                  Log in
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-4">
                Don’t have an account?{" "}
                <span className="text-blue-600 hover:underline cursor-pointer">
                  Contact Admin
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 mb-10 sm:mb-20 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-500 mb-1">
              Built with <span className="text-red-500">❤️</span> by{" "}
              <span className="text-blue-600 font-semibold tracking-wide">
                Hetch Tech
              </span>
            </p>
            <p className="text-xs sm:text-sm text-gray-400">
              &copy; {new Date().getFullYear()} <strong>Ibile Expense</strong>. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  const { mongooseConnect } = await import("@/lib/mongoose");
  const Staff = (await import("@/models/Staff")).Staff;

  await mongooseConnect();
  const staffDocs = await Staff.find({}, "name");
  const staffList = staffDocs.map((s) => s.name);

  const locations = ["Ibile 1", "Ibile 2"];

  return {
    props: {
      staffList,
      locations,
    },
  };
}
