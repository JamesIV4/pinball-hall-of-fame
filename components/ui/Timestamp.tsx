import React from "react";

function formatTimeAgo(timestamp?: string): string {
  if (!timestamp) return "";
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

type Variant = "full" | "ago" | "date";
type AsTag = "div" | "span";

export default function Timestamp({
  timestamp,
  className = "",
  variant = "full",
  as = "div",
  showTime = true,
}: {
  timestamp?: string;
  className?: string;
  variant?: Variant;
  as?: AsTag;
  showTime?: boolean; // when false and variant="date", always hide time
}) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const Tag = as as any;

  const dateOnly = date.toLocaleDateString();
  const timeOnly = date.toLocaleTimeString();
  const fullDateTime = date.toLocaleString();
  const ago = formatTimeAgo(timestamp);

  // Render per-variant with responsive behavior:
  // - date: mobile shows date only; desktop shows full date + time
  // - ago: show relative time only
  // - full: show date + time + relative time
  if (variant === "date") {
    if (!showTime) {
      return (
        <Tag className={`inline-flex text-xs text-gray-400 ${className}`}>
          <span>{dateOnly}</span>
        </Tag>
      );
    }

    return (
      <Tag className={`inline-flex text-xs text-gray-400 ${className}`}>
        {/* Mobile: date as anchor with CSS-only tooltip */}
        <span className="relative md:hidden inline-flex group" tabIndex={0}>
          <span>{dateOnly}</span>
          <span
            className="absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap rounded bg-gray-900 text-white px-2 py-1 text-[10px] opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100 transition-opacity z-50 shadow-lg"
          >
            {fullDateTime}
          </span>
        </span>
        {/* Desktop: full datetime */}
        <span className="hidden md:inline">{fullDateTime}</span>
      </Tag>
    );
  }

  if (variant === "ago") {
    return (
      <Tag className={`inline-flex text-xs text-gray-400 ${className}`}>
        <span>{ago}</span>
      </Tag>
    );
  }

  // variant === "full"
  return (
    <Tag className={`inline-flex text-xs text-gray-400 ${className}`}>
      <span>{`${fullDateTime} • ${ago}`}</span>
    </Tag>
  );
}
