import type { ReactNode } from "react";

type AlertVariant = "success" | "error" | "info" | "purple";

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  success: "bg-green-50 border-green-200 text-green-700",
  error: "bg-red-50 border-red-200 text-red-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
};

export default function Alert({ variant, children, className = "" }: AlertProps) {
  return (
    <div
      className={`border px-4 py-3 rounded-lg ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
