import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import DifficultyBadge from './DifficultyBadge';

/**
 * SongCard — Home screen card for a single song with AI difficulty metrics.
 *
 * Props:
 *   title       (string)   — Song title.
 *   artist      (string)   — Artist name.
 *   score       (number)   — Difficulty score 0–100 from the ML engine.
 *   genre       (string)   — Optional genre tag (e.g. "Classical", "Folk").
 *   duration    (string)   — Optional formatted duration (e.g. "4:32").
 *   imageEmoji  (string)   — Fallback emoji when no artwork is available.
 *   onPress     (function) — Card tap handler (e.g. navigate to detail).
 *   onPlayPress (function) — Play button tap handler.
 */
export default function SongCard({
  title = 'Untitled',
  artist = 'Unknown Artist',
  score = 0,
  genre,
  duration,
  imageEmoji = '🎵',
  onPress,
  onPlayPress,
}) {
  // Fade-in on mount
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityLabel={`Song card: ${title} by ${artist}`}
      >
        {/* Artwork placeholder */}
        <View style={styles.artworkContainer}>
          <View style={styles.artwork}>
            <Text style={styles.artworkEmoji}>{imageEmoji}</Text>
          </View>

          {/* Glow ring around artwork — colored to match difficulty tier */}
          <View
            style={[
              styles.artworkGlow,
              {
                borderColor:
                  score <= 25
                    ? 'rgba(57,255,20,0.25)'
                    : score <= 50
                      ? 'rgba(0,229,255,0.25)'
                      : score <= 75
                        ? 'rgba(255,171,0,0.25)'
                        : 'rgba(255,64,129,0.25)',
              },
            ]}
          />
        </View>

        {/* Song info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {artist}
          </Text>

          {/* Meta row: badge + optional genre/duration */}
          <View style={styles.metaRow}>
            <DifficultyBadge score={score} size="sm" />
            {genre && (
              <View style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right side: duration + play button */}
        <View style={styles.rightSection}>
          {duration && <Text style={styles.durationText}>{duration}</Text>}
          <TouchableOpacity
            style={styles.playButton}
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation?.();
              onPlayPress?.();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Play ${title}`}
          >
            <Text style={styles.playIcon}>▶</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    // Subtle elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  /* Artwork --------------------------------------------------------------- */
  artworkContainer: {
    position: 'relative',
    marginRight: 14,
  },
  artwork: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#252528',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  artworkEmoji: {
    fontSize: 26,
  },
  artworkGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 17,
    borderWidth: 2,
  },

  /* Info ------------------------------------------------------------------ */
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  artist: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  genreTag: {
    backgroundColor: 'rgba(192,116,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(192,116,255,0.3)',
  },
  genreText: {
    color: '#c074ff',
    fontSize: 10,
    fontWeight: '600',
  },

  /* Right ----------------------------------------------------------------- */
  rightSection: {
    alignItems: 'center',
    marginLeft: 8,
  },
  durationText: {
    color: '#777',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#d6a3ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  playIcon: {
    fontSize: 14,
    color: '#3a0e5c',
    marginLeft: 2,
  },
});
