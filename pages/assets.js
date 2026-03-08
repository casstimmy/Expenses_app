import React, { useState, useEffect } from "react";
import Head from "next/head";
import AssetSection from "../components/AssetSection";

export default function AssetManagement() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const staff = localStorage.getItem("staff");
    setIsLoggedIn(!!staff);
  }, []);

  return (
    <>
      <Head>
        <title>Asset Management — BizSuits</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              BizSuits™
            </span>
          </div>
        </header>
        <div className="max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
          <AssetSection isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </>
  );
}
