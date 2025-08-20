import { FormEvent, useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import FormContainer from "@/components/ui/FormContainer";
import Input from "@/components/ui/Input";
import Toast from "@/components/ui/Toast";

export default function ManageDatabase() {
  const { db } = getFirebase();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type?: "success" | "error";
  }>({ msg: "" });

  useEffect(() => {
    checkPasswordExists();
  }, []);

  async function checkPasswordExists() {
    try {
      const passwordDoc = await getDoc(doc(db, "data/settings/settings", "password"));
      setHasPassword(passwordDoc.exists());
    } catch (err) {
      console.error(err);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setToast({ msg: "Passwords don't match", type: "error" });
      return;
    }

    if (hasPassword) {
      try {
        const passwordDoc = await getDoc(doc(db, "data/settings/settings", "password"));
        if (passwordDoc.data()?.password !== currentPassword) {
          setToast({ msg: "Current password is incorrect", type: "error" });
          return;
        }
      } catch (err) {
        console.error(err);
        setToast({ msg: "Error verifying password", type: "error" });
        return;
      }
    }

    try {
      await setDoc(doc(db, "data/settings/settings", "password"), { password: newPassword });
      setToast({ msg: hasPassword ? "Password updated!" : "Password set!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setHasPassword(true);
    } catch (err) {
      console.error(err);
      setToast({ msg: "Error saving password", type: "error" });
    }
  }

  return (
    <>
      <Toast message={toast.msg} type={toast.type} clear={() => setToast({ msg: "" })} />
      <FormContainer title="Manage Database Password" className="max-w-lg mx-auto">
        <form onSubmit={onSubmit}>
          {hasPassword && (
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          )}
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" size="lg">
            {hasPassword ? "Update Password" : "Set Password"}
          </Button>
        </form>
      </FormContainer>
    </>
  );
}
