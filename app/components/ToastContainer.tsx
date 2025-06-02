"use client";

import Toast, { ToastProps } from "./Toast";

interface ToastContainerProps {
  toasts: Omit<ToastProps, "onRemove">[];
  onRemoveToast: (id: string) => void;
}

export default function ToastContainer({
  toasts,
  onRemoveToast,
}: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={onRemoveToast} />
      ))}
    </div>
  );
}
