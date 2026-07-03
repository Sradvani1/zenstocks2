"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithRedirect,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { auth } from "@/lib/firebase/client";
import { AUTH_ERRORS, getRedirectResultOnce, resolvePostAuthPath } from "@/lib/auth";
import { cn } from "@/lib/utils";

const googleProvider = new GoogleAuthProvider();

type AuthMode = "signin" | "signup";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    if (loading || initialCheckDone) return;

    getRedirectResultOnce()
      .then((result) => {
        if (result) {
          const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
          router.replace(resolvePostAuthPath(isNewUser));
        }
        setInitialCheckDone(true);
      })
      .catch((err: { code?: string }) => {
        setError(AUTH_ERRORS[err.code ?? ""] ?? "Sign-in failed. Please try again.");
        setInitialCheckDone(true);
      });
  }, [loading, initialCheckDone, router]);

  useEffect(() => {
    if (!initialCheckDone || loading || !user) return;
    router.replace(resolvePostAuthPath(false));
  }, [initialCheckDone, loading, user, router]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        router.replace(resolvePostAuthPath(true));
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.replace(resolvePostAuthPath(false));
      }
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(AUTH_ERRORS[code] ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleSignIn() {
    setError(null);
    void signInWithRedirect(auth, googleProvider);
  }

  if (loading || (user && !initialCheckDone)) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">ZenStocks</h1>
        <p className="text-lg text-muted-foreground">
          Track your portfolio, read daily AI-curated news, and chat with a portfolio-aware analyst.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-6">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <Button
            type="button"
            variant="ghost"
            className={cn("min-h-11 flex-1", mode === "signin" && "bg-background shadow-sm")}
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn("min-h-11 flex-1", mode === "signup" && "bg-background shadow-sm")}
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
          >
            Sign Up
          </Button>
        </div>

        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="min-h-11 w-full" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-11 w-full"
          onClick={handleGoogleSignIn}
        >
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
