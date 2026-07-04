"use client";

import { useCallback, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useThreads } from "@/hooks/useThreads";
import { ChatView } from "@/components/chat/ChatView";
import { ThreadDrawer } from "@/components/chat/ThreadDrawer";
import { auth } from "@/lib/firebase/client";

export default function ChatPage() {
  const { user } = useAuth();
  const { threads, loading } = useThreads(user?.uid);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleNewThread = useCallback(async () => {
    if (creating || !user) return;
    setCreating(true);
    setCreateError(null);
    try {
      const token = await auth.currentUser!.getIdToken();
      const res = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error);
      }
      const { threadId } = await res.json();
      setActiveThreadId(threadId);
      setDrawerOpen(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create chat");
    } finally {
      setCreating(false);
    }
  }, [creating, user]);

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      if (activeThreadId === threadId) {
        const remaining = threads.filter((t) => t.id !== threadId);
        setActiveThreadId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [activeThreadId, threads],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDrawerOpen(true)}
          className="size-9"
          aria-label="Open chat list"
        >
          <Menu className="size-5" />
        </Button>
        <h1 className="flex-1 truncate text-base font-semibold">
          {threads.find((t) => t.id === activeThreadId)?.title ?? "Chat"}
        </h1>
      </header>

      {createError && (
        <div className="bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
          {createError}
        </div>
      )}

      <ChatView threadId={activeThreadId} />

      <ThreadDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        threads={threads}
        loading={loading}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        creating={creating}
      />
    </div>
  );
}
