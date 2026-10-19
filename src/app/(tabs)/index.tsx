import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Header,
  IconButton,
  IconTile,
  Pill,
  ProgressBar,
  SectionTitle,
  Text,
  type IconName,
} from '@/components/ui';
import {
  collectedAmount,
  currentIndex,
  dueDate,
  monthName,
  paidCount,
  pendingMembers,
  phase,
  potAmount,
  recipient,
} from '@/lib/committee';
import { daysBetween, formatDay } from '@/lib/dates';
import { accentFor, gradientOf, iconFor } from '@/lib/identity';
import { formatMoney } from '@/lib/format';
import { sendReminder } from '@/lib/whatsapp';
import { useStore } from '@/store/useStore';
import { colors } from '@/theme';
import type { Committee, Member } from '@/types';

type Nudge = { committee: Committee; monthIndex: number; member: Member; daysLate: number };

function dueInfo(daysLate: number): { text: string; tone: 'danger' | 'warning' | 'neutral' } {
  if (daysLate > 0) return { text: `Overdue by ${daysLate} day${daysLate === 1 ? '' : 's'}`, tone: 'danger' };
  if (daysLate === 0) return { text: 'Due today', tone: 'warning' };
  const left = -daysLate;
  return { text: `Due in ${left} day${left === 1 ? '' : 's'}`, tone: 'neutral' };
}

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const committees = useStore((s) => s.committees);

  const { active, nudges, collected } = useMemo(() => {
    const now = new Date();
    const activeList = committees.filter((c) => phase(c, now) === 'active');
    const list: Nudge[] = [];
    let total = 0;
    for (const c of activeList) {
      const i = currentIndex(c, now);
      total += collectedAmount(c, i);
      for (const m of pendingMembers(c, i)) {
        list.push({ committee: c, monthIndex: i, member: m, daysLate: daysBetween(dueDate(c, i), now) });
      }
    }
    list.sort((a, b) => b.daysLate - a.daysLate);
    return { active: activeList, nudges: list, collected: total };
  }, [committees]);

  const openNew = () => router.push('/committee/new');
  const openCommittee = (id: string) => router.push({ pathname: '/committee/[id]', params: { id } });

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Header
          title="Committee Tracker"
          subtitle="Assalam o Alaikum! See who has paid and who needs a reminder."
          right={<IconButton icon="add" label="New committee" onPress={openNew} />}
        />

        <View style={styles.body}>
          <View style={styles.statsRow}>
            <Stat icon="people" value={String(active.length)} label="Running" />
            <Stat icon="cash" value={formatMoney(collected)} label="Collected" />
            <Stat icon="hourglass" value={String(nudges.length)} label="Pending" />
          </View>

          {committees.length === 0 ? (
            <Card style={{ marginTop: 20 }}>
              <EmptyState
                icon="people-circle-outline"
                title="Start your first committee"
                text="Add the members, set the monthly amount, and the app keeps track of every payment and payout turn."
                actionLabel="Create committee"
                onAction={openNew}
              />
            </Card>
          ) : (
            <>
              <SectionTitle title="Needs a reminder" />
              {nudges.length === 0 ? (
                <Card style={styles.allPaid}>
                  <View style={styles.allPaidIcon}>
                    <Ionicons name="checkmark-circle" size={30} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>Everyone has paid</Text>
                    <Text style={styles.rowSub}>
                      {active.length === 0
                        ? 'No committee is running this month.'
                        : 'All payments for this month are marked as received.'}
                    </Text>
                  </View>
                </Card>
              ) : (
                <View style={{ gap: 10 }}>
                  {nudges.slice(0, 6).map((n) => {
                    const info = dueInfo(n.daysLate);
                    return (
                      <Card
                        key={`${n.committee.id}-${n.member.id}`}
                        onPress={() => openCommittee(n.committee.id)}
                        style={styles.row}>
                        <Avatar name={n.member.name} />
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {n.member.name}
                          </Text>
                          <Text style={styles.rowSub} numberOfLines={1}>
                            {n.committee.name} · {formatMoney(n.committee.monthlyAmount)}
                          </Text>
                          <Pill label={info.text} tone={info.tone} />
                        </View>
                        <Button
                          title="Remind"
                          icon="logo-whatsapp"
                          variant="whatsapp"
                          small
                          onPress={() => sendReminder(n.committee, n.monthIndex, n.member)}
                        />
                      </Card>
                    );
                  })}
                  {nudges.length > 6 ? (
                    <Text style={styles.more}>+ {nudges.length - 6} more in your committees</Text>
                  ) : null}
                </View>
              )}

              {active.length > 0 ? (
                <>
                  <SectionTitle
                    title="This month's payouts"
                    actionLabel="All committees"
                    onAction={() => router.push('/committees')}
                  />
                  <View style={{ gap: 12 }}>
                    {active.map((c) => {
                      const i = currentIndex(c);
                      const who = recipient(c, i);
                      return (
                        <Card key={c.id} onPress={() => openCommittee(c.id)}>
                          <View style={styles.payoutTop}>
                            <IconTile icon={iconFor(c)} gradient={gradientOf(accentFor(c))} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.rowTitle} numberOfLines={1}>
                                {c.name}
                              </Text>
                              <Text style={styles.rowSub}>
                                {monthName(c, i)} · due {formatDay(dueDate(c, i))}
                              </Text>
                            </View>
                            <Text style={styles.pot}>{formatMoney(potAmount(c))}</Text>
                          </View>
                          <View style={styles.winner}>
                            <Ionicons name="gift" size={16} color={colors.primary} />
                            <Text style={styles.winnerText} numberOfLines={1}>
                              {who ? `${who.name} receives the pot` : 'No recipient set'}
                            </Text>
                          </View>
                          <ProgressBar
                            value={paidCount(c, i) / Math.max(c.members.length, 1)}
                            color={accentFor(c).to}
                          />
                          <Text style={[styles.rowSub, { marginTop: 6 }]}>
                            {paidCount(c, i)} of {c.members.length} paid
                          </Text>
                        </Card>
                      );
                    })}
                  </View>
                </>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  body: { paddingHorizontal: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: -30 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 12,
    gap: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lilacTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: { color: colors.text, fontSize: 19, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  rowSub: { color: colors.textMuted, fontSize: 13 },
  more: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 },
  allPaid: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  allPaidIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pot: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  winner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.lilacTint,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  winnerText: { flex: 1, color: colors.primary, fontSize: 14, fontWeight: '700' },
});