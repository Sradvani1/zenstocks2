import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as admin from "firebase-admin";

type UniverseEntry = {
  symbol: string;
  name: string;
  rank: number;
};

function getProjectId(): string {
  const rcPath = join(__dirname, "..", ".firebaserc");
  const rc = JSON.parse(readFileSync(rcPath, "utf-8")) as {
    projects?: { default?: string };
  };
  const projectId = rc.projects?.default;
  if (!projectId) {
    throw new Error("No default project in .firebaserc");
  }
  return projectId;
}

const projectId = getProjectId();
admin.initializeApp({ projectId });
const db = admin.firestore();

console.log(`Seeding symbols/universe/entries in project: ${projectId}`);

const universeCol = db
  .collection("symbols")
  .doc("universe")
  .collection("entries");

async function seedUniverse() {
  const filePath = join(__dirname, "..", "data", "universe.json");
  const entries: UniverseEntry[] = JSON.parse(
    readFileSync(filePath, "utf-8"),
  );

  let created = 0;
  let updated = 0;

  for (const entry of entries) {
    const ref = universeCol.doc(entry.symbol);
    const snap = await ref.get();

    const payload: Record<string, unknown> = {
      symbol: entry.symbol,
      name: entry.name,
      rank: entry.rank,
    };

    if (!snap.exists) {
      payload.addedAt = admin.firestore.FieldValue.serverTimestamp();
      created++;
    } else {
      updated++;
    }

    await ref.set(payload, { merge: true });
  }

  console.log(
    `Seeded ${entries.length} universe symbols (${created} created, ${updated} updated).`,
  );
}

seedUniverse().catch((err) => {
  console.error(err);
  process.exit(1);
});
