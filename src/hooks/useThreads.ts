"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { ChatThread } from "@/types/chat";

export type ThreadRow = ChatThread & { id: string };

export function useThreads(uid: string | undefined) {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const subscriptionKey = uid ? `${uid}:${retryKey}` : null;
  const loading = subscriptionKey !== null && loadedFor !== subscriptionKey;

  useEffect(() => {
    if (!uid) return;

    const key = `${uid}:${retryKey}`;
    const q = query(
      collection(db, "users", uid, "chatThreads"),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rows: ThreadRow[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as ChatThread),
        }));
        setThreads(rows);
        setError(null);
        setLoadedFor(key);
      },
      (err) => {
        setError(err.message || "Failed to load threads");
        setLoadedFor(key);
      },
    );

    return () => unsubscribe();
  }, [uid, retryKey]);

  const retry = useCallback(() => setRetryKey((k) => k + 1), []);

  return {
    threads: uid ? threads : [],
    loading: Boolean(uid) && loading,
    error,
    retry,
  };
}
