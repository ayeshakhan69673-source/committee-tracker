import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Header,
  IconButton,
  IconTile,
  SectionTitle,
  Stepper,
  Text,
  TextField,
  type IconName,
} from '@/components/ui';
import { addMonths, monthLabel } from '@/lib/dates';
import { formatMoney, newId } from '@/lib/format';
import { ACCENTS, COMMITTEE_ICONS, accentById, gradientOf } from '@/lib/identity';
import { useStore } from '@/store/useStore';
import { colors } from '@/theme';

type Draft = { key: string; name: string; phone: string };

function shuffled<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function NewCommitteeScreen() {
  const router = useRouter();
  const addCommittee = useStore((s) => s.addCommittee);

  const now = new Date();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState(5);
  const [start, setStart] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [icon, setIcon] = useState<IconName>(COMMITTEE_ICONS[0]);
  const [accentId, setAccentId] = useState<string>(ACCENTS[0].id);
  const accent = accentById(accentId);
  const [members, setMembers] = useState<Draft[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const nameInput = useRef<TextInput>(null);

  const amountNumber = parseInt(amount.replace(/[^\d]/g, ''), 10) || 0;
  const end = addMonths(start.year, start.month, Math.max(members.length - 1, 0));
  const canCreate = name.trim().length > 0 && amountNumber > 0 && members.length >= 2;

  const shiftStart = (delta: number) => setStart((s) => addMonths(s.year, s.month, delta));

  const addMember = () => {
    const trimmed = memberName.trim();
    if (!trimmed) return;
    setMembers((list) => [...list, { key: newId(), name: trimmed, phone: memberPhone.trim() }]);
    setMemberName('');
    setMemberPhone('');
    nameInput.current?.focus();
  };

  const move = (index: number, delta: number) => {
    setMembers((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const copy = [...list];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const remove = (key: string) => setMembers((list) => list.filter((m) => m.key !== key));

  const create = () => {
    if (!canCreate) return;
    const id = addCommittee({
      name,
      monthlyAmount: amountNumber,
      startYear: start.year,
      startMonth: start.month,
      dueDay,
      icon,
      accent: accentId,
      members: members.map((m) => ({ name: m.name, phone: m.phone })),
    });
    router.replace({ pathname: '/committee/[id]', params: { id } });
  };

  const leave = () => {
    const hasWork = name.trim() || amount || members.length > 0;
    if (!hasWork) return router.back();
    Alert.alert('Discard this committee?', 'What you entered will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}>
        <Header
          title="New committee"
          subtitle="Add the details and members. You can mark payments afterwards."
          gradient={gradientOf(accent)}
          left={<IconButton icon="close" label="Close" onPress={leave} />}
        />

        <View style={styles.body}>
          <Card>
            <TextField
              label="Committee name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Family committee"
              maxLength={40}
            />
            <TextField
              label="Amount per member, each month"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d]/g, ''))}
              prefix="Rs"
              placeholder="5000"
              keyboardType="number-pad"
              maxLength={9}
            />

            <Text style={styles.label}>Payments are due on day</Text>
            <Stepper
              value={`${dueDay} of every month`}
              onPrev={() => setDueDay((d) => Math.max(1, d - 1))}
              onNext={() => setDueDay((d) => Math.min(28, d + 1))}
              prevDisabled={dueDay <= 1}
              nextDisabled={dueDay >= 28}
            />

            <Text style={[styles.label, { marginTop: 14 }]}>First month</Text>
            <Stepper
              value={monthLabel(start.year, start.month)}
              onPrev={() => shiftStart(-1)}
              onNext={() => shiftStart(1)}
            />
          </Card>

          <SectionTitle title="Look" />
          <Card>
            <View style={styles.lookPreview}>
              <IconTile icon={icon} gradient={gradientOf(accent)} size={58} />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {name.trim() || 'Your committee'}
                </Text>
                <Text style={styles.memberSub}>Pick an icon and a colour</Text>
              </View>
            </View>

            <Text style={styles.label}>Icon</Text>
            <View style={styles.pickRow}>
              {COMMITTEE_ICONS.map((i) => (
                <Pressable
                  key={i}
                  onPress={() => setIcon(i)}
                  accessibilityLabel={`Icon ${i}`}
                  style={[
                    styles.iconChoice,
                    icon === i && { borderColor: accent.from, backgroundColor: colors.lilacTint },
                  ]}>
                  <Ionicons name={i} size={22} color={icon === i ? accent.from : colors.primarySoft} />
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Colour</Text>
            <View style={styles.pickRow}>
              {ACCENTS.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => setAccentId(a.id)}
                  accessibilityLabel={`Colour ${a.id}`}
                  style={[styles.swatch, { backgroundColor: a.from }, accentId === a.id && { borderColor: a.to }]}>
                  {accentId === a.id ? <Ionicons name="checkmark" size={18} color={colors.white} /> : null}
                </Pressable>
              ))}
            </View>
          </Card>

          <SectionTitle title={`Members${members.length ? ` (${members.length})` : ''}`} />
          <Card>
            <TextField
              ref={nameInput}
              label="Member name"
              value={memberName}
              onChangeText={setMemberName}
              placeholder="e.g. Ayesha"
              maxLength={30}
              returnKeyType="next"
            />
            <TextField
              label="WhatsApp number (optional)"
              value={memberPhone}
              onChangeText={setMemberPhone}
              placeholder="0300 1234567"
              keyboardType="phone-pad"
              hint="Used only to open a WhatsApp reminder."
              maxLength={16}
            />
            <Button
              title="Add member"
              icon="person-add-outline"
              variant="soft"
              onPress={addMember}
              disabled={memberName.trim().length === 0}
            />
          </Card>

          <SectionTitle title="Payout order" />
          {members.length === 0 ? (
            <Card>
              <EmptyState
                icon="list-outline"
                title="No members yet"
                text="Add at least two members. Each person receives the full pot once, one per month, in the order shown here."
              />
            </Card>
          ) : (
            <Card style={{ paddingVertical: 8 }}>
              {members.map((m, i) => {
                const p = addMonths(start.year, start.month, i);
                return (
                  <View key={m.key} style={[styles.memberRow, i > 0 && styles.memberBorder]}>
                    <View style={styles.rank}>
                      <Text style={styles.rankText}>{i + 1}</Text>
                    </View>
                    <Avatar name={m.name} size={38} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {m.name}
                      </Text>
                      <Text style={styles.memberSub}>Receives in {monthLabel(p.year, p.month)}</Text>
                    </View>
                    <Pressable onPress={() => move(i, -1)} hitSlop={8} disabled={i === 0}>
                      <Ionicons name="chevron-up" size={22} color={i === 0 ? colors.lilac : colors.primary} />
                    </Pressable>
                    <Pressable onPress={() => move(i, 1)} hitSlop={8} disabled={i === members.length - 1}>
                      <Ionicons
                        name="chevron-down"
                        size={22}
                        color={i === members.length - 1 ? colors.lilac : colors.primary}
                      />
                    </Pressable>
                    <Pressable onPress={() => remove(m.key)} hitSlop={8}>
                      <Ionicons name="close-circle" size={22} color={colors.danger} />
                    </Pressable>
                  </View>
                );
              })}
              {members.length > 1 ? (
                <Button
                  title="Draw a random order"
                  icon="shuffle"
                  variant="ghost"
                  small
                  onPress={() => setMembers((list) => shuffled(list))}
                  style={{ marginTop: 10, marginBottom: 6 }}
                />
              ) : null}
            </Card>
          )}

          {members.length >= 2 && amountNumber > 0 ? (
            <Card style={styles.summary}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryText}>
                {members.length} members × {formatMoney(amountNumber)} ={' '}
                <Text style={styles.summaryStrong}>{formatMoney(amountNumber * members.length)}</Text> pot each month.
              </Text>
              <Text style={styles.summaryText}>
                Runs for {members.length} months, {monthLabel(start.year, start.month)} to {monthLabel(end.year, end.month)}.
              </Text>
            </Card>
          ) : null}

          <Button
            title="Create committee"
            icon="checkmark"
            onPress={create}
            disabled={!canCreate}
            style={{ marginTop: 22 }}
          />
          {!canCreate ? (
            <Text style={styles.needs}>Add a name, an amount, and at least two members to continue.</Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: 20, marginTop: -26 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  lookPreview: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  pickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconChoice: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  memberBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lilacTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  memberName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  memberSub: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  summary: { marginTop: 16, backgroundColor: colors.lilacTint, gap: 4 },
  summaryTitle: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  summaryText: { color: colors.text, fontSize: 14, lineHeight: 21 },
  summaryStrong: { fontWeight: '800', color: colors.primary },
  needs: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 10 },
});