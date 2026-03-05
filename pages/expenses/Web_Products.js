import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import WebProductCenter from "@/components/WebProduct/WebProductCenter";

export default function WebProducts() {
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("staff");
    if (stored) {
      setStaff(JSON.parse(stored));
    }
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-4 sm:mb-6">
            Web Product Center
          </h1>

          {staff && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-200 shadow-sm">
              <p className="text-sm text-blue-900 font-medium">
                Logged in as{" "}
                <span className="text-blue-800 font-semibold">{staff?.name}</span>
                &nbsp;|&nbsp; Location:{" "}
                <span className="text-blue-800 font-semibold">{staff?.location}</span>
              </p>
            </div>
          )}

          <WebProductCenter />
        </div>
      </div>
    </Layout>
  );
}
