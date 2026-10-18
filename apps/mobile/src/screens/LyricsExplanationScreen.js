import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { getLearnerProgress } from '../services/learnerProgressService';
import { generateSinhalaExplanation } from '../services/sinhalaExplanationService';
import { AuthContext } from '../context/AuthContext';
import { lyricsTheme } from '../theme/lyricsTheme';

const c = lyricsTheme.colors;

export default function LyricsExplanationScreen({ navigation, route }) {
  const { user } = React.useContext(AuthContext);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadExplanation() {
      let level = 'Beginner';
      try {
        const progress = await getLearnerProgress(user?.uid);
        level = progress.latestAssessment?.level || level;
      } catch {
        // Keep the provisional beginner presentation when no assessment is stored.
      }
      try {
        const result = await generateSinhalaExplanation(route.params?.songId, route.params?.lineId, level);
        if (mounted) setExplanation(result);
      } catch (requestError) {
        if (mounted) setError(requestError.message || 'මෙම පදයට පැහැදිලි කිරීම ලබාගත නොහැක.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadExplanation();
    return () => { mounted = false; };
  }, [route.params?.songId, route.params?.lineId, user?.uid]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={c.background} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.back}>‹  ආපසු</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>පදයක අර්ථය</Text>
        <Text style={styles.title}>සිංහලෙන් තේරුම් ගනිමු</Text>
        {loading ? <ActivityIndicator color={c.lightBlue} style={styles.state} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {explanation ? (
          <>
            <View style={styles.panel}>
              <Text style={styles.label}>මුල් පදය</Text>
              <Text style={styles.original}>{explanation.original}</Text>
            </View>
            <View style={styles.panel}>
              <Text style={styles.label}>සරල පැහැදිලි කිරීම</Text>
              <Text style={styles.body}>{explanation.simple}</Text>
              <Text style={styles.level}>තාවකාලික මට්ටම: {{ Beginner: 'මූලික', Intermediate: 'මධ්‍යම', Advanced: 'උසස්' }[explanation.level]}</Text>
            </View>
            <View style={styles.panel}>
              <Text style={styles.label}>අමාරු වචන</Text>
              {explanation.words.length ? explanation.words.map((word) => (
                <View key={word.term} style={styles.wordRow}>
                  <Text style={styles.word}>{word.term}</Text>
                  <Text style={styles.body}>{word.meaning}</Text>
                </View>
              )) : <Text style={styles.body}>විශේෂ වචන හඳුනාගෙන නැත.</Text>}
            </View>
            {explanation.figurative ? (
              <View style={styles.panel}>
                <Text style={styles.label}>රූපක අදහස</Text>
                <Text style={styles.body}>{explanation.figurative}</Text>
              </View>
            ) : null}
            <View style={styles.panel}>
              <Text style={styles.label}>සන්දර්භය</Text>
              <Text style={styles.body}>{explanation.context}</Text>
            </View>
            <Text style={styles.notice}>කෘතිම පුහුණු උදාහරණයක් · පුහුණු මොඩලයක ප්‍රතිදානයක් නොවේ</Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  content: { padding: 20, paddingBottom: 34 },
  back: { minHeight: 42, color: c.lightBlue, fontSize: 14, fontWeight: '700', textAlignVertical: 'center' },
  kicker: { color: c.lightBlue, fontSize: 11, fontWeight: '800', marginTop: 16 },
  title: { color: c.text, fontSize: 25, lineHeight: 33, fontWeight: '900', marginTop: 5, marginBottom: 18 },
  panel: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 9, padding: 15, marginBottom: 11 },
  label: { color: c.lightBlue, fontSize: 12, fontWeight: '800', marginBottom: 9 },
  original: { color: c.text, fontSize: 19, lineHeight: 32, fontWeight: '700' },
  body: { color: c.text, fontSize: 15, lineHeight: 25 },
  level: { color: c.secondaryText, fontSize: 11, marginTop: 11 },
  wordRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.border },
  word: { color: c.text, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  notice: { color: c.secondaryText, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 9 },
  state: { marginVertical: 38 },
  error: { color: c.error, fontSize: 14, lineHeight: 22, textAlign: 'center', marginVertical: 30 },
});