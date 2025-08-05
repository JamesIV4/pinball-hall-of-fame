import { useState } from "react";
import Button from "./Button";
import { verifyPassword } from "../../utils/passwordUtils";

interface PasswordModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

export default function PasswordModal({
  isOpen,
  title,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
}: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const isValid = await verifyPassword(password);
    if (isValid) {
      setPassword("");
      setError("");
      onConfirm();
    } else {
      setError("Incorrect password");
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError("");
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{title}</h3>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded-lg bg-gray-700 text-white mb-4"
          placeholder="Password"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {error && <p className="text-red-400 text-sm -mt-2 mb-4 ml-1">{error}</p>}
        <div className="flex gap-2">
          <Button variant="danger" className="flex-1" onClick={handleSubmit}>
            {confirmText}
          </Button>
          <Button variant="cancel" className="flex-1" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
