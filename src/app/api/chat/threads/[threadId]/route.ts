import { getAdminDb } from "@/lib/firebase/admin";
import { getOpenAI } from "@/lib/openai";
import { ChatError, errorResponse, verifyToken } from "@/lib/chat";

export const maxDuration = 15;

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const uid = await verifyToken(req);
    const { threadId } = await params;

    const db = getAdminDb();
    const ref = db.doc(`users/${uid}/chatThreads/${threadId}`);
    const snap = await ref.get();

    if (!snap.exists) {
      throw new ChatError("Thread not found", 404);
    }

    const data = snap.data()!;

    const messages = await ref.collection("messages").get();
    const batch = db.batch();
    for (const msg of messages.docs) {
      batch.delete(msg.ref);
    }
    batch.delete(ref);
    await batch.commit();

    if (data.openaiConversationId) {
      await getOpenAI().conversations
        .delete(data.openaiConversationId)
        .catch((err) => {
          console.warn("Failed to delete OpenAI conversation:", err);
        });
    }

    return Response.json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
