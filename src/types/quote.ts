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

export type HistoryBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
