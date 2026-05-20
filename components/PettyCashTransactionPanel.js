import { useEffect, useMemo, useState } from "react";

const APPROVER_ROLES = ["admin", "Senior staff", "account"];

const getToday = () => new Date().toISOString().split("T")[0];

function formatCurrency(value) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

function formatDate(value) {
  if (!value) return "Not set";

  return new Date(value).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Paid":
      return "bg-green-100 text-green-700 border-green-200";
    case "Rejected":
      return "bg-red-100 text-red-700 border-red-200";
    case "Cancelled":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

function getActionLabel(action) {
  switch (action) {
    case "approve":
      return "Approve";
    case "reject":
      return "Reject";
    case "mark-paid":
      return "Marked Paid";
    case "cancel":
      return "Cancelled";
    case "reopen":
      return "Reopened";
    default:
      return action;
  }
}

function buildBreakdownRows(items, getLabel) {
  const grouped = new Map();

  items.forEach((item) => {
    const label = getLabel(item) || "Not set";
    const amount = Number(item.amount || 0);

    if (!grouped.has(label)) {
      grouped.set(label, {
        label,
        count: 0,
        totalAmount: 0,
        paidAmount: 0,
        openAmount: 0,
      });
    }

    const row = grouped.get(label);
    row.count += 1;
    row.totalAmount += amount;

    if (item.status === "Paid") {
      row.paidAmount += amount;
    }

    if (["Pending Approval", "Approved"].includes(item.status)) {
      row.openAmount += amount;
    }
  });

  return Array.from(grouped.values()).sort(
    (left, right) =>
      right.totalAmount - left.totalAmount || left.label.localeCompare(right.label)
  );
}

function BreakdownTable({ title, subtitle, rows }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>

      {rows.length ? (
        <>
          <div className="space-y-3 sm:hidden">
            {rows.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-gray-800 break-words">{row.label}</p>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {row.count} request{row.count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <p>Total: <span className="font-medium text-gray-800">{formatCurrency(row.totalAmount)}</span></p>
                  <p>Paid: <span className="font-medium text-gray-800">{formatCurrency(row.paidAmount)}</span></p>
                  <p className="col-span-2">Open: <span className="font-medium text-gray-800">{formatCurrency(row.openAmount)}</span></p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="py-2 pr-3 font-medium">Group</th>
                  <th className="py-2 pr-3 font-medium">Requests</th>
                  <th className="py-2 pr-3 font-medium">Total</th>
                  <th className="py-2 pr-3 font-medium">Paid</th>
                  <th className="py-2 font-medium">Open</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-gray-100 last:border-b-0">
                    <td className="py-3 pr-3 font-medium text-gray-800">{row.label}</td>
                    <td className="py-3 pr-3 text-gray-600">{row.count}</td>
                    <td className="py-3 pr-3 text-gray-600">{formatCurrency(row.totalAmount)}</td>
                    <td className="py-3 pr-3 text-gray-600">{formatCurrency(row.paidAmount)}</td>
                    <td className="py-3 text-gray-600">{formatCurrency(row.openAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400">No totals available yet.</p>
      )}
    </div>
  );
}

export default function PettyCashTransactionPanel({ vendors, staff }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actioningId, setActioningId] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    vendor: "",
    purpose: "",
    description: "",
    amount: "",
    requestDate: getToday(),
    neededBy: "",
    location: staff?.location || "",
  });

  const canApprove = APPROVER_ROLES.includes(staff?.role);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/petty-cash-transactions");
      if (!response.ok) {
        throw new Error("Failed to load petty cash transactions");
      }

      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
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
    if (!staff?.location) return;
    setForm((prev) => ({
      ...prev,
      location: prev.location || staff.location,
    }));
  }, [staff?.location]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesVendor = vendorFilter
        ? String(transaction.vendor?._id || transaction.vendor) === vendorFilter
        : true;
      const matchesStatus = statusFilter ? transaction.status === statusFilter : true;
      return matchesVendor && matchesStatus;
    });
  }, [statusFilter, transactions, vendorFilter]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (summary, transaction) => {
        summary.totalAmount += Number(transaction.amount || 0);
        if (transaction.status === "Pending Approval") summary.pending += 1;
        if (transaction.status === "Approved") summary.approved += 1;
        if (transaction.status === "Paid") summary.paid += Number(transaction.amount || 0);
        return summary;
      },
      { totalAmount: 0, pending: 0, approved: 0, paid: 0 }
    );
  }, [filteredTransactions]);

  const dashboardTotals = useMemo(() => {
    return transactions.reduce(
      (summary, transaction) => {
        const amount = Number(transaction.amount || 0);
        summary.totalAmount += amount;

        if (transaction.status === "Paid") {
          summary.paidAmount += amount;
        }

        if (["Pending Approval", "Approved"].includes(transaction.status)) {
          summary.openAmount += amount;
        }

        summary.locations.add(transaction.location || "Not set");
        summary.vendors.add(
          transaction.vendorName || transaction.vendor?.companyName || "Unknown vendor"
        );

        return summary;
      },
      {
        totalAmount: 0,
        paidAmount: 0,
        openAmount: 0,
        locations: new Set(),
        vendors: new Set(),
      }
    );
  }, [transactions]);

  const locationBreakdown = useMemo(
    () => buildBreakdownRows(transactions, (transaction) => transaction.location || "Not set"),
    [transactions]
  );

  const vendorBreakdown = useMemo(
    () =>
      buildBreakdownRows(
        transactions,
        (transaction) =>
          transaction.vendorName || transaction.vendor?.companyName || "Unknown vendor"
      ),
    [transactions]
  );

  const statusBreakdown = useMemo(
    () => buildBreakdownRows(transactions, (transaction) => transaction.status || "Unknown"),
    [transactions]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/petty-cash-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to create petty cash transaction");
      }

      setForm({
        vendor: "",
        purpose: "",
        description: "",
        amount: "",
        requestDate: getToday(),
        neededBy: "",
        location: staff?.location || "",
      });
      await loadTransactions();
    } catch (error) {
      console.error("Petty cash transaction create error:", error);
      alert(error.message || "Unable to create petty cash transaction.");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (transaction, action) => {
    const payload = { action };

    if (action === "approve") {
      const note = window.prompt("Approval note (optional):", "");
      if (note === null) return;
      payload.note = note;
    }

    if (action === "reject") {
      const note = window.prompt("Reason for rejection:", "");
      if (note === null) return;
      payload.note = note;
    }

    if (action === "cancel") {
      const note = window.prompt("Reason for cancellation (optional):", "");
      if (note === null) return;
      payload.note = note;
    }

    if (action === "reopen") {
      const note = window.prompt("Reason for reopening (optional):", "");
      if (note === null) return;
      payload.note = note;
    }

    if (action === "mark-paid") {
      const paymentMethod = window.prompt(
        "Payment method (cash, transfer, or other):",
        transaction.paymentMethod || "transfer"
      );
      if (paymentMethod === null) return;

      const paymentReference = window.prompt(
        "Payment reference (optional):",
        transaction.paymentReference || ""
      );
      if (paymentReference === null) return;

      const note = window.prompt("Payment note (optional):", "");
      if (note === null) return;

      payload.paymentMethod = paymentMethod;
      payload.paymentReference = paymentReference;
      payload.note = note;
      payload.paidAt = new Date().toISOString();
    }

    setActioningId(transaction._id);
    try {
      const response = await fetch(`/api/petty-cash-transactions/${transaction._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to update petty cash transaction");
      }

      await loadTransactions();
    } catch (error) {
      console.error("Petty cash transaction action error:", error);
      alert(error.message || "Unable to update petty cash transaction.");
    } finally {
      setActioningId("");
    }
  };

  return (
    <section className="bg-white p-4 sm:p-6 rounded shadow space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800">
          Petty Cash Transactions
        </h2>
        <p className="text-sm text-gray-600 max-w-3xl">
          Log petty cash requests against registered vendors, move each request through
          approval, and keep an audit trail of every approval decision and payment update.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[
          ["Filtered Requests", filteredTransactions.length, "bg-white border-gray-200"],
          ["Pending Approval", totals.pending, "bg-amber-50 border-amber-200"],
          ["Approved", totals.approved, "bg-blue-50 border-blue-200"],
          ["Paid Value", formatCurrency(totals.paid), "bg-green-50 border-green-200"],
        ].map(([label, value, className]) => (
          <div key={label} className={`rounded-xl border p-4 shadow-sm ${className}`}>
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4 sm:p-5 space-y-5">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-800">Approval Dashboard</h3>
          <p className="text-sm text-gray-600 max-w-3xl">
            Overall petty cash totals across all recorded requests, grouped by location,
            vendor, and status.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            ["Total Requested", formatCurrency(dashboardTotals.totalAmount), "bg-white border-gray-200"],
            ["Total Paid", formatCurrency(dashboardTotals.paidAmount), "bg-green-50 border-green-200"],
            ["Open Value", formatCurrency(dashboardTotals.openAmount), "bg-amber-50 border-amber-200"],
            [
              "Coverage",
              `${dashboardTotals.locations.size} Locations / ${dashboardTotals.vendors.size} Vendors`,
              "bg-blue-50 border-blue-200",
            ],
          ].map(([label, value, className]) => (
            <div key={label} className={`rounded-xl border p-4 shadow-sm ${className}`}>
              <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2 break-words">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <BreakdownTable
            title="Totals by Location"
            subtitle="Compare petty cash demand and paid value across each location."
            rows={locationBreakdown}
          />
          <BreakdownTable
            title="Totals by Vendor"
            subtitle="See which petty cash vendors account for the highest request values."
            rows={vendorBreakdown}
          />
          <BreakdownTable
            title="Totals by Status"
            subtitle="Track how much value is pending, approved, paid, rejected, or cancelled."
            rows={statusBreakdown}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <h3 className="text-lg font-semibold text-gray-800">Create Request</h3>
          <p className="text-xs text-gray-500">New requests start as pending approval.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <label className="text-sm text-gray-700 space-y-1">
            <span>Vendor</span>
            <select
              name="vendor"
              value={form.vendor}
              onChange={handleChange}
              className="border p-3 rounded w-full bg-white"
              required
            >
              <option value="">Select petty cash vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.companyName}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-700 space-y-1">
            <span>Purpose</span>
            <input
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              className="border p-3 rounded w-full"
              placeholder="What is this cash for?"
              required
            />
          </label>

          <label className="text-sm text-gray-700 space-y-1">
            <span>Amount</span>
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              className="border p-3 rounded w-full"
              placeholder="0.00"
              required
            />
          </label>

          <label className="text-sm text-gray-700 space-y-1">
            <span>Location</span>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="border p-3 rounded w-full"
              placeholder="Location"
              required
            />
          </label>

          <label className="text-sm text-gray-700 space-y-1">
            <span>Request Date</span>
            <input
              name="requestDate"
              type="date"
              value={form.requestDate}
              onChange={handleChange}
              className="border p-3 rounded w-full"
              required
            />
          </label>

          <label className="text-sm text-gray-700 space-y-1">
            <span>Needed By</span>
            <input
              name="neededBy"
              type="date"
              value={form.neededBy}
              onChange={handleChange}
              className="border p-3 rounded w-full"
            />
          </label>

          <label className="text-sm text-gray-700 space-y-1 md:col-span-2 xl:col-span-2">
            <span>Description / Discussion (Optional)</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="border p-3 rounded w-full min-h-24"
              placeholder="Add a short justification or request note"
            />
          </label>
        </div>

        <div className="flex justify-stretch sm:justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`w-full sm:w-auto px-5 py-2.5 rounded text-white font-medium transition ${
              saving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving ? "Saving..." : "Create Transaction"}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm text-gray-700 space-y-1">
          <span>Filter by Vendor</span>
          <select
            value={vendorFilter}
            onChange={(event) => setVendorFilter(event.target.value)}
            className="border p-3 rounded w-full bg-white"
          >
            <option value="">All petty cash vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor._id} value={vendor._id}>
                {vendor.companyName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-gray-700 space-y-1">
          <span>Filter by Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border p-3 rounded w-full bg-white"
          >
            <option value="">All statuses</option>
            {["Pending Approval", "Approved", "Rejected", "Paid", "Cancelled"].map(
              (status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            Loading petty cash transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No petty cash transactions found for the current filters.
          </div>
        ) : (
          filteredTransactions.map((transaction) => {
            const isBusy = actioningId === transaction._id;

            return (
              <article
                key={transaction._id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {transaction.purpose}
                      </h3>
                      <span
                        className={`text-xs border px-2.5 py-1 rounded-full font-medium ${getStatusClass(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Vendor: <span className="font-medium">{transaction.vendorName}</span>
                    </p>
                    {transaction.description && (
                      <p className="text-sm text-gray-500 max-w-3xl">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm text-gray-600">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Request Date</p>
                    <p className="font-medium text-gray-800">{formatDate(transaction.requestDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Needed By</p>
                    <p className="font-medium text-gray-800">{formatDate(transaction.neededBy)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Location</p>
                    <p className="font-medium text-gray-800">{transaction.location}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Requested By</p>
                    <p className="font-medium text-gray-800">
                      {transaction.requestedBy?.name || "Unknown staff"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Approved At</p>
                    <p className="font-medium text-gray-800">{formatDate(transaction.approvedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Paid At</p>
                    <p className="font-medium text-gray-800">{formatDate(transaction.paidAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Payment Method</p>
                    <p className="font-medium text-gray-800">{transaction.paymentMethod || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Reference</p>
                    <p className="font-medium text-gray-800">{transaction.paymentReference || "Not set"}</p>
                  </div>
                </div>

                {canApprove && (
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                    {transaction.status === "Pending Approval" && (
                      <>
                        <button
                          type="button"
                          onClick={() => runAction(transaction, "approve")}
                          disabled={isBusy}
                          className="w-full sm:w-auto px-3 py-1.5 rounded-full text-xs font-medium border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition disabled:opacity-50"
                        >
                          {isBusy ? "Working..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => runAction(transaction, "reject")}
                          disabled={isBusy}
                          className="w-full sm:w-auto px-3 py-1.5 rounded-full text-xs font-medium border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => runAction(transaction, "cancel")}
                          disabled={isBusy}
                          className="w-full sm:w-auto px-3 py-1.5 rounded-full text-xs font-medium border border-gray-500 text-gray-600 hover:bg-gray-600 hover:text-white transition disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {transaction.status === "Approved" && (
                      <>
                        <button
                          type="button"
                          onClick={() => runAction(transaction, "mark-paid")}
                          disabled={isBusy}
                          className="w-full sm:w-auto px-3 py-1.5 rounded-full text-xs font-medium border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition disabled:opacity-50"
                        >
                          {isBusy ? "Working..." : "Mark Paid"}
                        </button>
                        <button
                          type="button"
                          onClick={() => runAction(transaction, "reject")}
                          disabled={isBusy}
                          className="w-full sm:w-auto px-3 py-1.5 rounded-full text-xs font-medium border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {["Rejected", "Cancelled"].includes(transaction.status) && (
                      <button
                        type="button"
                        onClick={() => runAction(transaction, "reopen")}
                        disabled={isBusy}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-full text-xs font-medium border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white transition disabled:opacity-50"
                      >
                        {isBusy ? "Working..." : "Reopen"}
                      </button>
                    )}
                  </div>
                )}

                <details className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Approval History ({transaction.approvalHistory?.length || 0})
                  </summary>
                  <div className="mt-3 space-y-3">
                    {transaction.approvalHistory?.length ? (
                      [...transaction.approvalHistory].reverse().map((entry, index) => (
                        <div
                          key={`${transaction._id}-history-${index}`}
                          className="rounded-lg bg-white border border-gray-200 px-3 py-3 text-sm text-gray-600"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium text-gray-800">
                              {getActionLabel(entry.action)}
                              {entry.toStatus ? ` -> ${entry.toStatus}` : ""}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(entry.actedAt)}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            By {entry.actedBy?.name || "System"}
                          </p>
                          {entry.note && <p className="mt-2">{entry.note}</p>}
                          {(entry.paymentMethod || entry.paymentReference) && (
                            <p className="mt-2 text-xs text-gray-500">
                              {entry.paymentMethod ? `Method: ${entry.paymentMethod}` : ""}
                              {entry.paymentMethod && entry.paymentReference ? " | " : ""}
                              {entry.paymentReference
                                ? `Reference: ${entry.paymentReference}`
                                : ""}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No approval history yet.</p>
                    )}
                  </div>
                </details>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}