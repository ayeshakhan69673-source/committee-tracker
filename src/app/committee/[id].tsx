import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Header,
  IconButton,
  IconTile,
  Pill,
  ProgressBar,
  SectionTitle,
  Text,
} from '@/components/ui';
import { Confetti, PayCheck } from '@/components/effects';
import {
  collectedAmount,
  currentIndex,
  dueDate,
  isPaid,
  monthCount,
  monthName,
  paidCount,
  phase,
  phaseLabel,
  potAmount,
  rawMonthIndex,
  recipient,
} from '@/lib/committee';
import { daysBetween, formatDay } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { accentFor, gradientOf, iconFor } from '@/lib/identity';
import { sendGroupReminder, sendReminder } from '@/lib/whatsapp';
import { useStore } from '@/store/useStore';
import { colors, radius } from '@/theme';

type Tab = 'payments' | 'schedule';

const buzz = (style: Haptics.ImpactFeedbackStyle) => {
  Haptics.impactAsync(style).catch(() => undefined);
};

export default function CommitteeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const committee = useStore((s) => s.committees.find((c) => c.id === id));
  const togglePayment = useStore((s) => s.togglePayment);
  const deleteCommittee = useStore((s) => s.deleteCommittee);

  const [picked, setPicked] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('payments');
  const [burst, setBurst] = useState(0);
  const last = useRef<{ index: number; paid: number } | null>(null);

  const n = committee ? monthCount(committee) : 0;
  const index = picked ?? (committee ? currentIndex(committee) : 0);
  const paid = committee ? paidCount(committee, index) : 0;

  // Celebrate when the last person pays for the month being viewed.
  useEffect(() => {
    const prev = last.current;
    if (prev && prev.index === index && prev.paid < n && paid === n && n > 0) {
      setBurst((b) => b + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
    last.current = { index, paid };
  }, [index, paid, n]);

  if (!committee) {
    return (
      <View style={styles.screen}>
        <Header
          title="Committee"
          left={<IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />}
        />
        <View style={{ padding: 20, marginTop: -26 }}>
          <Card>
            <EmptyState
              icon="alert-circle-outline"
              title="Committee not found"
              text="It may have been deleted. Go back to see your committees."
            />
          </Card>
        </View>
      </View>
    );
  }

  const now = new Date();
  const accent = accentFor(committee);
  const gradient = gradientOf(accent);
  const who = recipient(committee, index);
  const due = dueDate(committee, index);
  const daysLate = daysBetween(due, now);
  const started = rawMonthIndex(committee, now) >= index; // this month has begun (or passed)
  const unpaid = committee.members.filter((m) => !isPaid(committee, index, m.id));
  const p = phase(committee, now);

  const onToggle = (memberId: string) => {
    const wasPaid = isPaid(committee, index, memberId);
    togglePayment(committee.id, index, memberId);
    buzz(wasPaid ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
  };

  const confirmDelete = () =>
    Alert.alert('Delete this committee?', `"${committee.name}" and all its payments will be removed from this phone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteCommittee(committee.id);
          router.back();
        },
      },
    ]);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Header
          title={committee.name}
          subtitle={`${formatMoney(committee.monthlyAmount)} / month · ${n} members · due on the ${committee.dueDay}${suffix(committee.dueDay)}`}
          gradient={gradient}
          left={<IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />}
          right={<IconButton icon="trash-outline" label="Delete committee" onPress={confirmDelete} />}
        />

        <View style={styles.body}>
          {/* Pot overview */}
          <Card>
            <View style={styles.overviewTop}>
              <IconTile icon={iconFor(committee)} gradient={gradient} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={styles.small}>Pot each month</Text>
                <Text style={[styles.pot, { color: accent.from }]}>{formatMoney(potAmount(committee))}</Text>
              </View>
              <Pill
                label={phaseLabel(committee, now)}
                tone={p === 'active' ? 'success' : p === 'upcoming' ? 'warning' : 'neutral'}
              />
            </View>
          </Card>

          {/* Tabs */}
          <View style={styles.tabs}>
            <Pressable
              onPress={() => setTab('payments')}
              style={[styles.tab, tab === 'payments' && styles.tabActive]}>
              <Text style={[styles.tabText, tab === 'payments' && { color: accent.from }]}>Payments</Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('schedule')}
              style={[styles.tab, tab === 'schedule' && styles.tabActive]}>
              <Text style={[styles.tabText, tab === 'schedule' && { color: accent.from }]}>Payout schedule</Text>
            </Pressable>
          </View>

          {tab === 'payments' ? (
            <>
              {/* Month picker */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.months}>
                {Array.from({ length: n }, (_, i) => (
                  <Chip
                    key={i}
                    label={monthName(committee, i)}
                    active={i === index}
                    activeColor={accent.from}
                    dot={paidCount(committee, i) === n ? 'success' : undefined}
                    onPress={() => setPicked(i)}
                  />
                ))}
              </ScrollView>

              {/* Selected month */}
              <Card>
                <View style={styles.winner}>
                  <View style={[styles.giftCircle, { backgroundColor: accent.from }]}>
                    <Ionicons name="gift" size={20} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.small}>{monthName(committee, index)} pot goes to</Text>
                    <Text style={styles.winnerName} numberOfLines={1}>
                      {who ? who.name : 'Not set'}
                    </Text>
                  </View>
                  <Text style={[styles.collected, { color: accent.from }]}>
                    {formatMoney(collectedAmount(committee, index))}
                  </Text>
                </View>

                <ProgressBar value={paid / Math.max(n, 1)} color={paid === n ? colors.success : accent.to} />
                <View style={styles.progressRow}>
                  <Text style={styles.small}>
                    {paid} of {n} paid
                  </Text>
                  <Text style={styles.small}>Due {formatDay(due)}</Text>
                </View>

                {unpaid.length > 0 && started ? (
                  <Button
                    title="Remind everyone who is pending"
                    icon="logo-whatsapp"
                    variant="whatsapp"
                    small
                    onPress={() => sendGroupReminder(committee, index)}
                    style={{ marginTop: 14 }}
                  />
                ) : null}
                {paid === n ? (
                  <View style={styles.doneRow}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.doneText}>Everyone has paid for this month.</Text>
                  </View>
                ) : null}
              </Card>

              <SectionTitle title="Members" />
              <Card style={{ paddingVertical: 6 }}>
                {committee.members.map((m, i) => {
                  const isDone = isPaid(committee, index, m.id);
                  const paidOn = committee.paid[`${index}:${m.id}`];
                  const overdue = !isDone && daysLate > 0;
                  const isRecipient = who?.id === m.id;
                  return (
                    <View key={m.id} style={[styles.memberRow, i > 0 && styles.memberBorder]}>
                      <Avatar name={m.name} size={42} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {m.name}
                        </Text>
                        {isDone ? (
                          <Text style={styles.small}>
                            Paid{paidOn ? ` on ${formatDay(new Date(paidOn))}` : ''}
                          </Text>
                        ) : overdue ? (
                          <Pill label={`Overdue by ${daysLate} day${daysLate === 1 ? '' : 's'}`} tone="danger" />
                        ) : (
                          <Text style={styles.small}>Pending</Text>
                        )}
                        {isRecipient ? <Pill label="Receives this month" tone="primary" icon="gift" /> : null}
                      </View>

                      {!isDone ? (
                        <IconButton
                          icon="logo-whatsapp"
                          label={`Remind ${m.name}`}
                          color={colors.success}
                          background={colors.successTint}
                          size={38}
                          onPress={() => sendReminder(committee, index, m)}
                        />
                      ) : null}

                      <PayCheck
                        done={isDone}
                        onPress={() => onToggle(m.id)}
                        label={isDone ? `Mark ${m.name} as unpaid` : `Mark ${m.name} as paid`}
                      />
                    </View>
                  );
                })}
              </Card>
              <Text style={styles.tip}>Tap the circle to mark a payment as received. Tap again to undo.</Text>
            </>
          ) : (
            <>
              <SectionTitle title="Who receives the pot, and when" />
              <View style={{ gap: 10 }}>
                {Array.from({ length: n }, (_, i) => {
                  const r = recipient(committee, i);
                  const count = paidCount(committee, i);
                  const isNow = phase(committee, now) === 'active' && rawMonthIndex(committee, now) === i;
                  return (
                    <Card
                      key={i}
                      onPress={() => {
                        setPicked(i);
                        setTab('payments');
                      }}
                      style={[styles.scheduleRow, isNow && { borderWidth: 2, borderColor: accent.to }]}>
                      <View style={[styles.rank, isNow && { backgroundColor: accent.from }]}>
                        <Text style={[styles.rankText, isNow && { color: colors.white }]}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 6 }}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {r ? r.name : 'Not set'}
                        </Text>
                        <Text style={styles.small}>
                          {monthName(committee, i)} · {count} of {n} paid
                        </Text>
                        <ProgressBar value={count / Math.max(n, 1)} color={count === n ? colors.success : accent.to} />
                      </View>
                      {isNow ? <Pill label="This month" tone="primary" /> : null}
                      {count === n ? <Ionicons name="checkmark-circle" size={22} color={colors.success} /> : null}
                    </Card>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Confetti burst={burst} />
    </View>
  );
}

function suffix(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return 'th';
  if (day % 10 === 1) return 'st';
  if (day % 10 === 2) return 'nd';
  if (day % 10 === 3) return 'rd';
  return 'th';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: 20, marginTop: -28 },
  small: { color: colors.textMuted, fontSize: 13 },
  overviewTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pot: { fontSize: 28, fontWeight: '800', marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.lilacTint,
    borderRadius: radius.md,
    padding: 4,
    marginVertical: 16,
  },
  tab: { flex: 1, paddingVertical: 11, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  months: { gap: 8, paddingBottom: 14 },
  winner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  giftCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerName: { color: colors.text, fontSize: 19, fontWeight: '800' },
  collected: { fontSize: 16, fontWeight: '800' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  doneText: { color: colors.success, fontSize: 14, fontWeight: '700' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  memberBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  memberName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  tip: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.lilacTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
});