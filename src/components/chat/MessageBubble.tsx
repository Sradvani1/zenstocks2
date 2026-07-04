import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

export function MessageBubble({ role, content, streaming }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted text-foreground",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{content}</ReactMarkdown>
            {streaming && content.length === 0 && (
              <span className="inline-block animate-pulse text-muted-foreground">
                ···
              </span>
            )}
          </div>
        )}
        {streaming && content.length > 0 && (
          <span className="mt-1 inline-block h-3 w-1 animate-pulse bg-current opacity-70" />
        )}
      </div>
    </div>
  );
}
