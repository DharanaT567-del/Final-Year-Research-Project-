import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { lyricsTheme } from '../theme/lyricsTheme';

const tabs = [
  { route: 'Home', label: 'Home', mark: '⌂' },
  { route: 'SongLibrary', label: 'Library', mark: '♫' },
  { route: 'LearningProgress', label: 'Progress', mark: '◷' },
  { route: 'Dashboard', label: 'Profile', mark: '○' },
];

export default function PrimaryTabBar({ navigation, activeRoute }) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const active = activeRoute === tab.route;
        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.route)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.mark, active && styles.active]}>{tab.mark}</Text>
            <Text style={[styles.label, active && styles.active]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: lyricsTheme.colors.card,
    borderTopWidth: 1,
    borderTopColor: lyricsTheme.colors.border,
    paddingBottom: 4,
  },
  tab: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  mark: { color: lyricsTheme.colors.secondaryText, fontSize: 20, lineHeight: 24 },
  label: { color: lyricsTheme.colors.secondaryText, fontSize: 10, marginTop: 3 },
  active: { color: lyricsTheme.colors.lightBlue, fontWeight: '800' },
});