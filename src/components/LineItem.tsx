import { formatCurrency } from "../utils";

export default function LineItem({
  item,
  index,
  onChange,
  onRemove,
  hourlyRate,
  disabled = false,
}) {
  const handleChange = (field, value) => {
    onChange(index, { ...item, [field]: value });
  };

  const amount = (parseFloat(item.hours) || 0) * hourlyRate;

  return (
    <div className="grid grid-cols-12 gap-4 items-center mb-3">
      <div className="col-span-6">
        <input
          type="text"
          placeholder="Description of work"
          value={item.description}
          onChange={(e) => handleChange("description", e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400"
        />
      </div>
      <div className="col-span-2">
        <input
          type="number"
          placeholder="Hours"
          value={item.hours}
          onChange={(e) => handleChange("hours", e.target.value)}
          step="0.25"
          min="0"
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400"
        />
      </div>
      <div className="col-span-3">
        <div className="px-3 py-2 bg-gray-50 rounded-lg text-right font-medium">
          {formatCurrency(amount)}
        </div>
      </div>
      <div className="col-span-1">
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className="text-red-600 hover:text-red-800 font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          title="Remove line item"
        >
          ×
        </button>
      </div>
    </div>
  );
}
