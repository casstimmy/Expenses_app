import { useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = [
  { value: "Ordered", label: "Ordered" },
  { value: "Paid", label: "Paid" },
  { value: "Cancelled", label: "Cancelled" },
];

const EMPTY_FORM = {
  vendor: "",
  purpose: "",
  description: "",
  quantity: "1",
  unitPrice: "",
  amount: "",
  location: "",
  requestDate: new Date().toISOString().slice(0, 10),
  neededBy: "",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatQuantity(value) {
  const quantity = Number(value || 0);

  if (!Number.isFinite(quantity)) return "0";
  if (Number.isInteger(quantity)) return String(quantity);

  return quantity.toFixed(2).replace(/\.0+$|0+$/g, "").replace(/\.$/, "");
}

function calculateOrderTotal(quantity, unitPrice) {
  const parsedQuantity = Number(quantity);
  const parsedUnitPrice = Number(unitPrice);

  if (!Number.isFinite(parsedQuantity) || !Number.isFinite(parsedUnitPrice)) {
    return 0;
  }

  return Math.max(parsedQuantity, 0) * Math.max(parsedUnitPrice, 0);
}

function getTransactionQuantity(transaction) {
  const quantity = Number(transaction?.quantity);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function getTransactionUnitPrice(transaction) {
  const unitPrice = Number(transaction?.unitPrice);

  if (Number.isFinite(unitPrice) && unitPrice > 0) {
    return unitPrice;
  }

  const quantity = getTransactionQuantity(transaction);
  const amount = Number(transaction?.amount || 0);

  return quantity > 0 ? amount / quantity : amount;
}

function escapeCsvValue(value) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(normalized)
    ? `"${normalized.replace(/"/g, '""')}"`
    : normalized;
}

function normalizeHistoryEntry(entry) {
  if (!entry) return null;

  return {
    ...entry,
    at: entry.actedAt || entry.at || null,
    staff: entry.actedBy !== undefined ? entry.actedBy : entry.staff || null,
  };
}

function toDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function buildEditForm(transaction) {
  const quantity = getTransactionQuantity(transaction);
  const unitPrice = getTransactionUnitPrice(transaction);

  return {
    vendor: String(transaction?.vendor?._id || transaction?.vendor || ""),
    purpose: transaction?.purpose || "",
    description: transaction?.description || "",
    quantity: String(quantity),
    unitPrice: String(unitPrice),
    amount: String(Number(transaction?.amount || calculateOrderTotal(quantity, unitPrice)) || ""),
    location: transaction?.location || "",
    requestDate: toDateInputValue(transaction?.requestDate),
    neededBy: toDateInputValue(transaction?.neededBy),
  };
}

function formatDate(value) {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-NG", {
    dateStyle: "medium",
  });
}

function formatDateTime(value) {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function normalizeStatus(status) {
  if (status === "Paid") return "Paid";
  if (status === "Cancelled" || status === "Rejected") return "Cancelled";
  return "Ordered";
}

function getStatusBadgeClass(status) {
  switch (normalizeStatus(status)) {
    case "Paid":
      return "bg-emerald-100 text-emerald-700";
    case "Cancelled":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getActionLabel(action) {
  switch (action) {
    case "update-details":
      return "Order Updated";
    case "ordered":
    case "created":
      return "Order Logged";
    case "mark-paid":
      return "Payment Recorded";
    case "cancel":
      return "Order Cancelled";
    case "reopen":
      return "Order Reopened";
    case "approve":
      return "Legacy Approval";
    case "reject":
      return "Legacy Rejection";
    default:
      return String(action || "Updated").replace(/-/g, " ");
  }
}

function buildBreakdownRows(items, getLabel) {
  const rows = new Map();

  items.forEach((item) => {
    const label = getLabel(item) || "Unspecified";
    const amount = Number(item.amount || 0);
    const status = normalizeStatus(item.status);

    if (!rows.has(label)) {
      rows.set(label, {
        label,
        count: 0,
        amount: 0,
        openAmount: 0,
        paidAmount: 0,
      });
    }

    const row = rows.get(label);
    row.count += 1;
    row.amount += amount;

    if (status === "Paid") {
      row.paidAmount += amount;
    }

    if (status === "Ordered") {
      row.openAmount += amount;
    }
  });

  return Array.from(rows.values()).sort((left, right) => right.amount - left.amount);
}

export default function PettyCashTransactionPanel({ vendors, staff, orderPrefill }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actioningKey, setActioningKey] = useState("");
  const [editingTransactionId, setEditingTransactionId] = useState("");
  const [editForm, setEditForm] = useState(null);
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    location: staff?.location || "",
  }));
  const [vendorFilter, setVendorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/petty-cash-transactions");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load petty cash transactions");
      }

      const nextTransactions = Array.isArray(data) ? data : data.transactions;
      setTransactions(Array.isArray(nextTransactions) ? nextTransactions : []);
    } catch (error) {
      console.error("Failed to load petty cash transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (staff?.location) {
      setForm((prev) => ({
        ...prev,
        location: prev.location || staff.location,
      }));
    }
  }, [staff?.location]);

  useEffect(() => {
    if (!orderPrefill?.vendorId) return;

    setForm((prev) => ({
      ...prev,
      vendor: orderPrefill.vendorId,
      location: prev.location || staff?.location || "",
      purpose: prev.vendor === orderPrefill.vendorId ? prev.purpose : "",
      quantity: prev.vendor === orderPrefill.vendorId ? prev.quantity : "1",
      unitPrice: prev.vendor === orderPrefill.vendorId ? prev.unitPrice : "",
      amount: prev.vendor === orderPrefill.vendorId ? prev.amount : "",
    }));

    if (typeof document !== "undefined") {
      document
        .getElementById("petty-cash-order-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [orderPrefill?.requestedAt, orderPrefill?.vendorId, staff?.location]);

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => String(vendor._id) === String(form.vendor)) || null,
    [form.vendor, vendors]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (vendorFilter && String(transaction.vendor?._id || transaction.vendor) !== vendorFilter) {
        return false;
      }

      if (statusFilter && normalizeStatus(transaction.status) !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, statusFilter, vendorFilter]);

  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction.amount || 0);
        const normalizedStatus = normalizeStatus(transaction.status);

        acc.totalCount += 1;
        acc.totalAmount += amount;

        if (normalizedStatus === "Ordered") {
          acc.openCount += 1;
          acc.openAmount += amount;
        }

        if (normalizedStatus === "Paid") {
          acc.paidCount += 1;
          acc.paidAmount += amount;
        }

        if (normalizedStatus === "Cancelled") {
          acc.cancelledCount += 1;
        }

        return acc;
      },
      {
        totalCount: 0,
        totalAmount: 0,
        openCount: 0,
        openAmount: 0,
        paidCount: 0,
        paidAmount: 0,
        cancelledCount: 0,
      }
    );
  }, [filteredTransactions]);

  const dashboardRows = useMemo(() => {
    return {
      byLocation: buildBreakdownRows(filteredTransactions, (transaction) => transaction.location),
      byVendor: buildBreakdownRows(
        filteredTransactions,
        (transaction) => transaction.vendorName || transaction.vendor?.companyName
      ),
      byStatus: buildBreakdownRows(filteredTransactions, (transaction) =>
        normalizeStatus(transaction.status)
      ),
    };
  }, [filteredTransactions]);

  const paidTransactions = useMemo(() => {
    return filteredTransactions
      .filter((transaction) => normalizeStatus(transaction.status) === "Paid")
      .slice()
      .sort(
        (left, right) =>
          new Date(right.paidAt || right.updatedAt || right.createdAt) -
          new Date(left.paidAt || left.updatedAt || left.createdAt)
      );
  }, [filteredTransactions]);

  const paidSummary = useMemo(() => {
    return paidTransactions.reduce(
      (acc, transaction) => {
        acc.totalAmount += Number(transaction.amount || 0);
        acc.vendorNames.add(transaction.vendorName || transaction.vendor?.companyName || "Unknown");
        return acc;
      },
      {
        totalAmount: 0,
        vendorNames: new Set(),
      }
    );
  }, [paidTransactions]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "quantity" || name === "unitPrice") {
        const nextAmount = calculateOrderTotal(next.quantity, next.unitPrice);
        next.amount = nextAmount > 0 ? String(nextAmount) : "";
      }

      return next;
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((prev) => {
      if (!prev) return prev;

      const next = { ...prev, [name]: value };

      if (name === "quantity" || name === "unitPrice") {
        const nextAmount = calculateOrderTotal(next.quantity, next.unitPrice);
        next.amount = nextAmount > 0 ? String(nextAmount) : "";
      }

      return next;
    });
  };

  const startEditingTransaction = (transaction) => {
    setEditingTransactionId(transaction._id);
    setEditForm(buildEditForm(transaction));
  };

  const cancelEditingTransaction = () => {
    setEditingTransactionId("");
    setEditForm(null);
  };

  const saveEditedTransaction = async (transactionId) => {
    if (!editForm) return;

    const parsedQuantity = Number(editForm.quantity);
    const parsedUnitPrice = Number(editForm.unitPrice);
    const totalAmount = calculateOrderTotal(editForm.quantity, editForm.unitPrice);

    if (
      !editForm.vendor ||
      !String(editForm.purpose || "").trim() ||
      !String(editForm.location || "").trim() ||
      !editForm.requestDate ||
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0 ||
      !Number.isFinite(parsedUnitPrice) ||
      parsedUnitPrice < 0 ||
      totalAmount <= 0
    ) {
      alert("Please complete the required order fields before saving your changes.");
      return;
    }

    const actionKey = `${transactionId}:update-details`;
    setActioningKey(actionKey);

    try {
      const response = await fetch(`/api/petty-cash-transactions/${transactionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-details",
          ...editForm,
          purpose: String(editForm.purpose || "").trim(),
          description: String(editForm.description || "").trim(),
          location: String(editForm.location || "").trim(),
          quantity: parsedQuantity,
          unitPrice: parsedUnitPrice,
          amount: totalAmount,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update vendor order");
      }

      await loadTransactions();
      cancelEditingTransaction();
    } catch (error) {
      console.error("Update petty cash order error:", error);
      alert(error.message || "Failed to update vendor order.");
    } finally {
      setActioningKey("");
    }
  };

  const fillFromVendorProduct = (productEntry) => {
    const productName = productEntry?.product?.name || "";
    const productPrice =
      productEntry?.price !== undefined && productEntry?.price !== null
        ? String(productEntry.price)
        : "";

    setForm((prev) => ({
      ...prev,
      purpose: productName || prev.purpose,
      quantity: "1",
      unitPrice: productPrice,
      amount: calculateOrderTotal(1, productPrice) > 0 ? String(calculateOrderTotal(1, productPrice)) : "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const totalAmount = calculateOrderTotal(form.quantity, form.unitPrice);
    const parsedQuantity = Number(form.quantity);
    const parsedUnitPrice = Number(form.unitPrice);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0 ||
      !Number.isFinite(parsedUnitPrice) ||
      parsedUnitPrice < 0 ||
      totalAmount <= 0
    ) {
      alert("Please enter a valid quantity and unit price before saving the order.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/petty-cash-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: parsedQuantity,
          unitPrice: parsedUnitPrice,
          amount: totalAmount,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to record vendor order");
      }

      setForm((prev) => ({
        ...EMPTY_FORM,
        vendor: prev.vendor,
        location: staff?.location || prev.location || "",
      }));
      await loadTransactions();
    } catch (error) {
      console.error("Create petty cash order error:", error);
      alert(error.message || "Failed to record vendor order.");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (transaction, action) => {
    const actionKey = `${transaction._id}:${action}`;
    setActioningKey(actionKey);

    const payload = { action };

    if (action === "mark-paid") {
      const paymentMethod = window.prompt(
        "Payment method (cash, transfer, cheque, etc.)",
        transaction.paymentMethod || "cash"
      );
      if (paymentMethod === null) {
        setActioningKey("");
        return;
      }

      const paymentReference = window.prompt(
        "Payment reference (optional)",
        transaction.paymentReference || ""
      );
      if (paymentReference === null) {
        setActioningKey("");
        return;
      }

      const note = window.prompt("Add a payment note (optional)", "");
      if (note === null) {
        setActioningKey("");
        return;
      }

      payload.paymentMethod = paymentMethod.trim() || "cash";
      payload.paymentReference = paymentReference.trim();
      payload.note = note.trim();
    }

    if (["cancel", "reopen"].includes(action)) {
      const promptLabel =
        action === "cancel"
          ? "Add a cancellation note (optional)"
          : "Add a reopen note (optional)";
      const note = window.prompt(promptLabel, "");
      if (note === null) {
        setActioningKey("");
        return;
      }

      payload.note = note.trim();
    }

    try {
      const response = await fetch(`/api/petty-cash-transactions/${transaction._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} vendor order`);
      }

      await loadTransactions();
    } catch (error) {
      console.error(`Petty cash ${action} error:`, error);
      alert(error.message || `Failed to ${action} vendor order.`);
    } finally {
      setActioningKey("");
    }
  };

  const handleExportPaidTransactions = () => {
    if (paidTransactions.length === 0 || typeof window === "undefined") {
      return;
    }

    const headers = [
      "Vendor",
      "Purpose",
      "Quantity",
      "Unit Price",
      "Total Amount",
      "Location",
      "Order Date",
      "Paid At",
      "Payment Method",
      "Payment Reference",
      "Logged By",
      "Paid By",
      "Note",
    ];

    const rows = paidTransactions.map((transaction) => [
      transaction.vendorName || transaction.vendor?.companyName || "",
      transaction.purpose || "",
      formatQuantity(getTransactionQuantity(transaction)),
      getTransactionUnitPrice(transaction),
      Number(transaction.amount || 0),
      transaction.location || "",
      transaction.requestDate ? new Date(transaction.requestDate).toISOString() : "",
      transaction.paidAt ? new Date(transaction.paidAt).toISOString() : "",
      transaction.paymentMethod || "",
      transaction.paymentReference || "",
      transaction.requestedBy?.name || "",
      transaction.paidBy?.name || "",
      transaction.description || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `petty-cash-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const coverageRate =
    summary.totalAmount > 0 ? Math.round((summary.paidAmount / summary.totalAmount) * 100) : 0;

  const breakdownSections = [
    ["By Location", dashboardRows.byLocation, "Where orders are being placed"],
    ["By Vendor", dashboardRows.byVendor, "Which petty cash vendors carry the load"],
    ["By Status", dashboardRows.byStatus, "Open, paid, and cancelled orders"],
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-blue-100 bg-white/95 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
              Vendor Orders
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Orders and Payments Dashboard
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Record petty cash vendor orders, keep an eye on outstanding balances,
              and mark payments as they are settled.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Filter Vendor
              </label>
              <select
                value={vendorFilter}
                onChange={(event) => setVendorFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="">All vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Filter Status
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Filtered Orders</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.totalCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700">Open Orders</p>
            <p className="mt-2 text-2xl font-semibold text-amber-900">{summary.openCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Paid Orders</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-900">{summary.paidCount}</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-700">Outstanding Value</p>
            <p className="mt-2 text-lg font-semibold text-blue-900">
              {formatCurrency(summary.openAmount)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <div
          id="petty-cash-order-form"
          className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-6"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
              Record Order
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Place Vendor Order</h3>
            <p className="mt-2 text-sm text-slate-600">
              Log a petty cash vendor order now and update it to paid after the cash is
              released.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Vendor</label>
                <select
                  name="vendor"
                  value={form.vendor}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                  required
                >
                  <option value="">Select vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedVendor?.products?.length > 0 && (
                <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Products on file</p>
                      <p className="text-xs text-blue-700">
                        Tap a product to fill the order purpose and suggested unit price.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedVendor.products.map((productEntry, index) => (
                      <button
                        key={`vendor-product-shortcut-${index}`}
                        type="button"
                        onClick={() => fillFromVendorProduct(productEntry)}
                        className="rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-700 transition hover:border-blue-400 hover:text-blue-900"
                      >
                        {(productEntry.product?.name || "Saved product") +
                          (productEntry.price ? ` • ${formatCurrency(productEntry.price)}` : "")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Order / Purpose
                </label>
                <input
                  type="text"
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="What was ordered or why was this order placed?"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="1"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Unit Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="unitPrice"
                  value={form.unitPrice}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Total Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="amount"
                  value={form.amount}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="e.g. Head Office"
                  required
                />
              </div>

              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Total is calculated automatically from quantity and unit price.
                <span className="ml-2 font-semibold text-slate-900">
                  {form.amount ? formatCurrency(form.amount) : "Enter quantity and unit price"}
                </span>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Order Date</label>
                <input
                  type="date"
                  name="requestDate"
                  value={form.requestDate}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Needed By</label>
                <input
                  type="date"
                  name="neededBy"
                  value={form.neededBy}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Order Note (optional)
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="Any extra details about the order or payment arrangement"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {saving ? "Saving..." : "Save Order"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
                Breakdown
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Order Metrics</h3>
              <p className="mt-2 text-sm text-slate-600">
                Compare petty cash vendor orders across locations, vendors, and payment
                status.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total Ordered</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatCurrency(summary.totalAmount)}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Paid Value</p>
                <p className="mt-2 text-lg font-semibold text-emerald-900">
                  {formatCurrency(summary.paidAmount)}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs uppercase tracking-wide text-amber-700">Outstanding</p>
                <p className="mt-2 text-lg font-semibold text-amber-900">
                  {formatCurrency(summary.openAmount)}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs uppercase tracking-wide text-blue-700">Collection Rate</p>
                <p className="mt-2 text-2xl font-semibold text-blue-900">{coverageRate}%</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              {breakdownSections.map(([title, rows, subtitle]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
                      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {rows.length} rows
                    </span>
                  </div>

                  {rows.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">No data available.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {rows.map((row) => (
                        <div
                          key={row.label}
                          className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{row.label}</p>
                              <p className="text-xs text-slate-500">{row.count} orders</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatCurrency(row.amount)}
                              </p>
                              <p className="text-xs text-amber-600">
                                Open {formatCurrency(row.openAmount)}
                              </p>
                              <p className="text-xs text-emerald-600">
                                Paid {formatCurrency(row.paidAmount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
                  Payments
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Paid Orders View</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Review paid petty cash orders only and export the current filtered list as CSV.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportPaidTransactions}
                disabled={paidTransactions.length === 0}
                className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                Export Payments CSV
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Paid Records</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{paidTransactions.length}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Paid Total</p>
                <p className="mt-2 text-lg font-semibold text-emerald-900">
                  {formatCurrency(paidSummary.totalAmount)}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs uppercase tracking-wide text-blue-700">Paid Vendors</p>
                <p className="mt-2 text-2xl font-semibold text-blue-900">
                  {paidSummary.vendorNames.size}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {paidTransactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No paid petty cash orders match the current filters.
                </div>
              ) : (
                paidTransactions.map((transaction) => {
                  const transactionQuantity = getTransactionQuantity(transaction);
                  const transactionUnitPrice = getTransactionUnitPrice(transaction);

                  return (
                    <div
                      key={`paid-${transaction._id}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {transaction.vendorName || transaction.vendor?.companyName || "Vendor"}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">{transaction.purpose}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatQuantity(transactionQuantity)} x {formatCurrency(transactionUnitPrice)}
                            {" "}each
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-sm font-semibold text-emerald-700">
                            {formatCurrency(transaction.amount)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Paid {formatDateTime(transaction.paidAt)}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">
                            {transaction.paymentMethod || "Payment method not set"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-white px-3 py-1">
                          {transaction.location || "No location"}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1">
                          Ref: {transaction.paymentReference || "Not set"}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1">
                          Paid by {transaction.paidBy?.name || "Unknown"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
                  Activity
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Order History
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Review every vendor order, see what is still outstanding, and record
                  when each one is paid.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{filteredTransactions.length}</span>{" "}
                orders
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Loading vendor orders...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  No vendor orders match the selected filters.
                </div>
              ) : (
                filteredTransactions.map((transaction) => {
                  const normalizedStatus = normalizeStatus(transaction.status);
                  const transactionQuantity = getTransactionQuantity(transaction);
                  const transactionUnitPrice = getTransactionUnitPrice(transaction);
                  const isEditing = editingTransactionId === transaction._id;
                  const history = Array.isArray(transaction.approvalHistory)
                    ? transaction.approvalHistory
                        .slice()
                        .map((entry) => normalizeHistoryEntry(entry))
                        .filter(Boolean)
                        .sort((left, right) => new Date(right.at) - new Date(left.at))
                    : [];

                  return (
                    <article
                      key={transaction._id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold text-slate-900">
                              {transaction.vendorName || "Vendor Order"}
                            </h4>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                normalizedStatus
                              )}`}
                            >
                              {normalizedStatus}
                            </span>
                          </div>

                          <p className="mt-2 text-sm font-medium text-slate-800">
                            {transaction.purpose}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatQuantity(transactionQuantity)} x {formatCurrency(transactionUnitPrice)} each
                          </p>

                          <p className="mt-3 text-sm text-slate-600">
                            {transaction.description || "No order note provided."}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white bg-white px-4 py-3 text-right shadow-sm">
                          <p className="text-xs uppercase tracking-wide text-slate-500">Amount</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="mt-4 rounded-3xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-blue-900">Edit Order Inline</p>
                              <p className="text-xs text-blue-700">
                                Update the saved order details without leaving this card.
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-sm font-medium text-slate-700">Vendor</label>
                              <select
                                name="vendor"
                                value={editForm?.vendor || ""}
                                onChange={handleEditChange}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                                required
                              >
                                <option value="">Select vendor</option>
                                {vendors.map((vendor) => (
                                  <option key={vendor._id} value={vendor._id}>
                                    {vendor.companyName}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-sm font-medium text-slate-700">
                                Order / Purpose
                              </label>
                              <input
                                type="text"
                                name="purpose"
                                value={editForm?.purpose || ""}
                                onChange={handleEditChange}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                                required
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                name="quantity"
                                value={editForm?.quantity || ""}
                                onChange={handleEditChange}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                                required
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Unit Price</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                name="unitPrice"
                                value={editForm?.unitPrice || ""}
                                onChange={handleEditChange}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                                required
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Total Amount</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editForm?.amount || ""}
                                readOnly
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
                              <input
                                type="text"
                                name="location"
                                value={editForm?.location || ""}
                                onChange={handleEditChange}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                                required
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Order Date</label>
                              <input
                                type="date"
                                name="requestDate"
                                value={editForm?.requestDate || ""}
                                onChange={handleEditChange}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                                required
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium text-slate-700">Needed By</label>
                              <input
                                type="date"
                                name="neededBy"
                                value={editForm?.neededBy || ""}
                                onChange={handleEditChange}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-sm font-medium text-slate-700">
                                Order Note (optional)
                              </label>
                              <textarea
                                name="description"
                                value={editForm?.description || ""}
                                onChange={handleEditChange}
                                rows={3}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => saveEditedTransaction(transaction._id)}
                              disabled={actioningKey === `${transaction._id}:update-details`}
                              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                            >
                              {actioningKey === `${transaction._id}:update-details`
                                ? "Saving..."
                                : "Save Changes"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditingTransaction}
                              disabled={actioningKey === `${transaction._id}:update-details`}
                              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                              Cancel Edit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Quantity</p>
                            <p className="mt-1 font-medium text-slate-900">
                              {formatQuantity(transactionQuantity)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Unit Price</p>
                            <p className="mt-1 font-medium text-slate-900">
                              {formatCurrency(transactionUnitPrice)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
                            <p className="mt-1 font-medium text-slate-900">{transaction.location}</p>
                          </div>
                          <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Order Date</p>
                            <p className="mt-1 font-medium text-slate-900">
                              {formatDate(transaction.requestDate)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Needed By</p>
                            <p className="mt-1 font-medium text-slate-900">
                              {formatDate(transaction.neededBy)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Logged By</p>
                            <p className="mt-1 font-medium text-slate-900">
                              {transaction.requestedBy?.name || "Unknown"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Paid By</p>
                            <p className="mt-1 font-medium text-slate-900">
                              {transaction.paidBy?.name || "Not paid yet"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Paid At</p>
                            <p className="mt-1 font-medium text-slate-900">
                              {formatDateTime(transaction.paidAt)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Payment Method</p>
                            <p className="mt-1 font-medium text-slate-900 capitalize">
                              {transaction.paymentMethod || "Not set"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Payment Ref</p>
                            <p className="mt-1 break-words font-medium text-slate-900">
                              {transaction.paymentReference || "Not set"}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 flex flex-wrap gap-2">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => startEditingTransaction(transaction)}
                            disabled={Boolean(actioningKey)}
                            className="rounded-full border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-blue-200 disabled:text-blue-300"
                          >
                            Edit Order
                          </button>
                        )}

                        {normalizedStatus === "Ordered" && (
                          <>
                            <button
                              type="button"
                              onClick={() => runAction(transaction, "mark-paid")}
                              disabled={isEditing || actioningKey === `${transaction._id}:mark-paid`}
                              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                            >
                              {actioningKey === `${transaction._id}:mark-paid`
                                ? "Working..."
                                : "Mark Paid"}
                            </button>
                            <button
                              type="button"
                              onClick={() => runAction(transaction, "cancel")}
                              disabled={isEditing || actioningKey === `${transaction._id}:cancel`}
                              className="rounded-full border border-rose-500 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-rose-200 disabled:text-rose-300"
                            >
                              {actioningKey === `${transaction._id}:cancel`
                                ? "Working..."
                                : "Cancel"}
                            </button>
                          </>
                        )}

                        {normalizedStatus === "Cancelled" && (
                          <button
                            type="button"
                            onClick={() => runAction(transaction, "reopen")}
                            disabled={isEditing || actioningKey === `${transaction._id}:reopen`}
                            className="rounded-full border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-blue-200 disabled:text-blue-300"
                          >
                            {actioningKey === `${transaction._id}:reopen`
                              ? "Working..."
                              : "Reopen Order"}
                          </button>
                        )}
                      </div>

                      {history.length > 0 && (
                        <details className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                          <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                            Order and Payment History ({history.length})
                          </summary>

                          <div className="mt-4 space-y-3">
                            {history.map((entry) => (
                              <div
                                key={`${entry.action}-${entry.at}-${entry.staff?._id || entry.staff?.id || "system"}`}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                      {getActionLabel(entry.action)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {entry.staff?.name || "System"}
                                      {entry.staff?.role ? ` • ${entry.staff.role}` : ""}
                                    </p>
                                  </div>

                                  <div className="text-xs text-slate-500">
                                    {formatDateTime(entry.at)}
                                  </div>
                                </div>

                                {(entry.fromStatus || entry.toStatus) && (
                                  <p className="mt-2 text-xs text-slate-500">
                                    {normalizeStatus(entry.fromStatus || "Ordered")} →{" "}
                                    {normalizeStatus(entry.toStatus || normalizedStatus)}
                                  </p>
                                )}

                                {entry.amount !== undefined && entry.amount !== null && (
                                  <p className="mt-2 text-xs font-medium text-slate-700">
                                    Amount: {formatCurrency(entry.amount)}
                                  </p>
                                )}

                                {entry.note ? (
                                  <p className="mt-2 text-sm text-slate-600">{entry.note}</p>
                                ) : (
                                  <p className="mt-2 text-sm text-slate-400">No note added.</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}