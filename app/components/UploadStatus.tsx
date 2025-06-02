"use client";

import { useState, useEffect } from "react";

export interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

interface UploadStatusProps {
  uploadingFiles: UploadingFile[];
  onDismiss: (index: number) => void;
}

export default function UploadStatus({
  uploadingFiles,
  onDismiss,
}: UploadStatusProps) {
  const [dismissedItems, setDismissedItems] = useState<Set<number>>(new Set());

  // Auto-dismiss successful uploads after 3 seconds
  useEffect(() => {
    uploadingFiles.forEach((uploadFile, index) => {
      if (uploadFile.status === "success" && !dismissedItems.has(index)) {
        setTimeout(() => {
          handleDismiss(index);
        }, 3000);
      }
    });
  }, [uploadingFiles]);

  const handleDismiss = (index: number) => {
    setDismissedItems((prev) => new Set([...prev, index]));
    setTimeout(() => {
      onDismiss(index);
      setDismissedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 300);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (fileName: string): string => {
    const ext = fileName.toLowerCase().split(".").pop();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "🖼️";
    if (ext === "pdf") return "📄";
    if (ext === "doc") return "📝";
    if (["txt", "md"].includes(ext || "")) return "📄";
    return "📎";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
        return (
          <svg
            className="animate-spin w-5 h-5 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        );
      case "success":
        return (
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const visibleFiles = uploadingFiles.filter(
    (_, index) => !dismissedItems.has(index)
  );

  if (visibleFiles.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleFiles.map((uploadFile, index) => {
        const isDismissed = dismissedItems.has(index);
        return (
          <div
            key={`${uploadFile.file.name}-${index}`}
            className={`bg-white border border-gray-200 rounded-lg shadow-lg p-4 transition-all duration-300 ${
              isDismissed
                ? "opacity-0 transform translate-x-full"
                : "opacity-100 transform translate-x-0"
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">
                {getFileIcon(uploadFile.file.name)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadFile.file.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(uploadFile.status)}
                    <button
                      onClick={() => handleDismiss(index)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{formatFileSize(uploadFile.file.size)}</span>
                  {uploadFile.status === "uploading" && (
                    <span>{Math.round(uploadFile.progress)}%</span>
                  )}
                </div>

                {uploadFile.status === "uploading" && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadFile.progress}%` }}
                    ></div>
                  </div>
                )}

                {uploadFile.status === "success" && (
                  <p className="text-xs text-green-600 font-medium">
                    Upload completed!
                  </p>
                )}

                {uploadFile.status === "error" && (
                  <p className="text-xs text-red-600 font-medium">
                    {uploadFile.error || "Upload failed"}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
