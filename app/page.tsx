"use client";

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AIMetadata {
  description: string;
  tags: string[];
  category: string;
  confidence: number;
  extractedText?: string;
  language?: string;
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

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  error?: string;
  details?: string[];
}

export default function Home() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string>("");

  // Auth form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User files state
  const [userFiles, setUserFiles] = useState<UserFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Get fresh URL for a file
  const getFreshFileUrl = async (fileId: string): Promise<string | null> => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const response = await fetch(`/api/files/${fileId}/url`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        return data.url;
      } else {
        console.error("Failed to get file URL:", data.error);
        return null;
      }
    } catch (error) {
      console.error("Error getting file URL:", error);
      return null;
    }
  };

  // Fetch user files
  const fetchUserFiles = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingFiles(true);
    try {
      const response = await fetch("/api/files", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUserFiles(data.files);
      } else {
        console.error("Failed to fetch files:", data.error);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // You could verify the token here by calling an API endpoint
      // For now, we'll just assume it's valid if it exists
      setIsAuthenticated(true);
      fetchUserFiles();
      // You could also fetch user data here
    }
  }, []);

  // Authentication functions
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const endpoint =
        authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.token && data.user) {
        localStorage.setItem("token", data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setEmail("");
        setPassword("");
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch (error) {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    setUploadedFiles([]);
    setUploadResults([]);
    setUserFiles([]);
    setError("");
  };

  // Accepted file types
  const acceptedTypes = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
  };

  const acceptString =
    Object.keys(acceptedTypes).join(",") +
    "," +
    Object.values(acceptedTypes).flat().join(",");

  const validateFile = (file: File): boolean => {
    const isValidType =
      Object.keys(acceptedTypes).includes(file.type) ||
      Object.values(acceptedTypes)
        .flat()
        .some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      setError(
        `File "${file.name}" is not a supported format. Please upload PDF, DOCX, or image files only.`
      );
      return false;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
      return false;
    }

    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    setError("");
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (validateFile(file)) {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles]);
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
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file: File): string => {
    if (file.type.startsWith("image/")) return "🖼️";
    if (file.type === "application/pdf") return "📄";
    if (file.type.includes("wordprocessingml")) return "📝";
    return "📎";
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const token = localStorage.getItem("token");
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadResults(result.uploadedFiles);
        setUploadedFiles([]);
        // Refresh user files after successful upload
        fetchUserFiles();
        alert(`Successfully uploaded ${result.uploadedFiles.length} file(s)!`);
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Render authentication forms
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {authMode === "login" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-gray-600">
                {authMode === "login"
                  ? "Sign in to access file upload"
                  : "Sign up to start uploading files"}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              {authError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                {authLoading
                  ? authMode === "login"
                    ? "Signing in..."
                    : "Creating account..."
                  : authMode === "login"
                  ? "Sign In"
                  : "Sign Up"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {authMode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}
                <button
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "signup" : "login");
                    setAuthError("");
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  {authMode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render file upload interface (authenticated users only)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with user info and logout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              File Upload
            </h1>
            <p className="text-gray-600">Upload PDF, DOCX, or image files</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-2">Welcome, {user?.email}</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white hover:border-gray-400"
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
            <div className="text-6xl">📁</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports PDF, DOCX, and image files (JPG, PNG)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Maximum file size: 10MB
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Choose Files
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Uploaded Files ({uploadedFiles.length})
            </h2>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(file)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} •{" "}
                        {file.type || "Unknown type"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200"
                    title="Remove file"
                  >
                    <svg
                      className="w-5 h-5"
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
            <div className="mt-6 text-center">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                {uploading
                  ? "Uploading..."
                  : `Upload ${uploadedFiles.length} File${
                      uploadedFiles.length !== 1 ? "s" : ""
                    }`}
              </button>
            </div>
          </div>
        )}

        {/* Successfully Uploaded Files */}
        {uploadResults.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Successfully Uploaded Files ({uploadResults.length})
            </h2>
            <div className="space-y-3">
              {uploadResults.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {file.originalName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                      {file.s3Key && (
                        <button
                          onClick={async () => {
                            const freshUrl = await getFreshFileUrl(file.id);
                            if (freshUrl) {
                              window.open(freshUrl, "_blank");
                            } else {
                              alert(
                                "Failed to generate file access URL. Please try again."
                              );
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 underline bg-none border-none cursor-pointer"
                        >
                          View file
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (file.s3Key) {
                        const freshUrl = await getFreshFileUrl(file.id);
                        if (freshUrl) {
                          navigator.clipboard.writeText(freshUrl);
                          alert("URL copied to clipboard!");
                        } else {
                          alert(
                            "Failed to generate file access URL. Please try again."
                          );
                        }
                      }
                    }}
                    className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                    title="Copy URL"
                  >
                    <svg
                      className="w-5 h-5"
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User's Files Library */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Files ({userFiles.length})
            </h2>
            <button
              onClick={fetchUserFiles}
              disabled={loadingFiles}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 text-sm"
            >
              {loadingFiles ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loadingFiles ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading your files...</p>
            </div>
          ) : userFiles.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                No files uploaded yet. Upload your first file above!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <span className="text-3xl">
                        {getFileIcon({
                          name: file.originalName,
                          type: file.type,
                        } as File)}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {file.originalName}
                          </h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {file.aiMetadata.category}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {file.aiMetadata.description}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {file.aiMetadata.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{file.type}</span>
                          <span>•</span>
                          <span>
                            Confidence:{" "}
                            {Math.round(file.aiMetadata.confidence * 100)}%
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={async () => {
                          const freshUrl = await getFreshFileUrl(file.id);
                          if (freshUrl) {
                            window.open(freshUrl, "_blank");
                          } else {
                            alert(
                              "Failed to generate file access URL. Please try again."
                            );
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors duration-200"
                      >
                        View
                      </button>
                      <button
                        onClick={async () => {
                          const freshUrl = await getFreshFileUrl(file.id);
                          if (freshUrl) {
                            navigator.clipboard.writeText(freshUrl);
                            alert("URL copied to clipboard!");
                          } else {
                            alert(
                              "Failed to generate file access URL. Please try again."
                            );
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700 transition-colors duration-200"
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
                    </div>
                  </div>

                  {file.aiMetadata.extractedText && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                          Extracted Text Preview
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-600 max-h-32 overflow-y-auto">
                          {file.aiMetadata.extractedText}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
