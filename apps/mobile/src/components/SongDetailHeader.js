import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import DifficultyBadge from './DifficultyBadge';

/**
 * SongDetailHeader — Dashboard-style header for a song's detailed ML output.
 * Designed to sit above the AI Chat (AiTutorScreen) interface.
 *
 * Props:
 *   title               (string)   — Song title.
 *   artist              (string)   — Artist name.
 *   difficultyScore     (number)   — 0–100 difficulty percentage from ML engine.
 *   category            (string)   — ML-assigned difficulty category (e.g. "Moderate").
 *   contributingFactors (string[]) — Key factors like "Fast Tempo", "Complex Vocabulary".
 */
export default function SongDetailHeader({
  title = 'Untitled',
  artist = 'Unknown Artist',
  difficultyScore = 0,
  category = '',
  contributingFactors = [],
}) {
  // Staggered fade-in for each dashboard card
  const fadeAnims = useRef(
    [0, 1, 2].map(() => new Animated.Value(0)),
  ).current;
  const slideAnims = useRef(
    [0, 1, 2].map(() => new Animated.Value(20)),
  ).current;

  useEffect(() => {
    const animations = fadeAnims.map((fa, i) =>
      Animated.parallel([
        Animated.timing(fa, { toValue: 1, duration: 400, delay: i * 120, useNativeDriver: true }),
        Animated.timing(slideAnims[i], { toValue: 0, duration: 400, delay: i * 120, useNativeDriver: true }),
      ]),
    );
    Animated.stagger(0, animations).start();
  }, [fadeAnims, slideAnims]);

  // Animated progress bar fill
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.max(0, Math.min(100, difficultyScore)),
      duration: 800,
      delay: 250,
      useNativeDriver: false,
    }).start();
  }, [difficultyScore, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Dynamic colors for the score gauge
  const tierColor =
    difficultyScore <= 25
      ? '#39ff14'
      : difficultyScore <= 50
        ? '#00e5ff'
        : difficultyScore <= 75
          ? '#ffab00'
          : '#ff4081';

  const tierBgTint =
    difficultyScore <= 25
      ? 'rgba(57,255,20,0.08)'
      : difficultyScore <= 50
        ? 'rgba(0,229,255,0.08)'
        : difficultyScore <= 75
          ? 'rgba(255,171,0,0.08)'
          : 'rgba(255,64,129,0.08)';

  return (
    <View style={styles.container}>
      {/* ─── Song Identity Row ───────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.identityRow,
          { opacity: fadeAnims[0], transform: [{ translateY: slideAnims[0] }] },
        ]}
      >
        <View style={styles.identityText}>
          <Text style={styles.songTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.artistName}>{artist}</Text>
        </View>
        <View style={styles.aiTag}>
          <View style={styles.aiDot} />
          <Text style={styles.aiTagText}>AI Analysis</Text>
        </View>
      </Animated.View>

      {/* ─── Metric Cards Grid ───────────────────────────────────────── */}
      <View style={styles.metricsGrid}>
        {/* Score Card */}
        <Animated.View
          style={[
            styles.metricCard,
            styles.scoreCard,
            { opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] },
          ]}
        >
          <Text style={styles.metricLabel}>Difficulty Score</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, { color: tierColor }]}>
              {Math.round(difficultyScore)}
            </Text>
            <Text style={[styles.scoreUnit, { color: tierColor }]}>%</Text>
          </View>

          {/* Animated progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                  backgroundColor: tierColor,
                  shadowColor: tierColor,
                },
              ]}
            />
          </View>
        </Animated.View>

        {/* Category Card */}
        <Animated.View
          style={[
            styles.metricCard,
            styles.categoryCard,
            { opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] },
          ]}
        >
          <Text style={styles.metricLabel}>Category</Text>
          <DifficultyBadge score={difficultyScore} size="lg" showScore={false} />
          {category ? (
            <Text style={styles.categorySubtext}>{category}</Text>
          ) : null}
        </Animated.View>
      </View>

      {/* ─── Contributing Factors ────────────────────────────────────── */}
      {contributingFactors.length > 0 && (
        <Animated.View
          style={[
            styles.factorsCard,
            { opacity: fadeAnims[2], transform: [{ translateY: slideAnims[2] }] },
          ]}
        >
          <View style={styles.factorsHeader}>
            <Text style={styles.factorsTitle}>Key Contributing Factors</Text>
            <View style={styles.mlTag}>
              <Text style={styles.mlTagText}>ML</Text>
            </View>
          </View>

          <View style={styles.factorsWrap}>
            {contributingFactors.map((factor, index) => {
              // Cycle through accent colors for visual variety
              const accentColors = ['#00e5ff', '#c074ff', '#39ff14', '#ffab00', '#ff4081', '#d6a3ff'];
              const accent = accentColors[index % accentColors.length];
              const bgTint = accent + '14'; // ~8% opacity hex

              return (
                <View
                  key={`factor-${index}`}
                  style={[
                    styles.factorChip,
                    {
                      backgroundColor: bgTint,
                      borderColor: accent + '40', // ~25% opacity hex
                    },
                  ]}
                >
                  <View style={[styles.factorDot, { backgroundColor: accent }]} />
                  <Text style={[styles.factorText, { color: accent }]}>{factor}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>
      )}

      {/* Bottom separator glow line */}
      <View style={styles.separator}>
        <View style={[styles.separatorGlow, { backgroundColor: tierColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    paddingTop: 8,
    paddingBottom: 4,
  },

  /* Identity Row --------------------------------------------------------- */
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  identityText: {
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  artistName: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12252a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1a3a42',
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00e5ff',
    marginRight: 6,
    shadowColor: '#00e5ff',
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  aiTagText: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Metrics Grid --------------------------------------------------------- */
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  scoreCard: {},
  categoryCard: {
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  scoreUnit: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 2,
    opacity: 0.7,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  categorySubtext: {
    fontSize: 11,
    color: '#777',
    marginTop: 6,
    fontWeight: '500',
  },

  /* Contributing Factors ------------------------------------------------- */
  factorsCard: {
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 12,
  },
  factorsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  factorsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ddd',
    letterSpacing: 0.2,
  },
  mlTag: {
    backgroundColor: '#2b1b36',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4d2861',
  },
  mlTagText: {
    color: '#c074ff',
    fontSize: 10,
    fontWeight: '800',
  },
  factorsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  factorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 6,
  },
  factorText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Separator ------------------------------------------------------------ */
  separator: {
    height: 1,
    backgroundColor: '#222',
    marginHorizontal: 16,
  },
  separatorGlow: {
    height: 1,
    width: '40%',
    alignSelf: 'center',
    opacity: 0.4,
    borderRadius: 1,
  },
});
