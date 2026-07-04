import type { Timestamp } from "firebase/firestore";

export type ChatThread = {
  title: string;
  openaiConversationId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: Timestamp;
  responseId: string | null;
};
