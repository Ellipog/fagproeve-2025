"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";

export interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  uploading: boolean;
  error: string;
  uploadingFiles?: UploadingFile[];
  onDismissUploadStatus?: (index: number) => void;
}

const acceptedTypes = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "application/msword": [".doc"],
};

const acceptString =
  Object.keys(acceptedTypes).join(",") +
  "," +
  Object.values(acceptedTypes).flat().join(",");

export default function FileUpload({
  onUpload,
  uploading,
  error,
  uploadingFiles = [],
  onDismissUploadStatus,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const isValidType =
      Object.keys(acceptedTypes).includes(file.type) ||
      Object.values(acceptedTypes)
        .flat()
        .some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      return {
        isValid: false,
        error: `Unsupported format. Upload PDF, DOC, images, or text files only.`,
      };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File too large. Maximum size is 10MB.`,
      };
    }

    return { isValid: true };
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(validation.error!);
      }
    });

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      setSelectedFiles([]);
    }
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
            className="animate-spin w-4 h-4 text-blue-600"
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
            className="w-4 h-4 text-green-600"
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
            className="w-4 h-4 text-red-600"
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

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
          <svg
            className="w-6 h-6 mr-2 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Upload Files
        </h2>
        <p className="text-sm text-gray-600">
          Drag & drop files or click to browse your computer
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 mb-6 ${
          dragActive
            ? "border-blue-400 bg-blue-50 scale-105"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptString}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <div
            className={`text-5xl transition-transform duration-300 ${
              dragActive ? "scale-110" : ""
            }`}
          >
            {dragActive ? "📂" : "📁"}
          </div>
          <div>
            <p className="text-base font-medium text-gray-800 mb-2">
              {dragActive
                ? "Drop files here!"
                : "Drop files here or click to browse"}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Supports PDF, DOC, images (JPG, PNG, GIF, WebP), and text files
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Maximum file size: 10MB per file
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Choose Files
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg fade-in">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-400 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mb-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Selected Files ({selectedFiles.length})
            </h3>
          </div>
          <div className="space-y-3 mb-6">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 file-item-hover fade-in shadow-sm"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-xl">{getFileIcon(file.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-3 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove file"
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
            ))}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="w-full py-3 px-4 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Uploading {selectedFiles.length} file
                {selectedFiles.length !== 1 ? "s" : ""}...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload {selectedFiles.length} file
                {selectedFiles.length !== 1 ? "s" : ""}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Upload Status */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Status ({uploadingFiles.length})
            </h3>
          </div>
          <div className="space-y-2 overflow-y-auto scrollbar-thin">
            {uploadingFiles.map((uploadFile, index) => (
              <div
                key={`${uploadFile.file.name}-${index}`}
                className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {getFileIcon(uploadFile.file.name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {uploadFile.file.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(uploadFile.status)}
                        {onDismissUploadStatus && (
                          <button
                            onClick={() => onDismissUploadStatus(index)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <svg
                              className="w-3 h-3"
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
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{formatFileSize(uploadFile.file.size)}</span>
                      {uploadFile.status === "uploading" && (
                        <span>{Math.round(uploadFile.progress)}%</span>
                      )}
                    </div>

                    {uploadFile.status === "uploading" && (
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
