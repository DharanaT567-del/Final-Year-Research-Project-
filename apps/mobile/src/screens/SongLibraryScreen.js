import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import PrimaryTabBar from '../components/PrimaryTabBar';
import { getSongs } from '../services/songLibraryService';
import { lyricsTheme } from '../theme/lyricsTheme';

const c = lyricsTheme.colors;

export default function SongLibraryScreen({ navigation, route }) {
  const [songs, setSongs] = useState([]);
  const [query, setQuery] = useState(route.params?.query || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getSongs()
      .then((items) => { if (mounted) setSongs(items); })
      .catch(() => { if (mounted) setError('ගීත පුස්තකාලය ලබාගත නොහැකි විය. නැවත උත්සාහ කරන්න.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filteredSongs = songs.filter((song) =>
    `${song.title} ${song.artist}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={c.background} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>NAADA / LEARN</Text>
        <Text style={styles.title}>Song library</Text>
        <Text style={styles.subtitle}>තෝරාගත් ගීතයක් සමඟ සිංහල ඉගෙන ගන්න.</Text>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search songs or artists"
          placeholderTextColor={c.secondaryText}
          accessibilityLabel="Search songs or artists"
          returnKeyType="search"
        />
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Available songs</Text>
          <Text style={styles.count}>{filteredSongs.length}</Text>
        </View>

        {loading ? <ActivityIndicator color={c.lightBlue} style={styles.state} /> : null}
        {error ? <Text style={styles.stateText}>{error}</Text> : null}
        {!loading && !error && filteredSongs.length === 0 ? (
          <Text style={styles.stateText}>ගැළපෙන ගීත හමු නොවීය.</Text>
        ) : null}

        {!loading && !error ? filteredSongs.map((song) => (
          <TouchableOpacity
            key={song.id}
            style={styles.songRow}
            onPress={() => navigation.navigate('SongPlayer', { songId: song.id })}
            accessibilityRole="button"
            accessibilityLabel={`${song.title}, ${song.artist}, open song`}
          >
            <View style={styles.artwork}><Text style={styles.artworkMark}>{song.artworkMark}</Text></View>
            <View style={styles.songDetails}>
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.artist}>{song.artist}</Text>
              <Text style={styles.source}>{song.sourceLabel} · {song.lineCount} lyric lines</Text>
            </View>
            <Text style={styles.openMark}>›</Text>
          </TouchableOpacity>
        )) : null}
        <Text style={styles.notice}>මෙහි ඇති සියලු ගීත සහ පද කෘතිම ආදර්ශ දත්ත වේ.</Text>
      </ScrollView>
      <PrimaryTabBar navigation={navigation} activeRoute="SongLibrary" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  content: { padding: 20, paddingBottom: 28 },
  kicker: { color: c.lightBlue, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 12 },
  title: { color: c.text, fontSize: 29, lineHeight: 36, fontWeight: '900', marginTop: 8 },
  subtitle: { color: c.secondaryText, fontSize: 14, lineHeight: 22, marginTop: 5 },
  search: { minHeight: 48, color: c.text, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 9, paddingHorizontal: 14, marginTop: 20 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 11 },
  sectionTitle: { color: c.text, fontSize: 17, fontWeight: '800' },
  count: { color: c.lightBlue, fontSize: 12, fontWeight: '700' },
  songRow: { flexDirection: 'row', alignItems: 'center', minHeight: 88, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  artwork: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', backgroundColor: c.cardSecondary, borderRadius: 8, marginRight: 13 },
  artworkMark: { color: c.lightBlue, fontSize: 23, fontWeight: '800' },
  songDetails: { flex: 1 },
  songTitle: { color: c.text, fontSize: 15, fontWeight: '800' },
  artist: { color: c.secondaryText, fontSize: 12, marginTop: 3 },
  source: { color: c.lightBlue, fontSize: 10, marginTop: 6 },
  openMark: { color: c.lightBlue, fontSize: 27, paddingHorizontal: 6 },
  state: { marginVertical: 28 },
  stateText: { color: c.secondaryText, textAlign: 'center', lineHeight: 22, marginVertical: 24 },
  notice: { color: c.secondaryText, fontSize: 11, lineHeight: 17, marginTop: 20, textAlign: 'center' },
});