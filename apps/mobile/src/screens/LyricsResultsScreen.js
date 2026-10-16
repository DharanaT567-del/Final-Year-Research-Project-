import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLyricsApiError, getLyricsJob } from '../api/lyricsApi';
import { lyricsTheme } from '../theme/lyricsTheme';

const c = lyricsTheme.colors;

const demoResult = {
  lines: [
    {
      id: 'demo-1',
      original: 'හිරු එළිය වැටෙන විට මගේ හිතට අලුත් බලාපොරොත්තුවක් දැනේ.',
      simplified: 'ඉර එළිය වැටෙන විට මට අලුත් බලාපොරොත්තුවක් දැනෙනවා.',
      translations: {
        English: 'When sunlight falls, I feel a new hope.',
        Tamil: 'சூரிய ஒளி படும்போது எனக்கு புதிய நம்பிக்கை ஏற்படுகிறது.',
      },
      startSeconds: 0,
    },
    {
      id: 'demo-2',
      original: 'නිහඬ රාත්‍රියේ සඳ මගේ සිහිනවලට මඟ පෙන්වයි.',
      simplified: 'නිශ්ශබ්ද රාත්‍රියේ සඳ මගේ සිහිනවලට මඟ පෙන්වනවා.',
      translations: {
        English: 'In the quiet night, the moon guides my dreams.',
        Tamil: 'அமைதியான இரவில் நிலவு என் கனவுகளுக்கு வழிகாட்டுகிறது.',
      },
      startSeconds: 4.8,
    },
    {
      id: 'demo-3',
      original: 'කාලය ගලා ගියත් අපේ මිතුදම කිසිදා මැකී නොයයි.',
      simplified: 'කාලය ගෙවුණත් අපේ යාළුකම නැති වෙන්නේ නැහැ.',
      translations: {
        English: 'Even as time passes, our friendship never disappears.',
        Tamil: 'காலம் சென்றாலும் எங்கள் நட்பு மறைந்து போகாது.',
      },
      startSeconds: 9.3,
    },
  ],
  vocabulary: [
    { lineId: 'demo-1', term: 'බලාපොරොත්තුව', meaning: 'Hope', explanation: 'යමක් සිදුවේ යැයි ඇති සිතුවිල්ල — a feeling that something good may happen.' },
    { lineId: 'demo-2', term: 'නිහඬ', meaning: 'Quiet / silent', explanation: 'ශබ්දයක් නැති හෝ ඉතා අඩු තත්ත්වය.' },
    { lineId: 'demo-3', term: 'මිතුදම', meaning: 'Friendship', explanation: 'මිතුරන් අතර ඇති සමීප සම්බන්ධය.' },
  ],
};

export default function LyricsResultsScreen({ navigation, route }) {
  const isDemo = route.params?.demo === true;
  const jobId = route.params?.jobId;
  const languages = route.params?.targetLanguages || ['English'];
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0] || 'English');
  const [job, setJob] = useState(isDemo ? { status: 'COMPLETED', progress: 100, result: demoResult } : null);
  const [pollError, setPollError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const audioFileName = route.params?.audioFileName;

  useEffect(() => {
    if (isDemo || !jobId) return undefined;
    let cancelled = false;
    let timer;
    let errors = 0;
    const poll = async () => {
      try {
        const response = await getLyricsJob(jobId);
        if (cancelled) return;
        errors = 0;
        setJob(response);
        setPollError('');
        if (response.status === 'QUEUED' || response.status === 'PROCESSING') timer = setTimeout(poll, 2500);
      } catch (e) {
        if (cancelled) return;
        errors += 1;
        setPollError(getLyricsApiError(e));
        if (errors < 5) timer = setTimeout(poll, Math.min(10000, errors * 2000));
      }
    };
    poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [jobId, retryCount, isDemo]);

  const processing = !isDemo && Boolean(jobId) && !pollError
    && (!job || job.status === 'QUEUED' || job.status === 'PROCESSING');
  const result = job?.status === 'COMPLETED' ? job.result : null;
  const lineNumbers = new Map((result?.lines || []).map((line, i) => [line.id, i + 1]));

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={c.background} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={s.backText}>‹  Back</Text>
        </TouchableOpacity>

        <Text style={s.kicker}>NAADA  /  LYRICS INSIGHT</Text>
        <Text style={s.title}>{audioFileName || 'Your lyrics'}</Text>
        <View style={s.statusRow}>
          {processing ? <ActivityIndicator size="small" color={c.lightBlue} /> : <View style={[s.dot, result && s.dotDone]} />}
          <Text style={s.status}>{isDemo ? 'Sample preview · demo mode' : processing ? (job?.status === 'QUEUED' ? 'Waiting in queue' : 'Processing lyrics') : result ? 'Processing complete' : 'Processing issue'}</Text>
          {result ? <View style={s.completeBadge}><Text style={s.completeText}>READY</Text></View> : null}
        </View>

        {processing ? (
          <View style={s.panel}>
            <Text style={s.panelTitle}>Preparing your lyrics</Text>
            <Text style={s.muted}>Transcribing, simplifying and preparing vocabulary notes.</Text>
            <View style={s.track}><View style={[s.fill, { width: `${Math.max(job?.progress || 5, 5)}%` }]} /></View>
            <Text style={s.mutedSmall}>{job?.progress || 0}% complete</Text>
          </View>
        ) : null}

        {!jobId && !isDemo ? (
          <View style={s.panel}>
            <Text style={s.panelTitle}>No processing job was provided</Text>
            <Text style={s.muted}>Try the sample preview or select a song first.</Text>
            <ActionButton label="Choose a song" onPress={() => navigation.navigate('SongProcessing')} />
          </View>
        ) : null}

        {pollError ? (
          <View style={s.panel}>
            <Text style={s.panelTitle}>Could not refresh this job</Text>
            <Text style={s.muted}>{pollError}</Text>
            <ActionButton label="Retry status check" onPress={() => { setPollError(''); setRetryCount((x) => x + 1); }} />
          </View>
        ) : null}

        {job?.status === 'FAILED' ? (
          <View style={s.panel}>
            <Text style={s.panelTitle}>Lyrics could not be processed</Text>
            <Text style={s.muted}>{job.error || 'The service did not complete this job.'}</Text>
            <ActionButton label="Try another song" onPress={() => navigation.navigate('SongProcessing')} />
          </View>
        ) : null}

        {result ? (
          <>
            <View style={s.summaryCard}>
              <View style={s.summaryTop}>
                <View style={s.summaryIcon}><Text style={s.summaryIconText}>✦</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.summaryTitle}>Meaning, made clearer</Text>
                  <Text style={s.muted}>Compare the original with a simpler version.</Text>
                </View>
              </View>
              <View style={s.statsRow}>
                <View style={s.stat}><Text style={s.statValue}>{result.lines.length}</Text><Text style={s.statLabel}>LINES</Text></View>
                <View style={s.statDivider} />
                <View style={s.stat}><Text style={s.statValue}>{result.vocabulary.length}</Text><Text style={s.statLabel}>WORD NOTES</Text></View>
                <View style={s.statDivider} />
                <View style={s.stat}><Text style={s.statValue}>{languages.length}</Text><Text style={s.statLabel}>LANGUAGES</Text></View>
              </View>
            </View>

            <View style={s.sectionHeader}>
              <View><Text style={s.sectionTitle}>Lyrics, line by line</Text><Text style={s.muted}>Original · simplified · translation</Text></View>
              <View style={s.sectionCount}><Text style={s.sectionCountText}>{result.lines.length} lines</Text></View>
            </View>

            {languages.length > 1 ? (
              <View style={s.languageSelector}>
                {languages.map((lang) => {
                  const selected = selectedLanguage === lang;
                  return <TouchableOpacity key={lang} onPress={() => setSelectedLanguage(lang)} style={[s.languageTab, selected && s.languageTabSelected]} accessibilityRole="tab" accessibilityState={{ selected }}>
                    <Text style={[s.languageTabText, selected && s.languageTabTextSelected]}>{lang}</Text>
                  </TouchableOpacity>;
                })}
              </View>
            ) : null}

            {result.lines.map((line, index) => (
              <View key={line.id} style={s.lineCard}>
                <View style={s.lineTop}><Text style={s.lineNumber}>LINE {String(index + 1).padStart(2, '0')}</Text>{line.startSeconds != null ? <Text style={s.timestamp}>◷  {line.startSeconds.toFixed(1)}s</Text> : null}</View>
                <Text style={s.lineLabel}>ORIGINAL SINHALA</Text>
                <Text style={s.original}>{line.original}</Text>
                <View style={s.divider} />
                <View style={s.simplifiedLabelRow}><Text style={s.lineLabel}>SIMPLIFIED</Text><View style={s.easyBadge}><Text style={s.easyBadgeText}>EASIER TO READ</Text></View></View>
                <Text style={s.simplified}>{line.simplified}</Text>
                {line.translations?.[selectedLanguage] ? (
                  <View style={s.translationBox}><Text style={s.lineLabel}>{selectedLanguage.toUpperCase()} MEANING</Text><Text style={s.translation}>{line.translations[selectedLanguage]}</Text></View>
                ) : null}
              </View>
            ))}

            <View style={s.sectionHeader}><View><Text style={s.sectionTitle}>Words & phrases</Text><Text style={s.muted}>Helpful vocabulary from the lyrics</Text></View></View>
            {result.vocabulary.length ? result.vocabulary.map((item, index) => (
              <View key={`${item.lineId}-${item.term}-${index}`} style={s.wordCard}>
                <View style={s.wordGlyph}><Text style={s.wordGlyphText}>Aa</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.wordTerm}>{item.term}</Text>
                  <Text style={s.wordMeaning}>{item.meaning}</Text>
                  <Text style={s.wordExplanation}>{item.explanation}</Text>
                  <Text style={s.wordSource}>FROM LINE {lineNumbers.get(item.lineId) || '—'}</Text>
                </View>
              </View>
            )) : <Text style={s.muted}>No vocabulary items were identified.</Text>}

            {isDemo ? <View style={s.demoNotice}><Text style={s.demoNoticeTitle}>REHEARSAL PREVIEW</Text><Text style={s.muted}>This screen uses synthetic sample text. Results are illustrative and were not generated by your trained model or live API.</Text></View> : null}
            <TouchableOpacity style={s.bottomButton} onPress={() => navigation.navigate('SongProcessing')} accessibilityRole="button"><Text style={s.bottomButtonText}>Process another song  →</Text></TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ label, onPress }) {
  return <TouchableOpacity style={s.actionButton} onPress={onPress} accessibilityRole="button"><Text style={s.actionButtonText}>{label}</Text></TouchableOpacity>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  back: { minHeight: 42, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { color: c.lightBlue, fontSize: 15, fontWeight: '700' },
  kicker: { color: c.lightBlue, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginTop: 18 },
  title: { color: c.text, fontSize: 27, lineHeight: 34, fontWeight: '900', marginTop: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 18 },
  dot: { width: 8, height: 8, borderRadius: 5, backgroundColor: c.error },
  dotDone: { backgroundColor: c.success },
  status: { color: c.secondaryText, fontSize: 12, flex: 1 },
  completeBadge: { backgroundColor: '#173B39', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 4 },
  completeText: { color: '#86EFAC', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  panel: { backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: 15, padding: 17, marginBottom: 14 },
  panelTitle: { color: c.text, fontSize: 17, fontWeight: '800' },
  muted: { color: c.secondaryText, fontSize: 13, lineHeight: 20, marginTop: 5 },
  mutedSmall: { color: c.secondaryText, fontSize: 11, marginTop: 8 },
  track: { height: 7, borderRadius: 5, backgroundColor: c.background, overflow: 'hidden', marginTop: 18 },
  fill: { height: '100%', backgroundColor: c.primary, borderRadius: 5 },
  actionButton: { alignSelf: 'flex-start', marginTop: 14, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 9, borderWidth: 1, borderColor: c.primary, backgroundColor: c.cardSecondary },
  actionButtonText: { color: c.lightBlue, fontWeight: '800', fontSize: 13 },
  summaryCard: { backgroundColor: c.cardSecondary, borderColor: c.border, borderWidth: 1, borderRadius: 17, padding: 17, marginBottom: 24 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
  summaryIconText: { color: c.lightBlue, fontSize: 24 },
  summaryTitle: { color: c.text, fontSize: 17, fontWeight: '800' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, paddingTop: 15, borderTopColor: c.border, borderTopWidth: 1 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { color: c.text, fontSize: 21, fontWeight: '900' },
  statLabel: { color: c.secondaryText, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 5 },
  statDivider: { width: 1, backgroundColor: c.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 2 },
  sectionTitle: { color: c.text, fontSize: 19, fontWeight: '900' },
  sectionCount: { backgroundColor: c.cardSecondary, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  sectionCountText: { color: c.lightBlue, fontSize: 10, fontWeight: '800' },
  languageSelector: { flexDirection: 'row', padding: 4, borderRadius: 11, backgroundColor: c.card, borderColor: c.border, borderWidth: 1, marginBottom: 12 },
  languageTab: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  languageTabSelected: { backgroundColor: c.primary },
  languageTabText: { color: c.secondaryText, fontSize: 12, fontWeight: '700' },
  languageTabTextSelected: { color: '#FFFFFF' },
  lineCard: { backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: 15, padding: 15, marginBottom: 12 },
  lineTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineNumber: { color: c.lightBlue, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  timestamp: { color: c.secondaryText, fontSize: 10 },
  lineLabel: { color: c.secondaryText, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  original: { color: c.text, fontSize: 16, lineHeight: 27 },
  divider: { height: 1, backgroundColor: c.border, marginTop: 15 },
  simplifiedLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  easyBadge: { backgroundColor: '#173B39', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 4, marginTop: 12 },
  easyBadgeText: { color: '#86EFAC', fontSize: 8, fontWeight: '900' },
  simplified: { color: '#D9EAFE', fontSize: 16, lineHeight: 27 },
  translationBox: { backgroundColor: c.background, borderRadius: 10, padding: 11, marginTop: 14 },
  translation: { color: c.text, fontSize: 14, lineHeight: 22 },
  wordCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: 13, padding: 14, marginBottom: 9 },
  wordGlyph: { width: 37, height: 37, borderRadius: 10, backgroundColor: c.cardSecondary, alignItems: 'center', justifyContent: 'center' },
  wordGlyphText: { color: c.lightBlue, fontSize: 13, fontWeight: '900' },
  wordTerm: { color: c.lightBlue, fontSize: 16, fontWeight: '900' },
  wordMeaning: { color: c.text, fontSize: 13, fontWeight: '700', marginTop: 4 },
  wordExplanation: { color: c.secondaryText, fontSize: 12, lineHeight: 19, marginTop: 6 },
  wordSource: { color: c.secondaryText, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginTop: 8 },
  demoNotice: { backgroundColor: c.cardSecondary, borderColor: c.border, borderWidth: 1, borderRadius: 12, padding: 13, marginTop: 12 },
  demoNoticeTitle: { color: c.lightBlue, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  bottomButton: { backgroundColor: c.primary, borderRadius: 12, minHeight: 51, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  bottomButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});