import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/* ------------------------------ PayCheck ------------------------------ */

// The round "paid" button. It pops when the state changes.
export function PayCheck({
  done,
  onPress,
  label,
}: {
  done: boolean;
  onPress: () => void;
  label: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scale.setValue(0.65);
    Animated.spring(scale, { toValue: 1, friction: 3.5, tension: 190, useNativeDriver: true }).start();
  }, [done, scale]);

  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={8}>
      <Animated.View style={[styles.check, done && styles.checkOn, { transform: [{ scale }] }]}>
        {done ? <Ionicons name="checkmark" size={20} color={colors.white} /> : null}
      </Animated.View>
    </Pressable>
  );
}

/* ------------------------------ Confetti ------------------------------ */

type Piece = { dx: number; dy: number; rot: number; size: number; color: string; round: boolean };

const CONFETTI_COLORS = [colors.primary, colors.primaryMid, colors.lilac, colors.white, '#B8528F', '#F2C94C'];

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const power = 90 + Math.random() * 150;
    return {
      dx: Math.cos(angle) * power,
      dy: Math.sin(angle) * power - 80, // bias upwards
      rot: (Math.random() - 0.5) * 900,
      size: 8 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      round: Math.random() > 0.5,
    };
  });
}

// Increase `burst` by 1 to fire the confetti once.
export function Confetti({ burst }: { burst: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (burst === 0) return;
    setPieces(makePieces(28));
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setPieces([]);
    });
  }, [burst, progress]);

  if (pieces.length === 0) return null;
  const { width, height } = Dimensions.get('window');

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: width / 2 - p.size / 2,
            top: height * 0.3,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            borderRadius: p.round ? p.size / 2 : 2,
            backgroundColor: p.color,
            opacity: progress.interpolate({ inputRange: [0, 0.08, 0.75, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
              { translateY: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, p.dy, p.dy + 260] }) },
              { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  check: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.lilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.success, borderColor: colors.success },
});