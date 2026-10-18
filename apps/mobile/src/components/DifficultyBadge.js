import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

/**
 * DifficultyBadge — Color-coded badge driven by AI difficulty score.
 *
 * Props:
 *   score (number 0–100)  — Difficulty percentage from the ML engine.
 *   size  ('sm' | 'md' | 'lg') — Badge size variant (default 'md').
 *   showScore (bool)     — Whether to render the numeric percentage (default true).
 */

const TIERS = [
  { max: 25,  label: 'Very Easy', color: '#39ff14', bgTint: 'rgba(57,255,20,0.12)',  borderColor: 'rgba(57,255,20,0.35)',  glowColor: '#39ff14' },
  { max: 50,  label: 'Easy',      color: '#00e5ff', bgTint: 'rgba(0,229,255,0.12)',  borderColor: 'rgba(0,229,255,0.35)',  glowColor: '#00e5ff' },
  { max: 75,  label: 'Moderate',   color: '#ffab00', bgTint: 'rgba(255,171,0,0.12)',  borderColor: 'rgba(255,171,0,0.35)',  glowColor: '#ffab00' },
  { max: 100, label: 'Difficult',  color: '#ff4081', bgTint: 'rgba(255,64,129,0.12)', borderColor: 'rgba(255,64,129,0.35)', glowColor: '#ff4081' },
];

function getTier(score) {
  const clamped = Math.max(0, Math.min(100, score));
  return TIERS.find((t) => clamped <= t.max) || TIERS[TIERS.length - 1];
}

const SIZE_MAP = {
  sm: { paddingH: 8,  paddingV: 3,  fontSize: 10, dotSize: 5, scoreSize: 9 },
  md: { paddingH: 12, paddingV: 5,  fontSize: 12, dotSize: 7, scoreSize: 10 },
  lg: { paddingH: 16, paddingV: 7,  fontSize: 14, dotSize: 9, scoreSize: 12 },
};

export default function DifficultyBadge({ score = 0, size = 'md', showScore = true }) {
  const tier = getTier(score);
  const s = SIZE_MAP[size] || SIZE_MAP.md;

  // Subtle pulse animation for the indicator dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: tier.bgTint,
          borderColor: tier.borderColor,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
        },
      ]}
    >
      {/* Pulsing dot indicator */}
      <Animated.View
        style={[
          styles.dot,
          {
            width: s.dotSize,
            height: s.dotSize,
            borderRadius: s.dotSize / 2,
            backgroundColor: tier.color,
            opacity: pulseAnim,
            shadowColor: tier.glowColor,
          },
        ]}
      />

      <Text style={[styles.label, { color: tier.color, fontSize: s.fontSize }]}>
        {tier.label}
      </Text>

      {showScore && (
        <Text style={[styles.score, { color: tier.color, fontSize: s.scoreSize }]}>
          {Math.round(score)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    marginRight: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  score: {
    marginLeft: 6,
    fontWeight: '600',
    opacity: 0.8,
  },
});
