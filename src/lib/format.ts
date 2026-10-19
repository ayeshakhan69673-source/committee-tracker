export function formatMoney(amount: number): string {
  const rounded = Math.round(amount);
  return 'Rs ' + String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}