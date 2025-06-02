"use client";

import { useState, useEffect, useMemo } from "react";
import AuthForm from "./components/AuthForm";
import FileUpload, { UploadingFile } from "./components/FileUpload";
import FiltersPanel from "./components/FiltersPanel";
import FileItem from "./components/FileItem";
import ConfirmationModal from "./components/ConfirmationModal";
import ToastContainer from "./components/ToastContainer";
import { ToastProps } from "./components/Toast";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

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

export default function Home() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // File state
  const [userFiles, setUserFiles] = useState<UserFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Upload status tracking
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showSensitiveOnly, setShowSensitiveOnly] = useState(false);
  const [showAINames, setShowAINames] = useState(true);

  // Category collapsible state
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );

  // Modal and notification state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [toasts, setToasts] = useState<Omit<ToastProps, "onRemove">[]>([]);

  // Toggle category collapsed state
  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

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
      return data.success ? data.url : null;
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

  // Handle file upload with progress tracking
  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadError("");

    // Initialize upload status for each file
    const initialUploadingFiles: UploadingFile[] = files.map((file) => ({
      file,
      progress: 0,
      status: "uploading",
    }));
    setUploadingFiles(initialUploadingFiles);

    try {
      const token = localStorage.getItem("token");

      // Upload files in parallel
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append("file", file);

        // Start progress simulation for this specific file
        const progressInterval = setInterval(() => {
          setUploadingFiles((prev) =>
            prev.map((uploadFile, i) =>
              i === index
                ? {
                    ...uploadFile,
                    progress: Math.min(
                      uploadFile.progress + Math.random() * 15,
                      90
                    ),
                  }
                : uploadFile
            )
          );
        }, 300);

        try {
          const response = await fetch("/api/upload-single", {
            method: "POST",
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
          });

          clearInterval(progressInterval);

          const result = await response.json();

          if (result.success) {
            // Mark this file as successful
            setUploadingFiles((prev) =>
              prev.map((uploadFile, i) =>
                i === index
                  ? {
                      ...uploadFile,
                      progress: 100,
                      status: "success",
                    }
                  : uploadFile
              )
            );
            return { success: true, file: file.name, result };
          } else {
            // Mark this file as failed
            setUploadingFiles((prev) =>
              prev.map((uploadFile, i) =>
                i === index
                  ? {
                      ...uploadFile,
                      status: "error",
                      error: result.error || "Upload failed",
                    }
                  : uploadFile
              )
            );
            throw new Error(result.error || "Upload failed");
          }
        } catch (error) {
          clearInterval(progressInterval);

          // Mark this file as failed
          setUploadingFiles((prev) =>
            prev.map((uploadFile, i) =>
              i === index
                ? {
                    ...uploadFile,
                    status: "error",
                    error:
                      error instanceof Error ? error.message : "Upload failed",
                  }
                : uploadFile
            )
          );
          throw error;
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.allSettled(uploadPromises);

      // Count successful and failed uploads
      const successful = results.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failed = results.filter(
        (result) => result.status === "rejected"
      ).length;

      console.log(`Upload summary: ${successful} successful, ${failed} failed`);

      // Only show error if all uploads failed
      if (successful === 0 && failed > 0) {
        setUploadError(`All ${failed} file uploads failed. Please try again.`);
      } else if (failed > 0) {
        console.warn(`${failed} out of ${files.length} files failed to upload`);
      }

      // Refresh the file list after uploads
      await fetchUserFiles();

      // Auto-clear successful uploads after 3 seconds
      setTimeout(() => {
        setUploadingFiles((prev) =>
          prev.filter((uploadFile) => uploadFile.status !== "success")
        );
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to initiate file uploads. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDismissUploadStatus = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle file actions
  const handleViewFile = async (file: UserFile) => {
    const freshUrl = await getFreshFileUrl(file.id);
    if (freshUrl) {
      window.open(freshUrl, "_blank");
    } else {
      showToast(
        "error",
        "Feil",
        "Kunne ikke generere tilgangs-URL. Prøv igjen."
      );
    }
  };

  const handleCopyUrl = async (file: UserFile) => {
    const freshUrl = await getFreshFileUrl(file.id);
    if (freshUrl) {
      await navigator.clipboard.writeText(freshUrl);
      showToast(
        "success",
        "URL kopiert!",
        "URL er kopiert til utklippstavlen."
      );
    } else {
      showToast(
        "error",
        "Feil",
        "Kunne ikke generere tilgangs-URL. Prøv igjen."
      );
    }
  };

  const handleDeleteFile = async (file: UserFile) => {
    const fileName = showAINames ? file.aiMetadata?.aiName : file.originalName;

    showConfirmModal(
      "Slett fil",
      `Er du sikker på at du vil slette "${fileName}"?\n\nDenne handlingen kan ikke angres.`,
      async () => {
        hideConfirmModal();

        const token = localStorage.getItem("token");
        if (!token) {
          showToast(
            "error",
            "Feil",
            "Du må være innlogget for å slette filer."
          );
          return;
        }

        try {
          const response = await fetch(`/api/files/${file.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (data.success) {
            // Remove the file from the local state
            setUserFiles((prev) => prev.filter((f) => f.id !== file.id));
            showToast("success", "Fil slettet!", `"${fileName}" er slettet.`);
          } else {
            showToast(
              "error",
              "Feil ved sletting",
              data.error || "Ukjent feil"
            );
          }
        } catch (error) {
          console.error("Error deleting file:", error);
          showToast("error", "Feil", "Feil ved sletting av fil. Prøv igjen.");
        }
      }
    );
  };

  // Authentication handlers
  const handleAuthSuccess = (user: User) => {
    setUser(user);
    setIsAuthenticated(true);
    fetchUserFiles();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    setUserFiles([]);
    setUploadError("");
  };

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      fetchUserFiles();
    }
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(userFiles.map((file) => file.aiMetadata.category)),
    ];
    return uniqueCategories.filter(Boolean).sort();
  }, [userFiles]);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = userFiles;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (file) =>
          (file.originalName &&
            file.originalName.toLowerCase().includes(term)) ||
          (file.aiMetadata?.aiName &&
            file.aiMetadata.aiName.toLowerCase().includes(term)) ||
          (file.aiMetadata?.description &&
            file.aiMetadata.description.toLowerCase().includes(term)) ||
          (file.aiMetadata?.category &&
            file.aiMetadata.category.toLowerCase().includes(term)) ||
          (file.aiMetadata?.tags &&
            file.aiMetadata.tags.some(
              (tag) => tag && tag.toLowerCase().includes(term)
            )) ||
          (file.aiMetadata?.sensitiveDataTags &&
            file.aiMetadata.sensitiveDataTags.some(
              (tag) => tag && tag.toLowerCase().includes(term)
            ))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (file) => file.aiMetadata?.category === selectedCategory
      );
    }

    // Sensitive data filter
    if (showSensitiveOnly) {
      filtered = filtered.filter((file) => file.aiMetadata?.sensitiveData);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === "aiMetadata.confidence") {
        aValue = a.aiMetadata?.confidence || 0;
        bValue = b.aiMetadata?.confidence || 0;
      } else if (sortBy === "aiMetadata.category") {
        aValue = a.aiMetadata?.category || "";
        bValue = b.aiMetadata?.category || "";
      } else if (sortBy === "originalName") {
        aValue = (a.originalName || "").toLowerCase();
        bValue = (b.originalName || "").toLowerCase();
      } else if (sortBy === "size") {
        aValue = a.size || 0;
        bValue = b.size || 0;
      } else {
        // Default to uploadedAt
        aValue = new Date(a.uploadedAt || 0).getTime();
        bValue = new Date(b.uploadedAt || 0).getTime();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    userFiles,
    searchTerm,
    selectedCategory,
    showSensitiveOnly,
    sortBy,
    sortOrder,
  ]);

  // Group files by category
  const filesByCategory = useMemo(() => {
    const grouped: { [category: string]: UserFile[] } = {};

    filteredAndSortedFiles.forEach((file) => {
      const category = file.aiMetadata?.category || "Ukategorisert";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(file);
    });

    // Sort categories alphabetically, but put "Ukategorisert" last
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === "Ukategorisert") return 1;
      if (b === "Ukategorisert") return -1;
      return a.localeCompare(b, "no");
    });

    const sortedGrouped: { [category: string]: UserFile[] } = {};
    sortedCategories.forEach((category) => {
      sortedGrouped[category] = grouped[category];
    });

    return sortedGrouped;
  }, [filteredAndSortedFiles]);

  // Helper functions for notifications
  const showToast = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message?: string
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const hideConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Show authentication form if not logged in
  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  // Main application layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Document Manager
                </h1>
                <p className="text-sm text-gray-500">
                  AI-powered file organization
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back!</p>
                <p className="text-sm font-medium text-gray-900">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <span className="flex items-center">
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-81px)]">
        {/* Left Panel - File Upload */}
        <div className="w-80 bg-white border-r border-gray-200 shadow-sm overflow-y-auto scrollbar-thin">
          <div className="p-6">
            <FileUpload
              onUpload={handleUpload}
              uploading={uploading}
              error={uploadError}
              uploadingFiles={uploadingFiles}
              onDismissUploadStatus={handleDismissUploadStatus}
            />
          </div>
        </div>

        {/* Right Panel - Files */}
        <div className="flex-1 flex flex-col">
          {/* Filters Panel */}
          <FiltersPanel
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            showSensitiveOnly={showSensitiveOnly}
            onSensitiveFilterChange={setShowSensitiveOnly}
            fileCount={filteredAndSortedFiles.length}
            showAINames={showAINames}
            onNameToggle={() => setShowAINames(!showAINames)}
            onRefresh={fetchUserFiles}
            refreshing={loadingFiles}
          />

          {/* Files List */}
          <div className="flex-1 overflow-y-auto bg-white scrollbar-thin">
            {loadingFiles ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                  <p className="text-gray-600 font-medium">
                    Loading your files...
                  </p>
                  <p className="text-gray-500 text-sm">
                    This may take a moment
                  </p>
                </div>
              </div>
            ) : filteredAndSortedFiles.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center max-w-md">
                  <div className="text-6xl text-gray-300 mb-4">📁</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {userFiles.length === 0
                      ? "No files yet"
                      : "No matches found"}
                  </h3>
                  <p className="text-gray-600">
                    {userFiles.length === 0
                      ? "Upload your first file using the panel on the left to get started!"
                      : "Try adjusting your search terms or filters to find what you're looking for."}
                  </p>
                  {userFiles.length > 0 && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("");
                        setShowSensitiveOnly(false);
                      }}
                      className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4">
                {Object.entries(filesByCategory).map(([category, files]) => {
                  const isCollapsed = collapsedCategories.has(category);
                  return (
                    <div key={category} className="mb-8">
                      {/* Category Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-1 h-8 bg-blue-600 rounded"></div>
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                              {category}
                            </h2>
                            <p className="text-sm text-gray-500">
                              {files.length}{" "}
                              {files.length === 1 ? "dokument" : "dokumenter"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            {files.length}
                          </div>
                          <button
                            onClick={() => toggleCategoryCollapse(category)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title={isCollapsed ? "Vis filer" : "Skjul filer"}
                          >
                            <svg
                              className={`w-4 h-4 transform transition-transform duration-200 ${
                                isCollapsed ? "rotate-0" : "rotate-180"
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Files in this category - with collapse animation */}
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isCollapsed
                            ? "max-h-0 opacity-0"
                            : "max-h-none opacity-100"
                        }`}
                      >
                        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 shadow-sm">
                          {files.map((file) => (
                            <FileItem
                              key={file.id}
                              file={file}
                              showAINames={showAINames}
                              onView={handleViewFile}
                              onCopyUrl={handleCopyUrl}
                              onDelete={handleDeleteFile}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal and Toast Components */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Slett"
        cancelText="Avbryt"
        onConfirm={confirmModal.onConfirm}
        onCancel={hideConfirmModal}
        type="danger"
      />

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
