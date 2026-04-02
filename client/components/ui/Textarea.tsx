import { forwardRef, type TextareaHTMLAttributes } from "react";

type TextareaSize = "sm" | "md";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  textareaSize?: TextareaSize;
}

const sizeClasses: Record<TextareaSize, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-2",
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, textareaSize = "md", className = "", ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full ${sizeClasses[textareaSize]} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400 ${className}`}
          {...props}
        />
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
export default Textarea;
