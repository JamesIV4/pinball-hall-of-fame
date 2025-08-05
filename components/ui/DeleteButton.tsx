import { useState } from "react";
import Button from "./Button";
import PasswordModal from "./PasswordModal";

interface DeleteButtonProps {
  onDelete: () => void;
  itemName: string;
  itemType: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function DeleteButton({ onDelete, itemName, itemType, size = "sm", className }: DeleteButtonProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleDelete = () => {
    if (confirm(`Delete ${itemType} "${itemName}" and all associated data?`)) {
      setShowPasswordModal(true);
    }
  };

  const handleConfirm = () => {
    setShowPasswordModal(false);
    onDelete();
  };

  return (
    <>
      <Button variant="danger" size={size} className={className} onClick={handleDelete}>
        Delete
      </Button>
      
      <PasswordModal
        isOpen={showPasswordModal}
        title="Enter Password"
        onConfirm={handleConfirm}
        onCancel={() => setShowPasswordModal(false)}
        confirmText="Confirm Delete"
      />
    </>
  );
}