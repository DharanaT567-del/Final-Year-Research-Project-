import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { getSongById } from '../services/songLibraryService';
import { lyricsTheme } from '../theme/lyricsTheme';

const c = lyricsTheme.colors;

export default function SongPlayerScreen({ navigation, route }) {
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getSongById(route.params?.songId)
      .then((item) => {
        if (!mounted) return;
        if (!item) setError('තෝරාගත් ගීතය සොයාගත නොහැකි විය.');
        else setSong(item);
      })
      .catch(() => { if (mounted) setError('ගීතය ලබාගත නොහැකි විය. නැවත උත්සාහ කරන්න.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [route.params?.songId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={c.background} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.navigate('SongLibrary')} accessibilityRole="button">
          <Text style={styles.back}>‹  Back to library</Text>
        </TouchableOpacity>
        {loading ? <ActivityIndicator color={c.lightBlue} style={styles.state} /> : null}
        {error ? <Text style={styles.stateText}>{error}</Text> : null}
        {song ? (
          <>
            <View style={styles.hero}>
              <View style={styles.artwork}><Text style={styles.artworkMark}>{song.artworkMark}</Text></View>
              <Text style={styles.title}>{song.title}</Text>
              <Text style={styles.artist}>{song.artist}</Text>
              <Text style={styles.source}>{song.sourceLabel}</Text>
            </View>
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>ශ්‍රව්‍යය සහ සමමුහුර්තකරණය නොමැත</Text>
              <Text style={styles.noticeText}>මෙම ආදර්ශ ගීතයට ශ්‍රව්‍ය ගොනුවක් හෝ කාල සලකුණු නොමැති නිසා වාදනය සහ පද සමමුහුර්ත කිරීම ලබා දී නැත.</Text>
            </View>
            <Text style={styles.sectionTitle}>සිංහල පද</Text>
            {song.lines.length ? song.lines.map((line, index) => (
              <TouchableOpacity
                key={line.id}
                style={styles.lyricRow}
                onPress={() => navigation.navigate('LyricsExplanation', { songId: song.id, lineId: line.id })}
                accessibilityRole="button"
                accessibilityLabel={`Explain lyric line ${index + 1}`}
              >
                <Text style={styles.lineNumber}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.lyric}>{line.text}</Text>
                <Text style={styles.openMark}>›</Text>
              </TouchableOpacity>
            )) : <Text style={styles.stateText}>මෙම ගීතයට පද තවම නැත.</Text>}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  content: { padding: 20, paddingBottom: 32 },
  back: { minHeight: 42, color: c.lightBlue, fontSize: 14, fontWeight: '700', textAlignVertical: 'center' },
  hero: { alignItems: 'center', paddingTop: 22, paddingBottom: 26 },
  artwork: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center', backgroundColor: c.cardSecondary, borderRadius: 12, borderWidth: 1, borderColor: c.border },
  artworkMark: { color: c.lightBlue, fontSize: 42, fontWeight: '900' },
  title: { color: c.text, fontSize: 23, lineHeight: 30, textAlign: 'center', fontWeight: '900', marginTop: 17 },
  artist: { color: c.secondaryText, fontSize: 14, marginTop: 5 },
  source: { color: c.lightBlue, fontSize: 11, marginTop: 9 },
  notice: { backgroundColor: c.card, borderLeftWidth: 3, borderLeftColor: c.lightBlue, padding: 14, marginBottom: 23 },
  noticeTitle: { color: c.text, fontSize: 13, fontWeight: '800' },
  noticeText: { color: c.secondaryText, fontSize: 12, lineHeight: 19, marginTop: 5 },
  sectionTitle: { color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 8 },
  lyricRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border },
  lineNumber: { width: 34, color: c.lightBlue, fontSize: 11, fontWeight: '800', paddingTop: 3 },
  lyric: { flex: 1, color: c.text, fontSize: 17, lineHeight: 29 },
  openMark: { color: c.lightBlue, fontSize: 25, marginLeft: 8 },
  state: { marginTop: 50 },
  stateText: { color: c.secondaryText, textAlign: 'center', lineHeight: 22, marginTop: 30 },
});