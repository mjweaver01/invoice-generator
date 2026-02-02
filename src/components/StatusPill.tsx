import { useState, useRef, useEffect } from "react";

interface StatusPillProps {
  status: "draft" | "sent" | "paid";
  onStatusChange: (newStatus: string) => void;
}

export function StatusPill({ status, onStatusChange }: StatusPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "paid", label: "Paid" },
  ];

  const handleStatusClick = (newStatus: string) => {
    onStatusChange(newStatus);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)} hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusClick(option.value)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                status === option.value ? "bg-gray-50 font-medium" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
