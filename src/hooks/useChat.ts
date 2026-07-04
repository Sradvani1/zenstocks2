"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { ChatMessage } from "@/types/chat";

export type MessageRow = ChatMessage & { id: string };

type LocalMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

export function useChat(uid: string | undefined, threadId: string | null) {
  const [firestoreMessages, setFirestoreMessages] = useState<MessageRow[]>([]);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const subscriptionKey = uid && threadId ? `${uid}:${threadId}` : null;
  const loading = subscriptionKey !== null && loadedFor !== subscriptionKey;

  useEffect(() => {
    if (!uid || !threadId) return;

    const key = `${uid}:${threadId}`;
    const q = query(
      collection(db, "users", uid, "chatThreads", threadId, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rows: MessageRow[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as ChatMessage),
        }));
        setFirestoreMessages(rows);
        setLoadedFor(key);
        setLocalMessages([]);
      },
      (err) => {
        setError(err.message || "Failed to load messages");
        setLoadedFor(key);
      },
    );

    return () => unsubscribe();
  }, [uid, threadId]);

  const activeFirestore = loadedFor === subscriptionKey ? firestoreMessages : [];

  const messages: LocalMessage[] =
    localMessages.length > 0
      ? [
          ...activeFirestore.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          })),
          ...localMessages,
        ]
      : activeFirestore.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }));

  const send = useCallback(
    async (content: string, getToken: () => Promise<string>) => {
      if (!threadId || sending) return;

      setSending(true);
      setError(null);

      const userMsg: LocalMessage = {
        id: `local-user-${Date.now()}`,
        role: "user",
        content,
      };
      const assistantMsg: LocalMessage = {
        id: `local-assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        streaming: true,
      };

      setLocalMessages([userMsg, assistantMsg]);

      try {
        const token = await getToken();
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ threadId, content }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6);
            try {
              const event = JSON.parse(json);
              if (event.type === "delta") {
                setLocalMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (!last || last.role !== "assistant") return prev;
                  return [
                    ...prev.slice(0, -1),
                    { ...last, content: last.content + event.content },
                  ];
                });
              } else if (event.type === "error") {
                throw new Error(event.error);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setLocalMessages([]);
        } else {
          setError(err instanceof Error ? err.message : "Failed to send message");
        }
      } finally {
        setSending(false);
        abortRef.current = null;
      }
    },
    [threadId, sending],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages: subscriptionKey ? messages : [],
    loading: Boolean(subscriptionKey) && loading,
    sending,
    error,
    send,
    abort,
  };
}
