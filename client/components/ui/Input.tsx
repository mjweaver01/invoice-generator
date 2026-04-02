import { forwardRef, type InputHTMLAttributes } from "react";

type InputSize = "sm" | "md";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  inputSize?: InputSize;
  wrapperClassName?: string;
}

const sizeClasses: Record<InputSize, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-2",
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, inputSize = "md", className = "", wrapperClassName = "", ...props }, ref) => {
    return (
      <div className={wrapperClassName}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full ${sizeClasses[inputSize]} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400 ${className}`}
          {...props}
        />
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
