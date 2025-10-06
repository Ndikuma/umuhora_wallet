
// This file is retained for type definitions but mock data is deprecated.
// Data is now fetched from the backend API.

export type Transaction = {
  id: string;
  type: "sent" | "received";
  amount: number;
  fee: number;
  status: "completed" | "pending" | "failed";
  date: string;
  address: string;
};

export const wallet = {
  balance: 0,
  address: "",
};

export const transactions: Transaction[] = [];

export const balanceHistory: { date: string, balance: number }[] = [];
