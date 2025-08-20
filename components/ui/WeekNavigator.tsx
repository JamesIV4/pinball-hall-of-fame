import React from "react";

interface WeekNavigatorProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
}

export default function WeekNavigator({ label, onPrev, onNext, isNextDisabled = false }: WeekNavigatorProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
      <div className="text-sm text-gray-200">{label}</div>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 text-sm" onClick={onPrev}>
          ← Previous
        </button>
        <button
          className={`px-3 py-1.5 rounded text-sm ${
            isNextDisabled
              ? "bg-gray-900 text-gray-500 cursor-not-allowed"
              : "bg-gray-700 hover:bg-gray-600 text-gray-200"
          }`}
          disabled={isNextDisabled}
          onClick={onNext}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
