"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useChat } from "@/hooks/useChat";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, MessageCircle } from "lucide-react";
import { auth } from "@/lib/firebase/client";

type ChatViewProps = {
  threadId: string | null;
};

export function ChatView({ threadId }: ChatViewProps) {
  const { user } = useAuth();
  const { messages, loading, sending, error, send, abort } = useChat(
    user?.uid,
    threadId,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  if (!threadId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <MessageCircle className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Select a chat or start a new one
        </p>
      </div>
    );
  }

  const handleSend = (content: string) => {
    send(content, () => auth.currentUser!.getIdToken());
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="ml-auto h-10 w-48" />
            <Skeleton className="mr-auto h-16 w-56" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">
              Ask me anything about your portfolio, market trends, or financial news.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              streaming={"streaming" in msg ? (msg as { streaming?: boolean }).streaming : undefined}
            />
          ))
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="px-1 pb-1 text-center text-[10px] text-muted-foreground">
        Not financial advice. Informational analysis only.
      </div>

      <ChatInput
        onSend={handleSend}
        onStop={abort}
        disabled={!user || loading}
        sending={sending}
      />
    </div>
  );
}
