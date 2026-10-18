import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import PrimaryTabBar from '../components/PrimaryTabBar';
import { AuthContext } from '../context/AuthContext';
import { getLearnerProgress } from '../services/learnerProgressService';
import { lyricsTheme } from '../theme/lyricsTheme';

const c = lyricsTheme.colors;

export default function LearningProgressScreen({ navigation }) {
  const { user } = React.useContext(AuthContext);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getLearnerProgress(user?.uid)
      .then((data) => { if (mounted) setProgress(data); })
      .catch(() => { if (mounted) setError('ප්‍රගති තොරතුරු ලබාගත නොහැකි විය.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user?.uid]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={c.background} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>YOUR LEARNING</Text>
        <Text style={styles.title}>Learning progress</Text>
        {loading ? <ActivityIndicator color={c.lightBlue} style={styles.state} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {progress?.latestAssessment ? (
          <View style={styles.summary}>
            <Text style={styles.label}>Latest provisional level</Text>
            <Text style={styles.level}>{progress.latestAssessment.level}</Text>
            <Text style={styles.detail}>{progress.latestAssessment.score} / {progress.latestAssessment.total} assessment answers correct</Text>
            <Text style={styles.detail}>Taken {new Date(progress.latestAssessment.takenAt).toLocaleDateString()}</Text>
          </View>
        ) : null}

        {!loading && !error && !progress?.latestAssessment ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Your learning record starts here</Text>
            <Text style={styles.detail}>Complete the short assessment to save a provisional starting level.</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.metricRow}><Text style={styles.metricName}>Completed songs</Text><Text style={styles.metricValue}>Not tracked yet</Text></View>
          <View style={styles.metricRow}><Text style={styles.metricName}>Vocabulary reviewed</Text><Text style={styles.metricValue}>Not tracked yet</Text></View>
        </View>

        {progress?.assessmentHistory?.length > 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Previous assessments</Text>
            {progress.assessmentHistory.slice(1).map((item, index) => (
              <View key={`${item.takenAt}-${index}`} style={styles.historyRow}>
                <Text style={styles.metricName}>{new Date(item.takenAt).toLocaleDateString()}</Text>
                <Text style={styles.metricValue}>{item.level} · {item.score}/{item.total}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next steps</Text>
          <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('LearnerAssessment')} accessibilityRole="button">
            <Text style={styles.actionTitle}>Take or retake assessment</Text><Text style={styles.actionMark}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('SongLibrary')} accessibilityRole="button">
            <Text style={styles.actionTitle}>Explore the song library</Text><Text style={styles.actionMark}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <PrimaryTabBar navigation={navigation} activeRoute="LearningProgress" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  content: { padding: 20, paddingBottom: 27 },
  kicker: { color: c.lightBlue, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginTop: 12 },
  title: { color: c.text, fontSize: 27, fontWeight: '900', marginTop: 7, marginBottom: 20 },
  summary: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 9, padding: 17 },
  label: { color: c.secondaryText, fontSize: 12 },
  level: { color: c.lightBlue, fontSize: 25, fontWeight: '900', marginTop: 5 },
  detail: { color: c.secondaryText, fontSize: 12, lineHeight: 19, marginTop: 6 },
  empty: { paddingVertical: 22, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border },
  emptyTitle: { color: c.text, fontSize: 16, fontWeight: '800' },
  section: { marginTop: 25 },
  sectionTitle: { color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 9 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 42, borderTopWidth: 1, borderTopColor: c.border },
  metricName: { color: c.secondaryText, fontSize: 12, flex: 1 },
  metricValue: { color: c.text, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 40, borderTopWidth: 1, borderTopColor: c.border },
  action: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, borderTopWidth: 1, borderTopColor: c.border },
  actionTitle: { color: c.lightBlue, fontSize: 13, fontWeight: '700' },
  actionMark: { color: c.lightBlue, fontSize: 24 },
  state: { marginVertical: 28 },
  error: { color: c.error, fontSize: 13, marginVertical: 20 },
});