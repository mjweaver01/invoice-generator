import { formatCurrency } from "../utils";
import { Input } from "./ui";

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
        <Input
          type="text"
          placeholder="Description of work"
          value={item.description}
          onChange={(e) => handleChange("description", e.target.value)}
          disabled={disabled}
          inputSize="sm"
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Hours"
          value={item.hours}
          onChange={(e) => handleChange("hours", e.target.value)}
          step="0.25"
          min="0"
          disabled={disabled}
          inputSize="sm"
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
