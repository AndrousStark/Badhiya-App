/**
 * Mock data for Phase 2 — used until real backend-bound screens ship.
 *
 * Every value here mirrors the shape we expect from the backend so
 * swapping to real data in Phase 4+ is a one-line change per screen.
 *
 * DELETE this file once all screens hit real data.
 */

export interface MockTransaction {
  id: string;
  name: string;
  meta: string;
  amount: number;
  type: 'sale' | 'expense' | 'payment';
}

export interface MockCustomer {
  id: string;
  name: string;
  initial: string;
  phone?: string;
  outstanding: number;
  daysAging: number;
  status: 'urgent' | 'aging' | 'ok';
  lastPaymentText: string;
}

export interface MockProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  threshold: number;
  emoji: string;
}

export interface MockKpis {
  todaySales: number;
  todaySalesDelta: number;
  profit: number;
  profitDelta: number;
  outstandingAmount: number;
  outstandingCustomers: number;
  lowStockCount: number;
}

// ─── HOME / DASHBOARD ─────────────────────────────────────
export const mockKpis: MockKpis = {
  todaySales: 11800,
  todaySalesDelta: 12,
  profit: 2600,
  profitDelta: 8,
  outstandingAmount: 152400,
  outstandingCustomers: 12,
  lowStockCount: 3,
};

export const mockTransactions: MockTransaction[] = [
  { id: '1', name: 'Amul Butter × 12', meta: '9:14 AM · WhatsApp', amount: 720, type: 'sale' },
  { id: '2', name: 'Ravi Sharma — paid', meta: '8:52 AM · Khata', amount: 500, type: 'payment' },
  { id: '3', name: 'Bijli bill', meta: '7:30 AM · Expense', amount: 4200, type: 'expense' },
  { id: '4', name: 'Aashirvaad Atta × 4', meta: '7:10 AM · Counter', amount: 1120, type: 'sale' },
  { id: '5', name: 'Maggi 4-pack × 18', meta: '6:48 AM · Counter', amount: 864, type: 'sale' },
];

// ─── KHATA ───────────────────────────────────────────────
export const mockCustomers: MockCustomer[] = [
  { id: 'c1', name: 'Anil Trading Co.', initial: 'A', outstanding: 48000, daysAging: 72, status: 'urgent', lastPaymentText: 'Overdue · 72 din' },
  { id: 'c2', name: 'Ravi Sharma', initial: 'R', outstanding: 2800, daysAging: 18, status: 'aging', lastPaymentText: 'Last paid · 18 din' },
  { id: 'c3', name: 'Meena Devi', initial: 'M', outstanding: 1200, daysAging: 3, status: 'ok', lastPaymentText: 'Last paid · 3 din' },
  { id: 'c4', name: 'Suresh Bhai', initial: 'S', outstanding: 4500, daysAging: 1, status: 'ok', lastPaymentText: 'Last paid · 1 din' },
  { id: 'c5', name: 'Priya Enterprises', initial: 'P', outstanding: 8700, daysAging: 25, status: 'aging', lastPaymentText: 'Last paid · 25 din' },
];

// ─── DUKAN / INVENTORY ───────────────────────────────────
export const mockProducts: MockProduct[] = [
  { id: 'p1', name: 'Amul Butter 500g', price: 280, stock: 12, threshold: 5, emoji: '🧈' },
  { id: 'p2', name: 'Aashirvaad Atta 5kg', price: 280, stock: 2, threshold: 5, emoji: '🌾' },
  { id: 'p3', name: 'Maggi 4-pack', price: 48, stock: 38, threshold: 10, emoji: '🍜' },
  { id: 'p4', name: 'Amul Milk 1L', price: 62, stock: 22, threshold: 10, emoji: '🥛' },
  { id: 'p5', name: 'Toor Dal 1kg', price: 148, stock: 5, threshold: 8, emoji: '🫘' },
  { id: 'p6', name: 'Kolam Rice 5kg', price: 295, stock: 15, threshold: 5, emoji: '🍚' },
];
