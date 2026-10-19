import type { Committee, Member } from '@/types';
import { addMonths, monthLabel } from './dates';

export type Phase = 'upcoming' | 'active' | 'finished';

export const monthCount = (c: Committee) => c.members.length;
export const potAmount = (c: Committee) => c.monthlyAmount * c.members.length;

export function monthPeriod(c: Committee, i: number) {
  return addMonths(c.startYear, c.startMonth, i);
}

export function monthName(c: Committee, i: number): string {
  const p = monthPeriod(c, i);
  return monthLabel(p.year, p.month);
}

export function dueDate(c: Committee, i: number): Date {
  const p = monthPeriod(c, i);
  return new Date(p.year, p.month, c.dueDay);
}

// Months since the committee started (negative = not started yet).
export function rawMonthIndex(c: Committee, today: Date = new Date()): number {
  return (today.getFullYear() - c.startYear) * 12 + (today.getMonth() - c.startMonth);
}

export function phase(c: Committee, today: Date = new Date()): Phase {
  const r = rawMonthIndex(c, today);
  if (r < 0) return 'upcoming';
  if (r >= monthCount(c)) return 'finished';
  return 'active';
}

// The month to show by default, kept inside 0..n-1.
export function currentIndex(c: Committee, today: Date = new Date()): number {
  const last = Math.max(monthCount(c) - 1, 0);
  return Math.min(Math.max(rawMonthIndex(c, today), 0), last);
}

export const paidKey = (monthIndex: number, memberId: string) => `${monthIndex}:${memberId}`;

export const isPaid = (c: Committee, monthIndex: number, memberId: string) =>
  Boolean(c.paid[paidKey(monthIndex, memberId)]);

export const paidCount = (c: Committee, monthIndex: number) =>
  c.members.filter((m) => isPaid(c, monthIndex, m.id)).length;

export const collectedAmount = (c: Committee, monthIndex: number) =>
  paidCount(c, monthIndex) * c.monthlyAmount;

export const pendingMembers = (c: Committee, monthIndex: number): Member[] =>
  c.members.filter((m) => !isPaid(c, monthIndex, m.id));

export function recipient(c: Committee, monthIndex: number): Member | undefined {
  const id = c.payoutOrder[monthIndex];
  return c.members.find((m) => m.id === id);
}

// 0..1 share of all expected payments (every member, every month) that are marked paid.
export function overallProgress(c: Committee): number {
  const n = monthCount(c);
  if (n === 0) return 0;
  let paid = 0;
  for (let i = 0; i < n; i++) paid += paidCount(c, i);
  return paid / (n * n);
}

export function phaseLabel(c: Committee, today: Date = new Date()): string {
  const p = phase(c, today);
  if (p === 'upcoming') return `Starts ${monthName(c, 0)}`;
  if (p === 'finished') return 'Finished';
  return `Month ${rawMonthIndex(c, today) + 1} of ${monthCount(c)}`;
}