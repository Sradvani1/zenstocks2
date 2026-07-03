import { getAdditionalUserInfo, getRedirectResult, type User, type UserCredential } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

let cachedRedirectResult: UserCredential | null | undefined;

function resolveRedirectResult(): Promise<UserCredential | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }
  return auth.authStateReady().then(() => getRedirectResult(auth));
}

let redirectResultPromise: Promise<UserCredential | null> | null = null;

function getRedirectResultPromise(): Promise<UserCredential | null> {
  redirectResultPromise ??= resolveRedirectResult();
  return redirectResultPromise;
}

export async function getRedirectResultOnce(): Promise<UserCredential | null> {
  if (cachedRedirectResult === undefined) {
    cachedRedirectResult = await getRedirectResultPromise();
  }
  return cachedRedirectResult;
}

export function getIsNewUserFromRedirect(result: UserCredential): boolean {
  return getAdditionalUserInfo(result)?.isNewUser ?? false;
}

export const AUTH_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Invalid email or password.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/unauthorized-domain": "This domain is not authorized for sign-in. Contact support.",
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

export function resolvePostAuthPath(isNewUser: boolean): string {
  return isNewUser ? "/holdings" : "/folio";
}
