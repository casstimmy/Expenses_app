import { useState } from "react";
import { ChevronDown } from "lucide-react";

const StatCard = ({
  title,
  value,
  options,
  onFilterChange,
  colorFrom,
  colorTo,
}) => {
  const [filter, setFilter] = useState(options[0].value);

  const handleChange = (e) => {
    const val = e.target.value;
    setFilter(val);
    onFilterChange(val);
  };

  return (
    <>
      {/* Filter */}
      <div className="relative flex justify-center -mb-5 z-10">
        <div className="relative bg-white/30 backdrop-blur-md text-gray-900 rounded-full border border-white/50 shadow-lg overflow-hidden">
          <select
            value={filter}
            onChange={handleChange}
            className="appearance-none bg-transparent text-xs px-4 py-1 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="text-gray-900"
              >
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
        </div>
      </div>

      {/* Card */}
      <div
        className={`relative bg-gradient-to-br ${colorFrom} ${colorTo} text-white p-6 pt-8 rounded-2xl shadow-xl transform hover:scale-[1.03] transition-all duration-300`}
      >
        {/* Header */}
        <div className="text-center">
          <span className="block text-sm uppercase tracking-wide font-medium opacity-90">
            {title}
          </span>
        </div>

        {/* Value */}
        <div className="mt-3 text-center">
          <span className="text-3xl font-bold drop-shadow-sm">
            ₦{value.toLocaleString()}
          </span>
        </div>
      </div>
    </>
  );
};

export default StatCard;
