"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { auth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

function formatProvider(providerId: string | undefined): string {
  if (providerId === "google.com") return "Google";
  if (providerId === "password") return "Email";
  return providerId ?? "Unknown";
}

export default function UserPage() {
  const { user } = useAuth();
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState<string | null>(null);

  async function handleSignOut() {
    await signOut(auth);
  }

  const handleClearChats = useCallback(async () => {
    if (clearing || !user) return;
    if (!confirm("Delete all chat threads? This cannot be undone.")) return;

    setClearing(true);
    setClearResult(null);
    try {
      const token = await auth.currentUser!.getIdToken();
      const res = await fetch("/api/chat/threads", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to clear chats");
      }
      const { deleted } = await res.json();
      setClearResult(`Cleared ${deleted} chat${deleted !== 1 ? "s" : ""}`);
    } catch {
      setClearResult("Failed to clear chats");
    } finally {
      setClearing(false);
    }
  }, [clearing, user]);

  const providerId = user?.providerData[0]?.providerId;

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">User</h1>
      <dl className="mt-6 space-y-4">
        <div>
          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd className="mt-1 font-medium">{user?.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Provider</dt>
          <dd className="mt-1 font-medium">{formatProvider(providerId)}</dd>
        </div>
      </dl>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/holdings"
          className={cn(buttonVariants({ variant: "outline" }), "min-h-11 w-full")}
        >
          Update holdings
        </Link>
        <Button
          variant="outline"
          className="min-h-11 w-full"
          onClick={handleClearChats}
          disabled={clearing}
        >
          {clearing ? "Clearing..." : "Clear all chats"}
        </Button>
        {clearResult && (
          <p className="text-center text-xs text-muted-foreground">{clearResult}</p>
        )}
        <Button variant="outline" className="min-h-11 w-full" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
      <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">ZenStocks</p>
    </div>
  );
}
