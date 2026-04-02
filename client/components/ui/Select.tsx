import { forwardRef, type SelectHTMLAttributes } from "react";

type SelectSize = "sm" | "md";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  selectSize?: SelectSize;
}

const sizeClasses: Record<SelectSize, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-2",
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, selectSize = "md", className = "", children, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full ${sizeClasses[selectSize]} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {children}
        </select>
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
export default Select;
