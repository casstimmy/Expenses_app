import { useState, useEffect, useRef, useMemo } from "react";
import "@/styles/keypad-effect.css";

export function VendorPaymentTracker({
  orders: initialOrders = [],
  onOrdersChange = () => {},
}) {
  const [orders, setOrders] = useState(
    Array.isArray(initialOrders) ? initialOrders : []
  );
  const [editIndex, setEditIndex] = useState(null);
  const [editedPayment, setEditedPayment] = useState("");
  const [editedPaymentDate, setEditedPaymentDate] = useState("");
  const [editedTotal, setEditedTotal] = useState("");
  const [editedDate, setEditedDate] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [vendors, setVendors] = useState([]);
  const [isBusy, setIsBusy] = useState(false); // disable UI during server ops

  // messages (replaces alert)
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // info | success | error
  const messageTimerRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  useEffect(() => {
    setOrders(Array.isArray(initialOrders) ? initialOrders : []);
  }, [initialOrders]);

  useEffect(() => {
    // use supplier (existing data) to build vendor list
    const uniqueVendors = Array.from(
      new Set(orders.map((order) => order.supplier).filter(Boolean))
    );
    setVendors(uniqueVendors);
  }, [orders]);

  useEffect(() => {
    // clear message after timeout
    if (message) {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      messageTimerRef.current = setTimeout(() => {
        setMessage("");
        messageTimerRef.current = null;
      }, 4000);
    }
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
    };
  }, [message]);

  const formatCurrency = (v) => `₦${Number(v ?? 0).toLocaleString()}`;
  const isNumber = (v) => typeof v === "number" && Number.isFinite(v);

  const filteredOrders = Array.isArray(orders)
    ? selectedVendor
      ? orders.filter((order) => order.supplier === selectedVendor)
      : orders
    : [];

  // Sort by entry date (newest first) — use createdAt or _id timestamp
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      const dateA = new Date(a.date || a._id?.toString().substring(0, 8) || 0);
      const dateB = new Date(b.date || b._id?.toString().substring(0, 8) || 0);
      return dateB - dateA; // newest first
    });
  }, [filteredOrders]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / entriesPerPage));
  // ensure currentPage is in range
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setEditIndex(null); // cancel any ongoing edits when page changes
  };

  // reset to first page when vendor filter changes
  useEffect(() => {
    setCurrentPage(1);
    setEditIndex(null);
  }, [selectedVendor]);

  const handleEdit = (index, currentPayment) => {
    const order = paginatedOrders[index];
    if (!order) return;
    setEditIndex(index);
    setEditedPayment(String(currentPayment ?? ""));
    setEditedPaymentDate(
      order?.paymentDate
        ? new Date(order.paymentDate).toISOString().slice(0, 10)
        : ""
    );
    setEditedTotal(order?.grandTotal ?? "");
    setEditedDate(
      order?.date ? new Date(order.date).toISOString().slice(0, 10) : ""
    );
  };

  const handleCancel = () => {
    setEditIndex(null);
    setEditedPayment("");
    setEditedTotal("");
    setEditedDate("");
    setEditedPaymentDate("");
  };

  const showMessage = (text, type = "info") => {
    setMessageType(type);
    setMessage(text);
  };

  const handleDelete = async (orderId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this order?"
    );
    if (!confirmDelete) return;

    setIsBusy(true);
    try {
      const res = await fetch(`/api/payments/${orderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      showMessage("Order deleted", "success");
      await onOrdersChange();
    } catch (err) {
      console.error("Delete error:", err);
      showMessage("Failed to delete order", "error");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSave = async (indexInPage) => {
    const orderFromPage = paginatedOrders[indexInPage];
    if (!orderFromPage) return;

    const originalIndex = orders.findIndex((o) => o._id === orderFromPage._id);
    if (originalIndex === -1) return;

    const originalOrder = orders[originalIndex];

    // validate inputs
    const paymentNum =
      editedPayment !== "" ? Number(editedPayment) : Number(originalOrder.paymentMade || 0);
    const grandTotalNum =
      editedTotal !== "" ? Number(editedTotal) : Number(originalOrder.grandTotal || 0);

    if (!Number.isFinite(paymentNum) || paymentNum < 0) {
      showMessage("Invalid payment amount", "error");
      return;
    }
    if (!Number.isFinite(grandTotalNum) || grandTotalNum < 0) {
      showMessage("Invalid total amount", "error");
      return;
    }

    const orderDate = editedDate || originalOrder.date || "";

    const balance = grandTotalNum - paymentNum;
    let status;
    if (paymentNum === 0) status = "Not Paid";
    else if (paymentNum < grandTotalNum) status = "Partly Paid";
    else if (paymentNum === grandTotalNum) status = "Paid";
    else status = "Credit";

    // if user edited pay date, use it; else keep existing; else use now
    const paymentDateISO = editedPaymentDate
      ? new Date(editedPaymentDate).toISOString()
      : originalOrder.paymentDate || new Date().toISOString();

    const updatedOrder = {
      ...originalOrder,
      paymentMade: paymentNum,
      grandTotal: grandTotalNum,
      date: orderDate,
      paymentDate: paymentDateISO,
      balance,
      status,
    };

    // check if anything changed
    const changed =
      paymentNum !== Number(originalOrder.paymentMade || 0) ||
      grandTotalNum !== Number(originalOrder.grandTotal || 0) ||
      orderDate !== (originalOrder.date || "") ||
      paymentDateISO !== (originalOrder.paymentDate || "");

    if (!changed) {
      showMessage("No changes to save", "info");
      handleCancel();
      return;
    }

    // Optimistic update
    const updatedOrders = [...orders];
    updatedOrders[originalIndex] = updatedOrder;
    setOrders(updatedOrders);

    // clear edit fields
    setEditIndex(null);
    setEditedPayment("");
    setEditedPaymentDate("");
    setEditedTotal("");
    setEditedDate("");

    setIsBusy(true);
    try {
      const res = await fetch(`/api/payments/${updatedOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOrder),
      });
      if (!res.ok) throw new Error(await res.text());
      showMessage("Payment updated", "success");
      await onOrdersChange();
    } catch (err) {
      console.error("Payment update failed", err);
      showMessage("Failed to save payment. Changes may not have been persisted.", "error");
      await onOrdersChange(); // refetch to resync
    } finally {
      setIsBusy(false);
    }
  };

  if (!sortedOrders.length)
    return (
      <>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="text-sm font-medium mr-2">Vendor:</label>
            <select
              aria-label="Filter by vendor"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All vendors</option>
              {vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`text-sm px-3 py-1 rounded ${
                messageType === "success"
                  ? "bg-green-50 text-green-700"
                  : messageType === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-gray-50 text-gray-700"
              }`}
            >
              {message}
            </div>
          )}
        </div>
        <p className="text-gray-500">No vendor orders found.</p>
      </>
    );

  return (
    <div className="space-y-4">
      {/* Vendor filter + messages */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium mr-2">Vendor:</label>
          <select
            aria-label="Filter by vendor"
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">All vendors</option>
            {vendors.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`text-sm px-3 py-1 rounded ${
              messageType === "success"
                ? "bg-green-50 text-green-700"
                : messageType === "error"
                ? "bg-red-50 text-red-700"
                : "bg-gray-50 text-gray-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300 text-sm select-none">
          <thead className="bg-blue-50 text-gray-700 font-semibold uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Products</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-left">Pay Date</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Memo</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paginatedOrders.map((order, idx) => (
              <tr
                key={order._id ?? `${order.supplier ?? "unk"}-${idx}-${order.date ?? ""}`}
                className="hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3">
                  {editIndex === idx ? (
                    <input
                      type="date"
                      className="border border-gray-300 px-2 py-1 rounded text-sm"
                      value={editedDate}
                      onChange={(e) => setEditedDate(e.target.value)}
                      aria-label="Edit order date"
                    />
                  ) : (
                    <span>{order.date ? new Date(order.date).toLocaleDateString() : "—"}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {order.supplier || "—"}
                </td>
                <td className="px-4 py-3">{order.contact || "—"}</td>
                <td className="px-4 py-3">
                  {Array.isArray(order.mainProduct)
                    ? order.mainProduct.map((item, i) => (
                        <div key={i} className="text-gray-600">
                          {item.product} × {item.quantity}
                        </div>
                      ))
                    : order.mainProduct || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {editIndex === idx ? (
                    <input
                      type="number"
                      className="w-24 border border-gray-300 px-2 py-1 rounded text-sm text-right"
                      value={editedTotal}
                      onChange={(e) => setEditedTotal(e.target.value)}
                      aria-label="Edit total"
                    />
                  ) : (
                    formatCurrency(order.grandTotal)
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editIndex === idx ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-end">
                      <input
                        type="number"
                        min={0}
                        className="border border-gray-300 rounded px-3 py-1 w-full sm:w-28 text-right text-sm"
                        value={editedPayment}
                        onChange={(e) => setEditedPayment(e.target.value)}
                        aria-label="Edit payment amount"
                      />
                      <div className="flex gap-2">
                        <button
                          disabled={isBusy}
                          onClick={() => handleSave(idx)}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition keypad-btn"
                          aria-label="Save payment"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition keypad-btn"
                          aria-label="Cancel edit"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm font-medium">
                        {formatCurrency(order.paymentMade)}
                      </span>
                      <button
                        disabled={isBusy}
                        onClick={() => handleEdit(idx, order.paymentMade)}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition keypad-btn"
                        aria-label="Edit payment"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editIndex === idx ? (
                    <input
                      type="date"
                      className="border border-gray-300 px-2 py-1 rounded text-sm"
                      value={editedPaymentDate}
                      onChange={(e) => setEditedPaymentDate(e.target.value)}
                      aria-label="Edit payment date"
                    />
                  ) : (
                    <span>
                      {order.paymentDate
                        ? new Date(order.paymentDate).toLocaleDateString("en-NG")
                        : "—"}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 text-right">
                  {order.balance != null ? formatCurrency(order.balance) : formatCurrency(order.grandTotal)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      order.status === "Paid"
                        ? "bg-green-100 text-green-800"
                        : order.status === "Partly Paid"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.status === "Credit"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {order.status || "Not Paid"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/memo/${order._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md shadow hover:bg-blue-700 transition"
                    aria-label="Open memo"
                  >
                    Memo
                  </a>
                </td>
                <td className="px-4 py-3">
                  <button
                    disabled={isBusy}
                    onClick={() => handleDelete(order._id)}
                    className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-sm font-medium px-3 py-2 rounded-md shadow hover:bg-red-200 hover:text-red-700 transition keypad-btn"
                    aria-label="Delete order"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 my-4">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              aria-label="Previous page"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-1 rounded ${page === currentPage ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                aria-label={`Go to page ${page}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-5">
        {paginatedOrders.map((order, idx) => (
          <div
            key={order._id ?? `${order.supplier ?? "unk"}-${idx}-${order.date ?? ""}`}
            className="bg-white p-4 rounded-2xl shadow border border-gray-200 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  {order.supplier || "Unknown Vendor"}
                </h2>
                {editIndex === idx ? (
                  <input
                    type="date"
                    className="mt-1 border border-gray-300 px-2 py-1 rounded text-sm"
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                  />
                ) : (
                  <p className="text-xs text-gray-500">
                    {order.date ? new Date(order.date).toLocaleDateString() : "—"}
                  </p>
                )}
              </div>
              <a
                href={`/memo/${order._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition"
              >
                View Memo
              </a>
            </div>

            <div className="text-sm text-gray-600">
              <strong>Contact:</strong> {order.contact || "—"}
            </div>
            <div className="text-sm">
              <strong>Products:</strong>
              <div className="pl-2 mt-1 space-y-1">
                {Array.isArray(order.mainProduct) ? (
                  order.mainProduct.map((p, i) => (
                    <div key={i} className="text-gray-700">
                      {p.product} × {p.quantity}
                    </div>
                  ))
                ) : (
                  <div>{order.mainProduct || "—"}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 border-t border-gray-100 pt-3">
              <div>
                <strong>Total:</strong>
                {editIndex === idx ? (
                  <input
                    type="number"
                    className="mt-1 w-full border border-gray-300 px-2 py-1 rounded text-sm text-right"
                    value={editedTotal}
                    onChange={(e) => setEditedTotal(e.target.value)}
                  />
                ) : (
                  <div>{formatCurrency(order.grandTotal)}</div>
                )}
              </div>
              <div>
                <strong>Balance:</strong>
                <div>{formatCurrency(order.balance ?? 0)}</div>
              </div>
              <div>
                <strong>Status:</strong>
                <div className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${order.status === "Paid" ? "bg-green-100 text-green-700" : order.status === "Partly Paid" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700"}`}>
                  {order.status || "Not Paid"}
                </div>
              </div>
              <div>
                <strong>Pay Date:</strong>
                <div>
                  {order.paymentDate ? new Date(order.paymentDate).toLocaleDateString("en-NG") : "—"}
                </div>
              </div>
            </div>

            <div className="text-sm">
              <strong>Paid:</strong>
              {editIndex === idx ? (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <input
                    type="number"
                    className="border border-gray-300 px-3 py-1 rounded w-28 text-sm"
                    value={editedPayment}
                    onChange={(e) => setEditedPayment(e.target.value)}
                  />
                  <button
                    disabled={isBusy}
                    onClick={() => handleSave(idx)}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs keypad-btn"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs keypad-btn"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-700">{formatCurrency(order.paymentMade)}</span>
                  <button
                    disabled={isBusy}
                    onClick={() => handleEdit(idx, order.paymentMade)}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs keypad-btn"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                disabled={isBusy}
                onClick={() => handleDelete(order._id)}
                className="flex items-center gap-1 bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition keypad-btn"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-1 rounded ${page === currentPage ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}