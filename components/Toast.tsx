import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  clear: () => void;
}

export default function Toast({
  message,
  type = "success",
  clear,
}: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(clear, 3000);
    return () => clearTimeout(t);
  }, [message, clear]);

  if (!message) return null;
  return (
    <div
      className={`fixed bottom-5 right-5 px-4 py-2 rounded-lg shadow-lg text-white ${
        type === "success" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {message}
    </div>
  );
}
