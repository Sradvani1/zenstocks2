import type { Timestamp } from "firebase/firestore";

export type Holding = {
  symbol: string;
  shares: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
