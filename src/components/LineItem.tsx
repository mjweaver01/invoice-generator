export default function LineItem({
  item,
  index,
  onChange,
  onRemove,
  hourlyRate,
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="col-span-3">
        <div className="px-3 py-2 bg-gray-50 rounded-lg text-right font-medium">
          ${amount.toFixed(2)}
        </div>
      </div>
      <div className="col-span-1">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-600 hover:text-red-800 font-bold text-xl"
          title="Remove line item"
        >
          ×
        </button>
      </div>
    </div>
  );
}
