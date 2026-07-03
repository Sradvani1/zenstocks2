import type { Timestamp } from "firebase/firestore";

export type Quote = {
  symbol: string;
  name: string;
  currency: string;
  lastPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  asOfDate: string;
  updatedAt?: Timestamp;
};
