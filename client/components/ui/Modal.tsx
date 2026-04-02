import type { ReactNode } from "react";
import Button from "./Button";

interface ModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  loadingText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export default function Modal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  loading = false,
  loadingText,
  onConfirm,
  onCancel,
  children,
}: ModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black opacity-75 z-0"
        onClick={onCancel}
      />
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 z-1">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        {children}
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 border-0"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
            loadingText={loadingText}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
