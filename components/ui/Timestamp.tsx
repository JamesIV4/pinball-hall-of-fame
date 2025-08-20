import React, { useRef } from "react";

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
    const anchorRef = useRef<HTMLSpanElement | null>(null);
    const dispatchShow = () => {
      const a = anchorRef.current;
      if (!a || typeof window === "undefined") return;
      const rect = a.getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent("timestamp-overlay", { detail: { type: "show", rect, text: fullDateTime } })
      );
    };
    const dispatchHide = () => {
      if (typeof window === "undefined") return;
      window.dispatchEvent(new CustomEvent("timestamp-overlay", { detail: { type: "hide" } }));
    };

    if (!showTime) {
      return (
        <Tag className={`inline-flex text-xs text-gray-400 ${className}`}>
          <span>{dateOnly}</span>
        </Tag>
      );
    }

    return (
      <Tag className={`inline-flex text-xs text-gray-400 ${className}`}>
        {/* Mobile: date only for brevity, acts as anchor for tooltip */}
        <span
          ref={anchorRef}
          className="md:hidden"
          tabIndex={0}
          onMouseEnter={dispatchShow}
          onMouseLeave={dispatchHide}
          onFocus={dispatchShow}
          onBlur={dispatchHide}
          onClick={(e) => {
            e.stopPropagation();
            dispatchShow();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            dispatchShow();
          }}
          onTouchEnd={dispatchHide}
        >
          {dateOnly}
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
