import { useRouter } from "next/router";
import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import { toWords } from "number-to-words";
import PrintMemo from "@/components/PrintMemo";

const accountOptions = [
  { value: "1239069143", label: "1239069143 - IBILE TRADING RESOURCES LIMITED" },
  { value: "1400837182", label: "1400837182 - IBILE SAVINGS ACCOUNT" },
];

export default function MemoPage() {
  const router = useRouter();
  const componentRef = useRef();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(accountOptions[0].value);
  const [originalForm, setOriginalForm] = useState(null);

  const [form, setForm] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    amount: 0,
  });

  useEffect(() => {
  if (id) {
    axios.get(`/api/stock-orders/${id}`).then((res) => {
      const order = res.data.order;
      setOrder(order);

      const vendor = order.vendor || {};
      const initialForm = {
        accountName: vendor.accountName || "",
        accountNumber: vendor.accountNumber || "",
        bankName: vendor.bankName || "",
        amount: parseFloat(order.grandTotal || 0),
      };

      setForm(initialForm);
      setOriginalForm(initialForm); // 👈 Store a copy for reverting
      setLoading(false);
    });
  }
}, [id]);


  useEffect(() => {
    if (downloading) {
      const timer = setTimeout(() => {
        setTimeoutTriggered(true);
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [downloading]);

  if (loading) return <div className="p-10 text-center">Loading memo...</div>;
  if (!order)
    return <div className="p-10 text-center text-red-600">Memo not found.</div>;

  const amountInWords = form.amount && !isNaN(Number(form.amount))
  ? `${toWords(Number(form.amount)).replace(/\b\w/g, (c) => c.toUpperCase())} Naira Only`
  : "";


  const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "amount" || name === "accountNumber") {
    // Only allow digits and empty string (to allow clearing)
    if (!/^\d*$/.test(value)) return;
  } else if (name === "accountName" || name === "bankName") {
    // Only allow letters and spaces
    if (!/^[a-zA-Z\s]*$/.test(value)) return;
  }

  setForm((prev) => ({
    ...prev,
    [name]: name === "amount" ? parseFloat(value) || "" : value,
  }));
};


  const handleSave = () => {
  setForm((prev) => {
    const updated = {
      accountName: prev.accountName.trim() || originalForm.accountName,
      accountNumber: prev.accountNumber.trim() || originalForm.accountNumber,
      bankName: prev.bankName.trim() || originalForm.bankName,
      amount: prev.amount || originalForm.amount,
    };
    return updated;
  });

  setEditing(false);
};



  return (
    <>
      {/* Buttons */}
      <div className="mt-8 print:hidden flex flex-col sm:flex-row justify-center items-center gap-4">
           <div className="flex flex-col w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Select Account:
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {accountOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
       
        {editing ? (
         <button aria-label="Save changes"
          onClick={handleSave}
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
      </div>

      {/* Header with logo */}
      <PrintMemo
        ref={componentRef}
        order={order}
        form={form}
        selectedAccount={selectedAccount}
          originalForm={originalForm}
        editing={editing}
        handleChange={handleChange}
        onDownloading={setDownloading}
      />
    </>
  );
}
