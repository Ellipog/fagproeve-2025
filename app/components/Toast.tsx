"use client";

import { useEffect, useState, useCallback } from "react";

export interface ToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onRemove: (id: string) => void;
}

export default function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onRemove,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(id);
    }, 300);
  }, [id, onRemove]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleRemove]);

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          icon: "text-green-400",
          title: "text-green-800",
          message: "text-green-700",
          iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        };
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: "text-red-400",
          title: "text-red-800",
          message: "text-red-700",
          iconPath:
            "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
        };
      case "warning":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          icon: "text-yellow-400",
          title: "text-yellow-800",
          message: "text-yellow-700",
          iconPath:
            "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z",
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: "text-blue-400",
          title: "text-blue-800",
          message: "text-blue-700",
          iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`w-96 max-w-sm ${
        styles.bg
      } shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out ${
        isExiting
          ? "translate-y-2 opacity-0 scale-95"
          : "translate-y-0 opacity-100 scale-100"
      } ${styles.border}`}
    >
      <div className="p-3">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className={`h-5 w-5 ${styles.icon}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={styles.iconPath}
              />
            </svg>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${styles.title}`}>{title}</p>
            {message && (
              <p className={`mt-1 text-xs ${styles.message}`}>{message}</p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              type="button"
              className={`rounded-md inline-flex ${styles.title} hover:opacity-75 focus:outline-none transition-opacity`}
              onClick={handleRemove}
            >
              <span className="sr-only">Lukk</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
