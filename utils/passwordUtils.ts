import { doc, getDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";

const REMEMBER_KEY = "phof.sudoUntil";
const FIVE_MINUTES_MS = 5 * 60 * 1000;

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

export function rememberPasswordForFiveMinutes(): void {
  if (typeof window === "undefined") return;
  const until = Date.now() + FIVE_MINUTES_MS;
  try {
    window.localStorage.setItem(REMEMBER_KEY, String(until));
  } catch {}
}

export function isPasswordRemembered(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(REMEMBER_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (Number.isNaN(until)) return false;
    return Date.now() < until;
  } catch {
    return false;
  }
}

export function clearRememberedPassword(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(REMEMBER_KEY);
  } catch {}
}
