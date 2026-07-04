import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getOpenAI } from "@/lib/openai";
import {
  checkThreadLimit,
  errorResponse,
  verifyToken,
} from "@/lib/chat";

export const maxDuration = 15;

export async function POST(req: Request) {
  try {
    const uid = await verifyToken(req);
    await checkThreadLimit(uid);

    const conversation = await getOpenAI().conversations.create();

    const db = getAdminDb();
    const ref = db.collection(`users/${uid}/chatThreads`).doc();
    await ref.set({
      title: "New chat",
      openaiConversationId: conversation.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return Response.json({ threadId: ref.id, conversationId: conversation.id });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const uid = await verifyToken(req);

    const db = getAdminDb();
    const threads = await db
      .collection(`users/${uid}/chatThreads`)
      .get();

    if (threads.empty) {
      return Response.json({ deleted: 0 });
    }

    const conversationIds: string[] = [];
    const BATCH_LIMIT = 450;
    let batch = db.batch();
    let opCount = 0;

    for (const threadDoc of threads.docs) {
      const data = threadDoc.data();
      if (data.openaiConversationId) {
        conversationIds.push(data.openaiConversationId);
      }

      const messages = await threadDoc.ref.collection("messages").get();
      for (const msg of messages.docs) {
        batch.delete(msg.ref);
        opCount++;
        if (opCount >= BATCH_LIMIT) {
          await batch.commit();
          batch = db.batch();
          opCount = 0;
        }
      }
      batch.delete(threadDoc.ref);
      opCount++;
    }

    if (opCount > 0) {
      await batch.commit();
    }

    const oai = getOpenAI();
    await Promise.allSettled(
      conversationIds.map((id) =>
        oai.conversations.delete(id).catch((err) => {
          console.warn(`Failed to delete OpenAI conversation ${id}:`, err);
        }),
      ),
    );

    return Response.json({ deleted: threads.size });
  } catch (error) {
    return errorResponse(error);
  }
}
