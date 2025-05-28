"use client";

import { useState } from "react";

export default function TestConversionPage() {
  const [selectedType, setSelectedType] = useState("pdf");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const documentTypes = [
    {
      value: "pdf",
      label: "PDF Document",
      note: "Now handled natively by OpenAI",
    },
    { value: "doc", label: "DOC Document", note: "Converted to image" },
    { value: "txt", label: "Text File", note: "Converted to image" },
    { value: "md", label: "Markdown File", note: "Converted to image" },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const convertUploadedFile = async () => {
    if (!uploadedFile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const response = await fetch("/api/test-conversion", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          // PDF files return JSON response
          const data = await response.json();
          alert(
            `${data.message}\n\nFile: ${data.fileName}\nNote: ${data.note}`
          );
        } else {
          // Other files return image
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          window.open(imageUrl, "_blank");
        }
      } else {
        const error = await response.json();
        alert(`Processing failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Processing failed");
    } finally {
      setLoading(false);
    }
  };

  const testSampleDocument = async (type: string) => {
    try {
      const response = await fetch(`/api/test-conversion?type=${type}`);

      if (response.ok) {
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          // PDF files return JSON response
          const data = await response.json();
          alert(
            `${data.message}\n\nFile: ${data.fileName}\nNote: ${data.note}`
          );
        } else {
          // Other files return image
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          window.open(imageUrl, "_blank");
        }
      } else {
        const error = await response.json();
        alert(`Processing failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Error processing sample:", error);
      alert("Processing failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Document Processing Test
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Sample Documents</h2>
          <p className="text-gray-600 mb-6">
            Click on any document type below to see how it gets processed:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {documentTypes.map((type) => (
              <div key={type.value} className="text-center">
                <button
                  onClick={() => testSampleDocument(type.value)}
                  className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
                    type.value === "pdf"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {type.label}
                </button>
                <p className="text-xs text-gray-500 mt-1">{type.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Your Own File</h2>
          <p className="text-gray-600 mb-6">
            Upload a document to see how it gets processed:
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose a file to process:
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.txt,.md,.png,.jpg,.jpeg,.gif,.webp"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {uploadedFile && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Selected file:</strong> {uploadedFile.name} (
                  {(uploadedFile.size / 1024).toFixed(1)} KB)
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {uploadedFile.type || "Unknown"}
                </p>
                {uploadedFile.type === "application/pdf" && (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ This PDF will be handled natively by OpenAI
                  </p>
                )}
              </div>
            )}

            <button
              onClick={convertUploadedFile}
              disabled={!uploadedFile || loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
            >
              {loading ? "Processing..." : "Process Document"}
            </button>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How it works:
          </h3>
          <ul className="text-blue-800 space-y-1">
            <li>
              • <strong>PDF files:</strong> Sent directly to OpenAI for native
              processing (no conversion needed)
            </li>
            <li>
              • <strong>DOC files:</strong> Create visual placeholders with
              metadata
            </li>
            <li>
              • <strong>Text files:</strong> Render content on canvas with
              proper formatting
            </li>
            <li>
              • <strong>Images:</strong> Pass through unchanged (no conversion
              needed)
            </li>
          </ul>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            <strong>✓ Updated:</strong> PDF files are now handled natively by
            OpenAI's vision models, providing better accuracy and eliminating
            the need for PDF-to-image conversion.
          </p>
        </div>
      </div>
    </div>
  );
}
