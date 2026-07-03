import type { Timestamp } from "firebase/firestore";

export type UniverseSymbol = {
  symbol: string;
  name: string;
  rank: number;
  addedAt?: Timestamp;
};
