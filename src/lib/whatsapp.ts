import { Linking, Share } from 'react-native';

import type { Committee, Member } from '@/types';
import { dueDate, monthName, pendingMembers } from './committee';
import { formatDay } from './dates';
import { formatMoney } from './format';

// 0300 1234567 / +92 300 1234567 / 3001234567  ->  923001234567
export function toWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  if (digits.startsWith('92') && digits.length >= 12) return digits;
  if (digits.startsWith('0')) return '92' + digits.slice(1);
  if (digits.length === 10 && digits.startsWith('3')) return '92' + digits;
  return digits;
}

export function reminderText(c: Committee, monthIndex: number, member: Member): string {
  return (
    `Assalam o Alaikum ${member.name}, a friendly reminder: your ` +
    `${formatMoney(c.monthlyAmount)} contribution for "${c.name}" (${monthName(c, monthIndex)}) ` +
    `is due on ${formatDay(dueDate(c, monthIndex))}. Please send it when you can. Thank you!`
  );
}

// Opens WhatsApp with the message ready. Falls back to the share sheet if there is no number.
export async function sendReminder(c: Committee, monthIndex: number, member: Member) {
  const text = reminderText(c, monthIndex, member);
  const number = toWhatsAppNumber(member.phone);
  if (number) {
    try {
      await Linking.openURL(`https://wa.me/${number}?text=${encodeURIComponent(text)}`);
      return;
    } catch {
      // fall through to the share sheet
    }
  }
  await Share.share({ message: text });
}

// One summary message for the whole group (paste it into the committee's group chat).
export async function sendGroupReminder(c: Committee, monthIndex: number) {
  const pending = pendingMembers(c, monthIndex);
  if (pending.length === 0) return;
  const names = pending.map((m) => `- ${m.name}`).join('\n');
  const message =
    `Assalam o Alaikum everyone! Reminder for "${c.name}" (${monthName(c, monthIndex)}): ` +
    `${formatMoney(c.monthlyAmount)} is due on ${formatDay(dueDate(c, monthIndex))}.\n\n` +
    `Still pending:\n${names}\n\nThank you!`;
  await Share.share({ message });
}