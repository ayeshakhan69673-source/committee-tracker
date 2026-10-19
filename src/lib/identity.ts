import type { IconName } from '@/components/ui';
import type { Committee } from '@/types';

// Icons a committee can use (all exist in Ionicons).
export const COMMITTEE_ICONS: IconName[] = [
  'people',
  'home',
  'briefcase',
  'school',
  'airplane',
  'heart',
  'gift',
  'diamond',
];

// Colour families that stay inside the purple palette.
export const ACCENTS = [
  { id: 'plum', from: '#4F2266', to: '#7A4FA0' },
  { id: 'orchid', from: '#6A2C7E', to: '#A25BB5' },
  { id: 'indigo', from: '#3F2E7A', to: '#6F5BB8' },
  { id: 'mulberry', from: '#7A2459', to: '#B8528F' },
  { id: 'violet', from: '#5A3FA0', to: '#8C74D6' },
] as const;

export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = ACCENTS[0];

export function accentById(id: string | undefined): Accent {
  return ACCENTS.find((a) => a.id === id) ?? DEFAULT_ACCENT;
}

export function accentFor(c: Committee): Accent {
  return accentById(c.accent);
}

export function iconFor(c: Committee): IconName {
  return COMMITTEE_ICONS.find((i) => i === c.icon) ?? 'people';
}

export function gradientOf(a: Accent): readonly [string, string] {
  return [a.from, a.to];
}