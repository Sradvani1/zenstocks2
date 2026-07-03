"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getRedirectResult, onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { bootstrapUserDoc } from "@/lib/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;

    void (async () => {
      await auth.authStateReady();
      if (cancelled) return;

      try {
        await getRedirectResult(auth);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("getRedirectResult failed:", err);
        }
      }

      if (cancelled) return;

      unsub = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          void bootstrapUserDoc(firebaseUser).catch((bootstrapErr) => {
            if (process.env.NODE_ENV === "development") {
              console.error("bootstrapUserDoc failed:", bootstrapErr);
            }
          });
        }
      });

      setUser(auth.currentUser);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
