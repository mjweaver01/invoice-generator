import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "ghost-danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  ghost: "text-blue-600 hover:bg-blue-50 font-medium",
  "ghost-danger": "text-red-600 hover:bg-red-50 font-medium",
  success: "bg-green-600 hover:bg-green-700 text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2",
  md: "px-4 py-2",
  lg: "px-6 py-3",
};

const spinnerColors: Record<ButtonVariant, string> = {
  primary: "border-white border-t-transparent",
  secondary: "border-gray-500 border-t-transparent",
  danger: "border-white border-t-transparent",
  ghost: "border-blue-600 border-t-transparent",
  "ghost-danger": "border-red-600 border-t-transparent",
  success: "border-white border-t-transparent",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      loadingText,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className={`animate-spin rounded-full h-4 w-4 border-2 ${spinnerColors[variant]}`}
            />
            {loadingText ?? children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
