"use client";

import { useCallback, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ThreadRow } from "@/hooks/useThreads";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase/client";

type ThreadDrawerProps = {
  open: boolean;
  onClose: () => void;
  threads: ThreadRow[];
  loading: boolean;
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  creating?: boolean;
};

export function ThreadDrawer({
  open,
  onClose,
  threads,
  loading,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  creating,
}: ThreadDrawerProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, threadId: string) => {
      e.stopPropagation();
      if (deleting) return;
      setDeleting(threadId);
      try {
        const token = await auth.currentUser!.getIdToken();
        const res = await fetch(`/api/chat/threads/${threadId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          onDeleteThread(threadId);
        }
      } finally {
        setDeleting(null);
      }
    },
    [deleting, onDeleteThread],
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-background transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Chats</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="size-8">
            <X className="size-4" />
          </Button>
        </div>

        <div className="px-3 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewThread}
            disabled={creating}
            className="w-full gap-1.5"
          >
            <Plus className="size-3.5" />
            New chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="space-y-2 px-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <p className="px-2 pt-4 text-center text-xs text-muted-foreground">
              No chats yet
            </p>
          ) : (
            <div className="space-y-0.5">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={cn(
                    "group flex w-full items-center rounded-lg text-sm transition-colors",
                    thread.id === activeThreadId
                      ? "bg-muted font-medium"
                      : "hover:bg-muted/50",
                  )}
                >
                  <button
                    onClick={() => {
                      onSelectThread(thread.id);
                      onClose();
                    }}
                    className="min-h-11 flex-1 truncate px-3 py-2.5 text-left"
                  >
                    {thread.title}
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, thread.id)}
                    disabled={deleting === thread.id}
                    className="mr-1 shrink-0 rounded p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    aria-label={`Delete ${thread.title}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
