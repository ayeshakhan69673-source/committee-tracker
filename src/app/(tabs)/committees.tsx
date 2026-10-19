import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card, Chip, EmptyState, Header, IconTile, Pill, ProgressBar, Text } from '@/components/ui';
import {
  currentIndex,
  monthName,
  overallProgress,
  phase,
  phaseLabel,
  potAmount,
  recipient,
} from '@/lib/committee';
import { formatMoney } from '@/lib/format';
import { accentFor, gradientOf, iconFor } from '@/lib/identity';
import { useStore } from '@/store/useStore';
import { colors, radius } from '@/theme';

type Filter = 'all' | 'running' | 'finished';

export default function CommitteesScreen() {
  const router = useRouter();
  const committees = useStore((s) => s.committees);
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(() => {
    const now = new Date();
    if (filter === 'all') return committees;
    return committees.filter((c) => {
      const p = phase(c, now);
      return filter === 'finished' ? p === 'finished' : p !== 'finished';
    });
  }, [committees, filter]);

  const openNew = () => router.push('/committee/new');

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Header
          title="My committees"
          subtitle={
            committees.length === 0
              ? 'Nothing here yet.'
              : `${committees.length} committee${committees.length === 1 ? '' : 's'} saved on this phone`
          }
        />

        <View style={styles.body}>
          <View style={styles.chips}>
            <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip label="Running" active={filter === 'running'} onPress={() => setFilter('running')} />
            <Chip label="Finished" active={filter === 'finished'} onPress={() => setFilter('finished')} />
          </View>

          {visible.length === 0 ? (
            <Card>
              <EmptyState
                icon="people-outline"
                title={committees.length === 0 ? 'No committees yet' : 'Nothing in this list'}
                text={
                  committees.length === 0
                    ? 'Create a committee to start tracking contributions and payout turns.'
                    : 'Try another filter to see your other committees.'
                }
                actionLabel={committees.length === 0 ? 'Create committee' : undefined}
                onAction={committees.length === 0 ? openNew : undefined}
              />
            </Card>
          ) : (
            <View style={{ gap: 14 }}>
              {visible.map((c) => {
                const p = phase(c);
                const i = currentIndex(c);
                const who = recipient(c, i);
                return (
                  <Card
                    key={c.id}
                    onPress={() => router.push({ pathname: '/committee/[id]', params: { id: c.id } })}>
                    <View style={styles.top}>
                      <IconTile icon={iconFor(c)} gradient={gradientOf(accentFor(c))} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name} numberOfLines={1}>
                          {c.name}
                        </Text>
                        <Text style={styles.sub}>
                          {formatMoney(c.monthlyAmount)} / month · {c.members.length} members
                        </Text>
                      </View>
                      <Pill
                        label={phaseLabel(c)}
                        tone={p === 'active' ? 'success' : p === 'upcoming' ? 'warning' : 'neutral'}
                      />
                    </View>

                    <View style={styles.potRow}>
                      <View>
                        <Text style={styles.potLabel}>Pot each month</Text>
                        <Text style={styles.pot}>{formatMoney(potAmount(c))}</Text>
                      </View>
                      {p !== 'finished' && who ? (
                        <View style={styles.next}>
                          <Ionicons name="gift-outline" size={15} color={colors.primary} />
                          <Text style={styles.nextText} numberOfLines={1}>
                            {monthName(c, i)}: {who.name}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <ProgressBar value={overallProgress(c)} color={accentFor(c).to} />
                    <Text style={[styles.sub, { marginTop: 6 }]}>
                      {Math.round(overallProgress(c) * 100)}% of all payments received
                    </Text>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={openNew}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] }]}>
        <Ionicons name="add" size={22} color={colors.white} />
        <Text style={styles.fabText}>New committee</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 110 },
  body: { paddingHorizontal: 20, marginTop: -26 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  potRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 14,
  },
  potLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  pot: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  next: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lilacTint,
    borderRadius: radius.sm,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  nextText: { color: colors.primary, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabText: { color: colors.white, fontSize: 15, fontWeight: '800' },
});