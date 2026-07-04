import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getOpenAI, CHAT_MODEL, VECTOR_STORE_ID } from "@/lib/openai";
import {
  ChatError,
  SYSTEM_INSTRUCTIONS,
  checkRateLimit,
  errorResponse,
  threadTitle,
  validateMessage,
  verifyToken,
} from "@/lib/chat";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const uid = await verifyToken(req);
    await checkRateLimit(uid);

    const body = await req.json();
    const content = validateMessage(body.content);
    const threadId = body.threadId;

    if (typeof threadId !== "string" || !threadId) {
      throw new ChatError("threadId is required", 400);
    }

    const db = getAdminDb();
    const threadRef = db.doc(`users/${uid}/chatThreads/${threadId}`);
    const threadSnap = await threadRef.get();

    if (!threadSnap.exists) {
      throw new ChatError("Thread not found", 404);
    }

    const threadData = threadSnap.data()!;
    const conversationId = threadData.openaiConversationId as string | null;

    if (!conversationId) {
      throw new ChatError("Thread missing conversation ID", 500);
    }

    const holdingsSnap = await db
      .collection(`users/${uid}/holdings`)
      .get();
    const holdings = holdingsSnap.docs.map((d) => d.data());

    let portfolioContext = "";
    if (holdings.length > 0) {
      const symbols = holdings.map((h) => h.symbol as string);
      const quoteDocs = await Promise.all(
        symbols.map((s) => db.doc(`quotes/${s}`).get()),
      );

      const lines = holdings.map((h, i) => {
        const q = quoteDocs[i].data();
        if (q) {
          return `${h.symbol}: ${h.shares} shares, close $${q.lastPrice} (${q.changePercent > 0 ? "+" : ""}${q.changePercent?.toFixed(2)}%), as of ${q.asOfDate}`;
        }
        return `${h.symbol}: ${h.shares} shares (quote pending)`;
      });

      portfolioContext = `\n\nUser's current portfolio:\n${lines.join("\n")}`;
    }

    const instructions = SYSTEM_INSTRUCTIONS + portfolioContext;

    const client = getOpenAI();
    const tools: Parameters<typeof client.responses.create>[0]["tools"] =
      VECTOR_STORE_ID
        ? [
            {
              type: "file_search" as const,
              vector_store_ids: [VECTOR_STORE_ID],
            },
          ]
        : [];

    const stream = await client.responses.create({
      model: CHAT_MODEL,
      instructions,
      input: [{ role: "user" as const, content }],
      conversation: conversationId,
      store: true,
      tools,
      stream: true,
    });

    const encoder = new TextEncoder();
    let fullText = "";
    let responseId: string | null = null;
    const isFirstMessage =
      threadData.title === "New chat" ||
      !(await threadRef.collection("messages").limit(1).get()).size;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "response.output_text.delta" &&
              "delta" in event
            ) {
              fullText += event.delta;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "delta", content: event.delta })}\n\n`,
                ),
              );
            }

            if (event.type === "response.completed" && "response" in event) {
              responseId = event.response.id;
            }
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", responseId })}\n\n`,
            ),
          );
          controller.close();
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Stream error";
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", error: msg })}\n\n`,
              ),
            );
            controller.close();
          } catch {
            /* controller already closed */
          }
          return;
        }

        try {
          const messagesCol = threadRef.collection("messages");
          const writeBatch = db.batch();

          writeBatch.create(messagesCol.doc(), {
            role: "user",
            content,
            createdAt: FieldValue.serverTimestamp(),
            responseId: null,
          });

          writeBatch.create(messagesCol.doc(), {
            role: "assistant",
            content: fullText,
            createdAt: FieldValue.serverTimestamp(),
            responseId,
          });

          const threadUpdate: Record<string, unknown> = {
            updatedAt: FieldValue.serverTimestamp(),
          };
          if (isFirstMessage) {
            threadUpdate.title = threadTitle(content);
          }
          writeBatch.update(threadRef, threadUpdate);

          await writeBatch.commit();
        } catch (err) {
          console.error("Failed to persist chat messages:", err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
