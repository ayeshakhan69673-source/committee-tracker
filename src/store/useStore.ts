import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { newId } from '@/lib/format';
import { paidKey } from '@/lib/committee';
import type { Committee, Member } from '@/types';

export type NewCommittee = {
  name: string;
  monthlyAmount: number;
  startYear: number;
  startMonth: number;
  dueDay: number;
  icon: string;
  accent: string;
  // Members in payout order: the first person receives the pot in the first month.
  members: Omit<Member, 'id'>[];
};

type State = {
  committees: Committee[];
  addCommittee: (input: NewCommittee) => string;
  deleteCommittee: (id: string) => void;
  togglePayment: (committeeId: string, monthIndex: number, memberId: string) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  resetAll: () => void;
};

function looksLikeCommittee(value: unknown): value is Committee {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.monthlyAmount === 'number' &&
    typeof c.startYear === 'number' &&
    typeof c.startMonth === 'number' &&
    typeof c.dueDay === 'number' &&
    Array.isArray(c.members) &&
    Array.isArray(c.payoutOrder) &&
    typeof c.paid === 'object' &&
    c.paid !== null
  );
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      committees: [],

      addCommittee: (input) => {
        const members: Member[] = input.members.map((m) => ({ ...m, id: newId() }));
        const committee: Committee = {
          id: newId(),
          name: input.name.trim(),
          monthlyAmount: input.monthlyAmount,
          startYear: input.startYear,
          startMonth: input.startMonth,
          dueDay: input.dueDay,
          icon: input.icon,
          accent: input.accent,
          members,
          payoutOrder: members.map((m) => m.id),
          paid: {},
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ committees: [committee, ...s.committees] }));
        return committee.id;
      },

      deleteCommittee: (id) =>
        set((s) => ({ committees: s.committees.filter((c) => c.id !== id) })),

      togglePayment: (committeeId, monthIndex, memberId) =>
        set((s) => ({
          committees: s.committees.map((c) => {
            if (c.id !== committeeId) return c;
            const key = paidKey(monthIndex, memberId);
            const paid = { ...c.paid };
            if (paid[key]) delete paid[key];
            else paid[key] = new Date().toISOString();
            return { ...c, paid };
          }),
        })),

      exportData: () =>
        JSON.stringify(
          {
            app: 'committee-tracker',
            version: 1,
            exportedAt: new Date().toISOString(),
            committees: get().committees,
          },
          null,
          2
        ),

      importData: (json) => {
        try {
          const parsed: unknown = JSON.parse(json);
          if (typeof parsed !== 'object' || parsed === null) return false;
          const list = (parsed as { committees?: unknown }).committees;
          if (!Array.isArray(list) || !list.every(looksLikeCommittee)) return false;
          set({ committees: list });
          return true;
        } catch {
          return false;
        }
      },

      resetAll: () => set({ committees: [] }),
    }),
    {
      name: 'committee-tracker-data',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ committees: state.committees }),
    }
  )
);

// True once saved data has been loaded from the phone's storage.
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const unsubscribe = useStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useStore.persist.hasHydrated());
    return unsubscribe;
  }, []);
  return hydrated;
}