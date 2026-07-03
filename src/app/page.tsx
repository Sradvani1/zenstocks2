"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/AuthProvider";
import { auth } from "@/lib/firebase/client";
import { AUTH_ERRORS } from "@/lib/auth";

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

  useEffect(() => {
    if (!loading && user) {
      router.replace("/folio");
    }
  }, [loading, user, router]);

  async function handleEmailSubmit(e: React.FormEvent, submitMode: AuthMode) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (submitMode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(AUTH_ERRORS[code] ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code !== "auth/popup-closed-by-user") {
        setError(AUTH_ERRORS[code] ?? "Google sign-in failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || user) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">ZenStocks</h1>
        <p className="text-lg text-muted-foreground">
          Track your portfolio, read daily AI-curated news, and chat with a portfolio-aware analyst.
        </p>
      </div>

      <Tabs
        value={mode}
        onValueChange={(value) => {
          setMode(value as AuthMode);
          setError(null);
        }}
        className="mt-10 w-full"
      >
        <TabsList className="!h-11 grid w-full grid-cols-2">
          <TabsTrigger value="signin" className="h-10 px-4">
            Sign In
          </TabsTrigger>
          <TabsTrigger value="signup" className="h-10 px-4">
            Sign Up
          </TabsTrigger>
        </TabsList>

        {(
          [
            { id: "signin" as const, heading: "Welcome back", submitLabel: "Sign in" },
            { id: "signup" as const, heading: "Create your account", submitLabel: "Create account" },
          ] as const
        ).map(({ id, heading, submitLabel }) => (
          <TabsContent key={id} value={id} className="mt-6 flex flex-col gap-6">
            <p className="text-sm text-muted-foreground">{heading}</p>
            <form onSubmit={(e) => handleEmailSubmit(e, id)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-email`}>Email</Label>
                <Input
                  id={`${id}-email`}
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-password`}>Password</Label>
                <Input
                  id={`${id}-password`}
                  type="password"
                  autoComplete={id === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-11"
                />
              </div>

              {error && mode === id && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="min-h-11 w-full" disabled={submitting}>
                {submitting ? "Please wait…" : submitLabel}
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
              disabled={submitting}
            >
              Continue with Google
            </Button>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
