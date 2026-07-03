"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { bootstrapUserDoc, getRedirectResultOnce } from "@/lib/auth";

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

    void (async () => {
      await getRedirectResultOnce();
      unsub = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          void bootstrapUserDoc(firebaseUser).catch((err) => {
            if (process.env.NODE_ENV === "development") {
              console.error("bootstrapUserDoc failed:", err);
            }
          });
        }
      });
      await auth.authStateReady();
      setLoading(false);
    })();

    return () => unsub();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
