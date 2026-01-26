import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import OrderMemo from "@/components/OrderMemo";

export default function OrderMemoPage() {
  const router = useRouter();
  const memoRef = useRef();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [downloading, setDownloading] = useState(false);


  console.log("Order ID:", id);



 useEffect(() => {
  if (!router.isReady || !id || typeof id !== "string") return;

  console.log("Order ID:", id);

  fetch(`/api/stock-orders/${id}`)
    .then((res) => {
      if (!res.ok) throw new Error("Order not found");
      return res.json();
    })
    .then((data) => setOrder(data.order))
    .catch((err) => console.error("Failed to load order:", err));
}, [id, router.isReady]);

if (!id) {
  return <div className="p-6 text-center text-gray-600">Preparing order...</div>;
}




  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center mb-6">
          <button
            onClick={() => memoRef.current?.generatePDF()}
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-md shadow transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={downloading}
          >
            {downloading ? (
              <>
                <svg
                  className="w-4 h-4 mr-2 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582M20 20v-5h-.581M4 4l5 5m0 0L4 14m5-5h10"
                  />
                </svg>
                Downloading...
              </>
            ) : (
              "Download PDF"
            )}
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 overflow-auto">
          {order ? (
            <OrderMemo
              ref={memoRef}
              order={order}
              onDownloading={setDownloading}
            />
          ) : (
            <p className="text-gray-500">Loading order details...</p>
          )}
        </div>
      </div>
    </div>
  );
}
