"use client";

interface AIMetadata {
  category: string;
  isCustomCategory: boolean;
  tags: string[];
  sensitiveData?: boolean;
  sensitiveDataTags?: string[];
  confidence: number;
  language: string;
  description: string;
  aiName: string;
  processingStatus: "pending" | "completed" | "failed";
  lastAnalyzed: string;
}

interface UserFile {
  id: string;
  originalName: string;
  fileName: string;
  url: string;
  size: number;
  type: string;
  aiMetadata: AIMetadata;
  uploadedAt: string;
}

interface FileItemProps {
  file: UserFile;
  showAINames: boolean;
  onView: (file: UserFile) => void;
  onCopyUrl: (file: UserFile) => void;
  onDelete: (file: UserFile) => void;
}

export default function FileItem({
  file,
  showAINames,
  onView,
  onCopyUrl,
  onDelete,
}: FileItemProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith("image/")) return "🖼️";
    if (type === "application/pdf") return "📄";
    if (type === "application/msword") return "📝";
    if (type === "text/plain") return "📄";
    if (type === "text/markdown") return "📝";
    return "📎";
  };

  const getFileTypeClass = (type: string): string => {
    if (type.startsWith("image/")) return "file-image";
    if (type === "application/pdf") return "file-pdf";
    if (type === "application/msword") return "file-doc";
    if (type === "text/plain" || type === "text/markdown") return "file-text";
    return "";
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case "completed":
        return "status-completed";
      case "failed":
        return "status-failed";
      case "pending":
        return "status-pending";
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors file-item-hover fade-in">
      {/* File Icon */}
      <div className="flex-shrink-0 mr-4">
        <span className={`text-2xl ${getFileTypeClass(file.type)}`}>
          {getFileIcon(file.type)}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          {/* File Name */}
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {showAINames ? file.aiMetadata.aiName : file.originalName}
          </h3>

          {/* Category Badge */}
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 badge">
            {file.aiMetadata.category}
          </span>

          {/* Processing Status */}
          <span
            className={`status-dot ${getStatusClass(
              file.aiMetadata.processingStatus
            )}`}
          ></span>

          {/* Sensitive Data Badge */}
          {file.aiMetadata.sensitiveData && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 badge">
              🔒 Sensitive
            </span>
          )}

          {/* Sensitive Data Tags - on same row */}
          {file.aiMetadata.sensitiveDataTags &&
            file.aiMetadata.sensitiveDataTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {file.aiMetadata.sensitiveDataTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-200 badge"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 truncate mb-1">
          {file.aiMetadata.description}
        </p>

        {/* Tags Row */}
        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-1">
          {/* Regular Tags */}
          {file.aiMetadata.tags && file.aiMetadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {file.aiMetadata.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 badge"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* File Details */}
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <span className="font-medium">{formatFileSize(file.size)}</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span>
            {Math.round(file.aiMetadata.confidence * 100)}% confidence
          </span>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={() => onView(file)}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
        >
          View
        </button>
        <button
          onClick={() => onCopyUrl(file)}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded hover:bg-gray-100"
          title="Copy URL"
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
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
        <button
          onClick={() => onDelete(file)}
          className="p-1.5 text-red-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
          title="Slett fil"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
