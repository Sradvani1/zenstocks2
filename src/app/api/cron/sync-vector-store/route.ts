import { getAdminDb } from "@/lib/firebase/admin";
import { getOpenAI, VECTOR_STORE_ID } from "@/lib/openai";

export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!VECTOR_STORE_ID) {
    return Response.json(
      { error: "OPENAI_VECTOR_STORE_ID not configured" },
      { status: 500 },
    );
  }

  try {
    const db = getAdminDb();

    const today = new Date().toISOString().slice(0, 10);
    const newsRunSnap = await db
      .doc(`pipelineRuns/generateDailyArticle_${today}`)
      .get();
    const newsRun = newsRunSnap.data();
    if (!newsRun || newsRun.status !== "success") {
      return Response.json({
        ok: false,
        skipped: true,
        reason: `Upstream generateDailyArticle_${today} not successful`,
      });
    }

    const universeSnap = await db
      .collection("symbols/universe/entries")
      .get();
    const symbols = universeSnap.docs.map((d) => d.id);

    let uploaded = 0;
    let skipped = 0;

    for (const symbol of symbols) {
      const fundamentalsSnap = await db
        .doc(`quotes/${symbol}/fundamentals/latest`)
        .get();

      const fundamentals = fundamentalsSnap.data();
      if (fundamentals?.earningsSummary) {
        const content = [
          `# ${symbol} — Earnings Summary`,
          "",
          fundamentals.earningsSummary,
          "",
          "## Quarterly Earnings",
          ...(fundamentals.quarterlyEarnings ?? []).map(
            (q: { fiscalDateEnding: string; reportedEPS: number; estimatedEPS: number }) =>
              `- ${q.fiscalDateEnding}: Reported EPS ${q.reportedEPS}, Estimated EPS ${q.estimatedEPS}`,
          ),
        ].join("\n");

        await getOpenAI()
          .files.create({
            file: new File([content], `${symbol}-fundamentals.txt`, {
              type: "text/plain",
            }),
            purpose: "assistants",
          })
          .then(async (file) => {
            await getOpenAI().vectorStores.files.create(VECTOR_STORE_ID, {
              file_id: file.id,
            });
            uploaded++;
          })
          .catch(() => {
            skipped++;
          });
      }

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const articlesSnap = await db
        .collection(`articles/${symbol}/entries`)
        .where("date", ">=", cutoffStr)
        .get();

      for (const articleDoc of articlesSnap.docs) {
        const article = articleDoc.data();
        const content = [
          `# ${symbol} — ${article.headline}`,
          `Date: ${article.date}`,
          "",
          article.body,
        ].join("\n");

        await getOpenAI()
          .files.create({
            file: new File([content], `${symbol}-article-${article.date}.txt`, {
              type: "text/plain",
            }),
            purpose: "assistants",
          })
          .then(async (file) => {
            await getOpenAI().vectorStores.files.create(VECTOR_STORE_ID, {
              file_id: file.id,
            });
            uploaded++;
          })
          .catch(() => {
            skipped++;
          });
      }
    }

    return Response.json({
      ok: true,
      symbols: symbols.length,
      uploaded,
      skipped,
    });
  } catch (error) {
    console.error("sync-vector-store error:", error);
    return Response.json({ error: "Sync failed" }, { status: 500 });
  }
}
