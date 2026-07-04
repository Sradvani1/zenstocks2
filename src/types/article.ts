export type Article = {
  symbol: string;
  date: string;
  headline: string;
  summary: string;
  body: string;
  generatedAt: unknown; // Firestore Timestamp
  model: string;
};
