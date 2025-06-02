"use client";

import CustomDropdown from "./CustomDropdown";
import CustomCheckbox from "./CustomCheckbox";

interface FiltersPanelProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (order: "asc" | "desc") => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  showSensitiveOnly: boolean;
  onSensitiveFilterChange: (show: boolean) => void;
  fileCount: number;
  showAINames: boolean;
  onNameToggle: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function FiltersPanel({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  selectedCategory,
  onCategoryChange,
  categories,
  showSensitiveOnly,
  onSensitiveFilterChange,
  fileCount,
  showAINames,
  onNameToggle,
  onRefresh,
  refreshing,
}: FiltersPanelProps) {
  const sortOptions = [
    { value: "uploadedAt", label: "Upload Date" },
    { value: "originalName", label: "Name" },
    { value: "size", label: "Size" },
    { value: "aiMetadata.confidence", label: "AI Confidence" },
    { value: "aiMetadata.category", label: "Category" },
  ];

  const sortOrderOptions = [
    { value: "desc", label: "Newest First" },
    { value: "asc", label: "Oldest First" },
  ];

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((category) => ({
      value: category,
      label: category,
    })),
  ];

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Files ({fileCount})
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onNameToggle}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                showAINames
                  ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
              }`}
              title={
                showAINames ? "Switch to original names" : "Switch to AI names"
              }
            >
              {showAINames ? "🤖 AI" : "📄 Original"}
            </button>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
            >
              {refreshing ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-1 h-3 w-3 text-gray-400"
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
                  ...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search files, descriptions, tags..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-4 w-4"
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

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sort By */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              <span className="flex items-center">
                <svg
                  className="w-3 h-3 mr-1 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
                Sort by
              </span>
            </label>
            <CustomDropdown
              options={sortOptions}
              value={sortBy}
              onChange={onSortChange}
              placeholder="Select sort option"
              className="text-sm"
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              <span className="flex items-center">
                <svg
                  className="w-3 h-3 mr-1 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
                Order
              </span>
            </label>
            <CustomDropdown
              options={sortOrderOptions}
              value={sortOrder}
              onChange={(value) => onSortOrderChange(value as "asc" | "desc")}
              placeholder="Select order"
              className="text-sm"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              <span className="flex items-center">
                <svg
                  className="w-3 h-3 mr-1 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                Category
              </span>
            </label>
            <CustomDropdown
              options={categoryOptions}
              value={selectedCategory}
              onChange={onCategoryChange}
              placeholder="All Categories"
              className="text-sm"
            />
          </div>

          {/* Sensitive Data Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              <span className="flex items-center">
                <svg
                  className="w-3 h-3 mr-1 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Data Type
              </span>
            </label>
            <CustomCheckbox
              checked={showSensitiveOnly}
              onChange={onSensitiveFilterChange}
              label="🔒 Sensitive only"
              id="sensitiveOnly"
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchTerm || selectedCategory || showSensitiveOnly) && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-800 flex items-center">
                <svg
                  className="w-3 h-3 mr-1 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Active:
              </span>

              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  &ldquo;{searchTerm}&rdquo;
                  <button
                    onClick={() => onSearchChange("")}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedCategory && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  {selectedCategory}
                  <button
                    onClick={() => onCategoryChange("")}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}

              {showSensitiveOnly && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                  🔒 Sensitive
                  <button
                    onClick={() => onSensitiveFilterChange(false)}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 text-red-600 hover:text-red-800 hover:bg-red-200 rounded-full transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}

              <button
                onClick={() => {
                  onSearchChange("");
                  onCategoryChange("");
                  onSensitiveFilterChange(false);
                }}
                className="text-xs text-gray-600 hover:text-gray-800 underline font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
