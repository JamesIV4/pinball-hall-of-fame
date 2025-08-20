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
}: {
  timestamp?: string;
  className?: string;
  variant?: Variant;
  as?: AsTag;
}) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const content =
    variant === "ago"
      ? formatTimeAgo(timestamp)
      : variant === "date"
        ? date.toLocaleDateString()
        : `${date.toLocaleString()} • ${formatTimeAgo(timestamp)}`;

  const Tag = as as any;
  return <Tag className={`text-xs text-gray-400 ${className}`}>{content}</Tag>;
}
