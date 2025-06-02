"use client";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
  className?: string;
}

export default function CustomCheckbox({
  checked,
  onChange,
  label,
  id,
  className = "",
}: CustomCheckboxProps) {
  const checkboxId =
    id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      className={`flex items-center h-9 bg-white border border-gray-300 rounded-lg px-3 shadow-sm hover:border-gray-400 transition-colors ${className}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          onClick={() => onChange(!checked)}
          className={`w-4 h-4 rounded border-2 cursor-pointer transition-all duration-200 ${
            checked
              ? "bg-blue-600 border-blue-600"
              : "bg-white border-gray-300 hover:border-gray-400"
          }`}
        >
          {checked && (
            <svg
              className="w-2.5 h-2.5 text-white absolute top-0.5 left-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
      <label
        htmlFor={checkboxId}
        className="ml-2 text-gray-900 font-medium cursor-pointer select-none text-sm"
      >
        {label}
      </label>
    </div>
  );
}
