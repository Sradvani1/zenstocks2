import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export const AUTH_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Invalid email or password.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/unauthorized-domain": "This domain is not authorized for sign-in.",
  "auth/operation-not-allowed": "Google sign-in is not enabled.",
};

function getAuthProvider(user: User): "email" | "google" {
  const providerId = user.providerData[0]?.providerId;
  return providerId === "google.com" ? "google" : "email";
}

export async function bootstrapUserDoc(user: User): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const provider = getAuthProvider(user);

  const data = {
    email: user.email ?? "",
    displayName: user.displayName,
    authProvider: provider,
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(
      userRef,
      { ...data, settings: { theme: "system" as const }, createdAt: serverTimestamp() },
      { merge: true },
    );
  } else {
    await setDoc(userRef, data, { merge: true });
  }
}
