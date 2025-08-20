import React from "react";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  onClick?: () => void;
}

export default function StatTile({
  label,
  value,
  className = "",
  labelClassName = "text-xs text-gray-400",
  valueClassName = "text-xl font-bold text-gray-200",
  onClick,
}: StatTileProps) {
  const clickable = !!onClick;
  return (
    <div
      onClick={onClick}
      className={`${className} ${clickable ? "cursor-pointer" : ""}`.trim()}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className={labelClassName}>{label}</div>
      <div className={valueClassName}>{value}</div>
    </div>
  );
}
