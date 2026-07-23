import { apiClient } from "./client";

export type Expense = { id: string; category: string; amount: number; description: string | null; date: string };
export type ExpensesResponse = { expenses: Expense[]; summary: { category: string; total: number }[] };

export const expenseApi = {
  getAll: (hostelId: string) => apiClient.get<ExpensesResponse>(`/api/hostel-admin/expenses?hostelId=${hostelId}`),

  create: (data: { category: string; amount: number; description: string; date: string; hostelId: string }) =>
    apiClient.post<Expense>("/api/hostel-admin/expenses", data),
};
