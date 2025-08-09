import { doc, getDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";

export async function verifyPassword(inputPassword: string): Promise<boolean> {
  const { db } = getFirebase();
  try {
    const passwordDoc = await getDoc(doc(db, "data/settings/settings", "password"));
    return passwordDoc.exists() && passwordDoc.data()?.password === inputPassword;
  } catch (err) {
    console.error(err);
    return false;
  }
}
