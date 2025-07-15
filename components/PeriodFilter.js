// components/PeriodFilter.js
import { useEffect } from "react";

// Helper function to map selectedPeriod to date range
function getDateRangeFromPeriod(period) {
  const today = new Date();
  const iso = (date) => date.toISOString().split("T")[0];

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const endOfLastWeek = new Date(startOfWeek);
  endOfLastWeek.setDate(startOfWeek.getDate() - 1);

  const startOfLastWeek = new Date(endOfLastWeek);
  startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const startOfLastMonth = new Date(
    endOfLastMonth.getFullYear(),
    endOfLastMonth.getMonth(),
    1
  );

  switch (period) {
    case "today":
      return { selectedDate: iso(today), startDate: "", endDate: "" };
    case "yesterday":
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      return { selectedDate: iso(y), startDate: "", endDate: "" };
 case "thisWeek": {
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  return {
    selectedDate: "",
    startDate: iso(startOfWeek),
    endDate: endOfToday.toISOString(),
  };
}

    case "lastWeek":
      return {
        selectedDate: "",
        startDate: iso(startOfLastWeek),
        endDate: iso(endOfLastWeek),
      };
    case "thisMonth": {
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      return {
        selectedDate: "",
        startDate: iso(startOfMonth),
        endDate: endOfToday.toISOString(), // preserve full time!
      };
    }
    case "lastMonth":
      return {
        selectedDate: "",
        startDate: iso(startOfLastMonth),
        endDate: iso(endOfLastMonth),
      };
      case "custom":
  return { selectedDate: "", startDate: "", endDate: "" };

    default:
      return { selectedDate: "", startDate: "", endDate: "" };
  }
}

export default function PeriodFilter({
  selectedPeriod,
  setSelectedPeriod,
  setSelectedDate,
  setFilters,
  setFiltersApplied,
}) {
  useEffect(() => {
    if (!selectedPeriod || selectedPeriod === "custom") return;

    const { selectedDate, startDate, endDate } =
      getDateRangeFromPeriod(selectedPeriod);

    setSelectedDate(selectedDate);
    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate,
    }));
    setFiltersApplied(true);
  }, [selectedPeriod]);

  return (
    <div>
      <select
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value)}
        className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
      >
        <option value="">Filter by period</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="thisWeek">This Week</option>
        <option value="lastWeek">Last Week</option>
        <option value="thisMonth">This Month</option>
        <option value="lastMonth">Last Month</option>
        <option value="custom">Specific Period</option>
      </select>

      {selectedPeriod === "custom" && (
  <div className="flex gap-4 mt-2">
    <div>
      <label className="block text-sm text-gray-600">Start Date</label>
      <input
        type="date"
        onChange={(e) => {
          const value = e.target.value;
          setFilters((prev) => {
            const newFilters = { ...prev, startDate: value };
            if (newFilters.startDate && newFilters.endDate) {
              setFiltersApplied(true);
            }
            return newFilters;
          });
        }}
        className="px-4 py-2 border rounded-lg text-sm"
      />
    </div>
    <div>
      <label className="block text-sm text-gray-600">End Date</label>
      <input
        type="date"
        onChange={(e) => {
          const value = e.target.value;
          setFilters((prev) => {
            const newFilters = { ...prev, endDate: value };
            if (newFilters.startDate && newFilters.endDate) {
              setFiltersApplied(true);
            }
            return newFilters;
          });
        }}
        className="px-4 py-2 border rounded-lg text-sm"
      />
    </div>
  </div>
)}

    </div>
  );
}

