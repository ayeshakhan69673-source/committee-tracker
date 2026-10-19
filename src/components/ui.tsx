import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { initials } from '@/lib/format';
import { colors, fonts, radius, shadow } from '@/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/* ------------------------------ Text (applies the app font) ------------------------------ */

function fontFor(weight: TextStyle['fontWeight']): string {
  switch (String(weight)) {
    case '500':
      return fonts.medium;
    case '600':
      return fonts.semibold;
    case '700':
    case 'bold':
      return fonts.bold;
    case '800':
    case '900':
      return fonts.extrabold;
    default:
      return fonts.regular;
  }
}

// Use this instead of Text from react-native. It turns fontWeight into the right font file.
export function Text({ style, ...rest }: TextProps) {
  const { fontWeight, fontFamily, ...others } = StyleSheet.flatten(style) ?? {};
  return <RNText {...rest} style={[others, { fontFamily: fontFamily ?? fontFor(fontWeight) }]} />;
}

const DEFAULT_GRADIENT = [colors.primary, '#7A4FA0'] as const;

/* ------------------------------ Header ------------------------------ */

type HeaderProps = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
  gradient?: readonly [string, string];
};

export function Header({ title, subtitle, left, right, children, gradient }: HeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradient ?? DEFAULT_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 14 }]}>
      <View style={styles.circleBig} />
      <View style={styles.circleSmall} />
      <View style={styles.headerRow}>
        {left}
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </LinearGradient>
  );
}

/* ------------------------------ Card ------------------------------ */

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ------------------------------ Buttons ------------------------------ */

type ButtonVariant = 'primary' | 'soft' | 'ghost' | 'danger' | 'whatsapp';

const buttonColors: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  soft: { bg: colors.lilacTint, fg: colors.primary, border: colors.lilacTint },
  ghost: { bg: 'transparent', fg: colors.primary, border: colors.lilac },
  danger: { bg: colors.dangerTint, fg: colors.danger, border: colors.dangerTint },
  whatsapp: { bg: colors.successTint, fg: colors.success, border: colors.successTint },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  small,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = buttonColors[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: c.bg, borderColor: c.border },
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={small ? 16 : 19} color={c.fg} /> : null}
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: c.fg }]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.white,
  background = 'rgba(255,255,255,0.18)',
  size = 40,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  background?: string;
  size?: number;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && styles.pressed,
      ]}>
      <Ionicons name={icon} size={size * 0.52} color={color} />
    </Pressable>
  );
}

/* ------------------------------ Form ------------------------------ */

type TextFieldProps = TextInputProps & {
  label: string;
  prefix?: string;
  hint?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, prefix, hint, style, onFocus, onBlur, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        {prefix ? <Text style={styles.fieldPrefix}>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.primarySoft}
          selectionColor={colors.primaryMid}
          style={[styles.fieldInput, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
});

// - [value] + control, used for the due day and the start month.
export function Stepper({
  value,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
}: {
  value: string;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <View style={styles.stepper}>
      <IconButton
        icon="chevron-back"
        label="Previous"
        onPress={onPrev}
        color={prevDisabled ? colors.lilac : colors.primary}
        background={colors.lilacTint}
        size={38}
      />
      <Text style={styles.stepperValue}>{value}</Text>
      <IconButton
        icon="chevron-forward"
        label="Next"
        onPress={onNext}
        color={nextDisabled ? colors.lilac : colors.primary}
        background={colors.lilacTint}
        size={38}
      />
    </View>
  );
}

/* ------------------------------ Small pieces ------------------------------ */

export function Chip({
  label,
  active,
  onPress,
  dot,
  activeColor,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  dot?: 'success' | 'primary';
  activeColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        active && activeColor ? { backgroundColor: activeColor } : null,
        pressed && styles.pressed,
      ]}>
      {dot ? (
        <View
          style={[
            styles.chipDot,
            { backgroundColor: dot === 'success' ? colors.success : colors.primaryMid },
            active && dot === 'primary' && { backgroundColor: colors.white },
          ]}
        />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value, color = colors.primaryMid }: { value: number; color?: string }) {
  const target = Math.max(0, Math.min(1, value));
  const anim = useRef(new Animated.Value(target)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, target]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

// Rounded square with an icon on a colour gradient (a committee's identity).
export function IconTile({
  icon,
  gradient,
  size = 46,
}: {
  icon: IconName;
  gradient: readonly [string, string];
  size?: number;
}) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name={icon} size={size * 0.5} color={colors.white} />
    </LinearGradient>
  );
}

const avatarColors = [colors.primary, colors.primaryMid, '#7A4FA0', '#6B3F8C', '#9467B3'];

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatarColors[hash % avatarColors.length],
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: colors.white, fontWeight: '700', fontSize: size * 0.38 }}>
        {initials(name)}
      </Text>
    </View>
  );
}

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

const toneColors: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.successTint, fg: colors.success },
  warning: { bg: colors.warningTint, fg: colors.warning },
  danger: { bg: colors.dangerTint, fg: colors.danger },
  neutral: { bg: colors.lilacTint, fg: colors.textMuted },
  primary: { bg: colors.lilacTint, fg: colors.primary },
};

export function Pill({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const t = toneColors[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={t.fg} /> : null}
      <Text style={[styles.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function SectionTitle({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={34} color={colors.primaryMid} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} icon="add" style={{ marginTop: 18 }} />
      ) : null}
    </View>
  );
}

/* ------------------------------ Styles ------------------------------ */

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 52,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  circleBig: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primaryMid,
    opacity: 0.35,
    top: -90,
    right: -60,
  },
  circleSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.lilac,
    opacity: 0.2,
    bottom: -40,
    left: -30,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1 },
  headerTitle: { color: colors.white, fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  headerSubtitle: { color: colors.lilac, fontSize: 14, marginTop: 4, lineHeight: 20 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  buttonSmall: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.sm },
  buttonText: { fontSize: 16, fontWeight: '700' },
  buttonTextSmall: { fontSize: 13 },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  fieldFocused: { borderColor: colors.primaryMid },
  fieldPrefix: { color: colors.textMuted, fontSize: 16, fontWeight: '600', marginRight: 8 },
  fieldInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 13,
    fontFamily: fonts.medium,
  },
  fieldHint: { color: colors.textMuted, fontSize: 12, marginTop: 5 },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 6,
  },
  stepperValue: { color: colors.text, fontSize: 17, fontWeight: '700' },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    backgroundColor: colors.lilacTint,
  },
  chipActive: { backgroundColor: colors.primary },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: colors.white },

  track: { height: 8, borderRadius: 4, backgroundColor: colors.lilacTint, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  pillText: { fontSize: 12, fontWeight: '700' },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionAction: { color: colors.primaryMid, fontSize: 14, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.lilacTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 6,
  },
});