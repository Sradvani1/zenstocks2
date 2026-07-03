"use client";

import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { auth } from "@/lib/firebase/client";

function formatProvider(providerId: string | undefined): string {
  if (providerId === "google.com") return "Google";
  if (providerId === "password") return "Email";
  return providerId ?? "Unknown";
}

export default function UserPage() {
  const { user } = useAuth();

  async function handleSignOut() {
    await signOut(auth);
  }

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
      <div className="mt-8">
        <Button variant="outline" className="min-h-11 w-full" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
      <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">ZenStocks</p>
    </div>
  );
}
