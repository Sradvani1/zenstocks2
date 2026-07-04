import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

const RATE_LIMIT_PER_HOUR = 30;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_THREADS_PER_USER = 20;

export async function verifyToken(req: Request): Promise<string> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ChatError("Missing authorization header", 401);
  }
  const token = header.slice(7);
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

export function validateMessage(content: unknown): string {
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new ChatError("Message content is required", 400);
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    throw new ChatError(`Message exceeds ${MAX_MESSAGE_LENGTH} characters`, 400);
  }
  return content.trim();
}

export async function checkRateLimit(uid: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.doc(`users/${uid}/chatRateLimit/counter`);
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();

    if (!data || data.windowStart < windowStart) {
      tx.set(ref, { count: 1, windowStart: now });
      return true;
    }

    if (data.count >= RATE_LIMIT_PER_HOUR) {
      return false;
    }

    tx.update(ref, { count: FieldValue.increment(1) });
    return true;
  });

  if (!result) {
    throw new ChatError("Rate limit exceeded (30 messages/hour)", 429);
  }
}

export async function checkThreadLimit(uid: string): Promise<void> {
  const col = getAdminDb().collection(`users/${uid}/chatThreads`);
  const snap = await col.count().get();
  if (snap.data().count >= MAX_THREADS_PER_USER) {
    throw new ChatError(`Maximum ${MAX_THREADS_PER_USER} threads allowed`, 400);
  }
}

export function threadTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim();
  if (trimmed.length <= 50) return trimmed;
  return trimmed.slice(0, 47) + "...";
}

export class ChatError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ChatError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (
    error instanceof Error &&
    ("codePrefix" in error || error.message.includes("Firebase ID token"))
  ) {
    return Response.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  console.error("Unexpected chat error:", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

export const SYSTEM_INSTRUCTIONS = `You are ZenStocks AI, a portfolio-aware financial analyst assistant. You help users understand their holdings, market trends, and financial news.

Guidelines:
- Use the file_search tool to look up earnings data, fundamentals, and curated articles before answering questions about specific stocks.
- Provide informational analysis only. Never give actionable trading advice, buy/sell recommendations, or price targets.
- Always clarify that your analysis is not financial advice.
- If asked about topics outside finance and investing, politely decline and redirect to financial topics.
- When discussing prices or data, note that all market data is based on end-of-day closes and may not reflect current intraday prices.
- Be concise and clear. Use bullet points for comparisons.`;
