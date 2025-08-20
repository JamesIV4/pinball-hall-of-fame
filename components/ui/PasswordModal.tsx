import { useEffect, useState } from "react";
import Button from "./Button";
import { verifyPassword, isPasswordRemembered, rememberPasswordForFiveMinutes } from "../../utils/passwordUtils";

interface PasswordModalProps {
  isOpen: boolean;
  title: string;
  confirmTitle?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

export default function PasswordModal({
  isOpen,
  title,
  confirmTitle,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
}: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);
  const [rememberActive, setRememberActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRememberActive(isPasswordRemembered());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rememberActive) {
      // Within remembered window: just confirm
      onConfirm();
      return;
    }
    const isValid = await verifyPassword(password);
    if (isValid) {
      if (remember) rememberPasswordForFiveMinutes();
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

  const heading = rememberActive ? confirmTitle || "Confirm Action" : title;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{heading}</h3>
        {rememberActive ? (
          <p className="text-gray-300 mb-4">Confirm you want to proceed.</p>
        ) : (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-700 text-white mb-2"
              placeholder="Password"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            {error && <p className="text-red-400 text-sm -mt-1 mb-2 ml-1">{error}</p>}
            <label className="flex items-center gap-2 text-gray-300 mb-2 select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-amber-500"
              />
              Remember for 5 minutes
            </label>
          </>
        )}
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
