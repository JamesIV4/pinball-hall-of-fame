import React, { useEffect, useState } from "react";

type OverlayEventDetail =
  | { type: "show"; rect: DOMRect; text: string }
  | { type: "hide" };

export default function TimestampOverlay() {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const onEvt = (e: Event) => {
      const ce = e as CustomEvent<OverlayEventDetail>;
      if (!ce || !ce.detail) return;
      if (ce.detail.type === "hide") {
        setVisible(false);
        return;
      }
      const { rect, text } = ce.detail;
      const margin = 8;
      const vw = window.innerWidth;
      const estimatedWidth = Math.min(vw * 0.8, Math.max(140, text.length * 7));
      const left = Math.max(margin, Math.min(vw - margin - estimatedWidth, rect.left + rect.width / 2 - estimatedWidth / 2));
      const top = Math.max(margin, rect.top - 28 - margin); // 28px approx height
      setText(text);
      setPos({ top, left });
      setVisible(true);
    };
    window.addEventListener("timestamp-overlay", onEvt as EventListener);
    return () => window.removeEventListener("timestamp-overlay", onEvt as EventListener);
  }, []);

  if (!visible || !pos) return null;

  return (
    <div
      role="tooltip"
      className="fixed z-[9999] px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none"
      style={{ top: pos.top, left: pos.left, maxWidth: "80vw" }}
    >
      {text}
    </div>
  );
}

