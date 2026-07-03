import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

admin.initializeApp();

export const onHoldingWrite = onDocumentWritten(
  "users/{uid}/holdings/{symbol}",
  async (event) => {
    const before = event.data?.before;
    const after = event.data?.after;
    const symbol = event.params.symbol;

    if (!symbol) return;

    const db = admin.firestore();
    const activeRef = db.doc(`symbols/active/${symbol}`);

    const wasCreated = !before?.exists && after?.exists;
    const wasDeleted = before?.exists && !after?.exists;

    if (!wasCreated && !wasDeleted) return;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(activeRef);

      if (wasCreated) {
        if (snap.exists) {
          tx.update(activeRef, {
            holderCount: FieldValue.increment(1),
            lastRequestedAt: FieldValue.serverTimestamp(),
          });
        } else {
          tx.set(activeRef, {
            symbol,
            holderCount: 1,
            lastRequestedAt: FieldValue.serverTimestamp(),
          });
        }
        return;
      }

      if (!snap.exists) return;

      const currentCount = snap.data()?.holderCount ?? 0;
      const nextCount = currentCount - 1;

      if (nextCount <= 0) {
        tx.delete(activeRef);
      } else {
        tx.update(activeRef, { holderCount: nextCount });
      }
    });
  },
);
