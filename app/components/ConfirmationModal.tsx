"use client";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Bekreft",
  cancelText = "Avbryt",
  onConfirm,
  onCancel,
  type = "danger",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case "danger":
        return {
          button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          icon: "text-red-600",
        };
      case "warning":
        return {
          button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
          icon: "text-yellow-600",
        };
      default:
        return {
          button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
          icon: "text-blue-600",
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Background blur only */}
        <div
          className="fixed inset-0 backdrop-blur-sm transition-all"
          onClick={onCancel}
        ></div>

        {/* Modal panel */}
        <div className="relative transform overflow-hidden rounded-xl bg-white px-6 py-6 text-left shadow-2xl transition-all max-w-md w-full border border-gray-200">
          <div className="flex items-start">
            <div
              className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full ${
                type === "danger"
                  ? "bg-red-100"
                  : type === "warning"
                  ? "bg-yellow-100"
                  : "bg-blue-100"
              }`}
            >
              <svg
                className={`h-6 w-6 ${colors.icon}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`inline-flex justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${colors.button}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
