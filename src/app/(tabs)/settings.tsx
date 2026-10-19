import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';

import { Button, Card, Header, SectionTitle, Text, TextField, type IconName } from '@/components/ui';
import { useStore } from '@/store/useStore';
import { colors } from '@/theme';

function InfoRow({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{text}</Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const committees = useStore((s) => s.committees);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const resetAll = useStore((s) => s.resetAll);

  const [restoring, setRestoring] = useState(false);
  const [pasted, setPasted] = useState('');

  const backup = async () => {
    try {
      await Share.share({ title: 'Committee Tracker backup', message: exportData() });
    } catch {
      Alert.alert('Backup failed', 'Could not open the share sheet. Please try again.');
    }
  };

  const restore = () => {
    Alert.alert('Replace current data?', 'Restoring a backup replaces all committees on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: () => {
          if (importData(pasted)) {
            setPasted('');
            setRestoring(false);
            Alert.alert('Backup restored', 'Your committees are back.');
          } else {
            Alert.alert('That did not work', 'The text is not a valid Committee Tracker backup. Paste the whole backup and try again.');
          }
        },
      },
    ]);
  };

  const erase = () => {
    Alert.alert('Erase all data?', 'Every committee and payment on this phone will be deleted. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase everything', style: 'destructive', onPress: resetAll },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}>
        <Header title="Settings" subtitle="Backups, privacy, and how the app works." />

        <View style={styles.body}>
          <Card>
            <InfoRow
              icon="phone-portrait-outline"
              title="Your data stays on this phone"
              text="There is no account and no server. Nothing is uploaded anywhere."
            />
            <View style={styles.divider} />
            <InfoRow
              icon="cash-outline"
              title="No payments are processed"
              text="The app only records who has paid and helps you send reminders."
            />
          </Card>

          <SectionTitle title="Backup" />
          <Card>
            <Text style={styles.cardText}>
              Uninstalling the app or changing phones deletes your data. Save a backup somewhere safe, such as
              WhatsApp to yourself or email.
            </Text>
            <View style={{ gap: 10, marginTop: 14 }}>
              <Button
                title="Save a backup"
                icon="share-outline"
                onPress={backup}
                disabled={committees.length === 0}
              />
              <Button
                title={restoring ? 'Cancel restore' : 'Restore from backup'}
                icon="download-outline"
                variant="soft"
                onPress={() => setRestoring((v) => !v)}
              />
            </View>

            {restoring ? (
              <View style={{ marginTop: 16 }}>
                <TextField
                  label="Paste your backup text"
                  value={pasted}
                  onChangeText={setPasted}
                  multiline
                  placeholder='{"app": "committee-tracker", ...}'
                  style={{ minHeight: 110, textAlignVertical: 'top' }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button title="Restore" icon="refresh" onPress={restore} disabled={pasted.trim().length === 0} />
              </View>
            ) : null}
          </Card>

          <SectionTitle title="Danger zone" />
          <Card>
            <Text style={styles.cardText}>Delete every committee and payment from this phone.</Text>
            <Button
              title="Erase all data"
              icon="trash-outline"
              variant="danger"
              onPress={erase}
              disabled={committees.length === 0}
              style={{ marginTop: 14 }}
            />
          </Card>

          <Text style={styles.version}>Committee Tracker · version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: 20, marginTop: -26 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.lilacTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  infoText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  cardText: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  version: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 28 },
});