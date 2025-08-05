import { useState } from "react";
import Button from "./Button";
import { verifyPassword } from "../../utils/passwordUtils";

interface DeleteButtonProps {
  onDelete: () => void;
  itemName: string;
  itemType: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function DeleteButton({ onDelete, itemName, itemType, size = "sm", className }: DeleteButtonProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleDelete = () => {
    if (confirm(`Delete ${itemType} "${itemName}" and all associated data?`)) {
      setShowPasswordModal(true);
    }
  };

  const handlePasswordSubmit = async () => {
    const isValid = await verifyPassword(password);
    if (isValid) {
      setShowPasswordModal(false);
      setPassword("");
      setError("");
      onDelete();
    } else {
      setError("Incorrect password");
    }
  };

  const handleCancel = () => {
    setShowPasswordModal(false);
    setPassword("");
    setError("");
  };

  return (
    <>
      <Button variant="danger" size={size} className={className} onClick={handleDelete}>
        Delete
      </Button>
      
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-amber-400 mb-4">Enter Password</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-700 text-white mb-2"
              placeholder="Password"
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex gap-2">
              <Button variant="danger" className="flex-1" onClick={handlePasswordSubmit}>
                Confirm Delete
              </Button>
              <Button variant="cancel" className="flex-1" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}