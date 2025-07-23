import { useRouter } from "next/router";
import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";
import { toWords } from "number-to-words";
import PrintMemo from "@/components/PrintMemo";

export default function MemoPage() {
  const router = useRouter();
  const componentRef = useRef();
  const { id } = router.query;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
   const [timeoutTriggered, setTimeoutTriggered] = useState(false);
  const [form, setForm] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    amount: 0,
  });

  useEffect(() => {
    if (id) {
      axios.get(`/api/stock-orders/${id}`).then((res) => {
        const order = res.data.order; // ✅ grab the nested `order` field
        setOrder(order);

        const vendor = order.vendor || {}; // ✅ fallback to empty if not found
        setForm({
          accountName: vendor.accountName || "",
          accountNumber: vendor.accountNumber || "",
          bankName: vendor.bankName || "",
          amount: parseFloat(order.grandTotal || 0),
        });

        setLoading(false);
      });
    }
  }, [id]);

   useEffect(() => {
    if (downloading) {
      const timer = setTimeout(() => {
        setTimeoutTriggered(true);
        router.push("/paytracker"); // ✅ Redirect after timeout
      }, 15000); // 15 seconds timeout

      return () => clearTimeout(timer); // cleanup
    }
  }, [downloading]);



  if (loading) return <div className="p-10 text-center">Loading memo...</div>;
  if (!order)
    return <div className="p-10 text-center text-red-600">Memo not found.</div>;

  const amountInWords = `${toWords(form.amount).replace(/\b\w/g, (c) =>
    c.toUpperCase()
  )} Naira Only`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) : value,
    }));
  };

  return (
  <Layout>
    {/* Header with logo */}
    <PrintMemo
      ref={componentRef}
      order={order}
      form={form}
      editing={editing}
      handleChange={handleChange}
      onDownloading={setDownloading}
    />

    {/* Buttons */}
    <div className="mt-8 pb-10 px-4 print:hidden flex flex-roll sm:flex-roll sm:justify-end gap-4">
      {editing ? (
        <button
          onClick={() => setEditing(false)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto"
        >
          Save
        </button>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 w-full sm:w-auto"
        >
          Edit
        </button>
      )}

      <button
        onClick={() => {
          if (componentRef.current) componentRef.current.generatePDF();
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto"
      >
        {downloading ? "Downloading..." : "Download PDF"}
      </button>

      <button
        onClick={() => router.push("/expenses/Pay_Tracker")}
        className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 w-full sm:w-auto"
      >
        Back
      </button>
    </div>
  </Layout>
);

}
