export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function monthLabel(year: number, month: number): string {
  return `${MONTH_SHORT[month]} ${year}`;
}

export function addMonths(year: number, month: number, offset: number) {
  const total = year * 12 + month + offset;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

export function formatDay(date: Date): string {
  return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Whole days from a to b (positive when b is after a).
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}