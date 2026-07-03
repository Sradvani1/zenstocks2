"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { auth } from "@/lib/firebase/client";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const authedUser = user ?? auth.currentUser;

  useEffect(() => {
    if (!loading && !authedUser) {
      router.replace("/");
    }
  }, [authedUser, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!authedUser) {
    return null;
  }

  return <>{children}</>;
}
