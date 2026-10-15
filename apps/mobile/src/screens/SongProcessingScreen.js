import React, { useState } from 'react';
import {
  ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import { createLyricsJob, getLyricsApiError } from '../api/lyricsApi';
import { lyricsTheme } from '../theme/lyricsTheme';

const c = lyricsTheme.colors;

function fileSize(size) {
  if (typeof size !== 'number') return 'Size unavailable';
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1048576).toFixed(1)} MB`;
}

export default function SongProcessingScreen({ navigation }) {
  const [file, setFile] = useState(null);
  const [languages, setLanguages] = useState(['English']);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const chooseFile = async () => {
    setError('');
    setPicking(true);
    try {
      const [picked] = await pick({ type: [types.audio], allowMultiSelection: false });
      setFile(picked);
    } catch (e) {
      if (!(isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED)) {
        setError('Could not select that file. Please try another audio file.');
      }
    } finally {
      setPicking(false);
    }
  };

  const toggleLanguage = (language) => {
    setLanguages((current) => current.includes(language)
      ? (current.length > 1 ? current.filter((x) => x !== language) : current)
      : [...current, language]);
  };

  const runDemo = () => {
    setError('');
    navigation.navigate('LyricsResults', {
      demo: true,
      audioFileName: 'Sinhala lyric sample · rehearsal',
      targetLanguages: languages,
    });
  };

  const processSong = async () => {
    if (!file) {
      setError('Choose an audio file, or use the sample demo below.');
      return;
    }
    if (!file.uri && !file.fileCopyUri) {
      setError('The selected file is no longer available. Please choose it again.');
      return;
    }
    setError('');
    setBusy(true);
    setProgress(0);
    try {
      const job = await createLyricsJob(file, languages, (event) => {
        if (event.total > 0) setProgress(Math.min(100, Math.round(event.loaded / event.total * 100)));
      });
      navigation.navigate('LyricsResults', {
        jobId: job.jobId, audioFileName: file.name, targetLanguages: languages,
      });
    } catch (e) {
      setError(getLyricsApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={c.background} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={s.backText}>‹  Back</Text>
        </TouchableOpacity>

        <View style={s.hero}>
          <Text style={s.kicker}>NAADA  /  AI LYRICS LAB</Text>
          <Text style={s.title}>Feel the words.{ '\n' }Understand the song.</Text>
          <Text style={s.subtitle}>Explore Sinhala lyrics with clearer wording, translations and vocabulary notes.</Text>
          <View style={s.pills}>
            <Text style={s.pill}>01  TRANSCRIBE</Text>
            <Text style={s.pill}>02  SIMPLIFY</Text>
            <Text style={s.pill}>03  UNDERSTAND</Text>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.cardTop}>
            <View style={s.iconTile}><Text style={s.music}>♫</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Add your song</Text>
              <Text style={s.muted}>Choose an audio file from your device</Text>
            </View>
            <View style={s.step}><Text style={s.stepText}>01</Text></View>
          </View>

          <TouchableOpacity style={s.outlineButton} onPress={chooseFile} disabled={picking} accessibilityRole="button">
            {picking ? <ActivityIndicator color={c.lightBlue} /> : <Text style={s.outlineText}>{file ? 'Choose a different file' : '＋  Choose audio file'}</Text>}
          </TouchableOpacity>

          {file ? (
            <View style={s.fileRow}>
              <View style={s.fileGlyph}><Text style={s.fileGlyphText}>♫</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.fileName} numberOfLines={2}>{file.name || 'Selected audio'}</Text>
                <Text style={s.mutedSmall}>{fileSize(file.size)}{file.type ? ` · ${file.type}` : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => setFile(null)} accessibilityRole="button" accessibilityLabel="Remove file">
                <Text style={s.remove}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.dropHint}>
              <Text style={s.dropSymbol}>⇧</Text>
              <Text style={s.dropText}>MP3, WAV, M4A or supported audio · up to 25 MB</Text>
            </View>
          )}
        </View>

        <View style={s.card}>
          <View style={s.cardTop}>
            <View style={s.iconTile}><Text style={s.music}>文</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Learning languages</Text>
              <Text style={s.muted}>Choose translation outputs</Text>
            </View>
            <View style={s.step}><Text style={s.stepText}>02</Text></View>
          </View>
          <Text style={s.fieldLabel}>TRANSLATE LYRICS INTO</Text>
          <View style={s.languageRow}>
            {['English', 'Tamil'].map((lang) => {
              const selected = languages.includes(lang);
              return (
                <TouchableOpacity key={lang} onPress={() => toggleLanguage(lang)}
                  style={[s.language, selected && s.languageSelected]}
                  accessibilityRole="checkbox" accessibilityState={{ checked: selected }}>
                  <Text style={[s.languageText, selected && s.languageTextSelected]}>{selected ? '✓  ' : '+  '}{lang}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={s.mutedSmall}>At least one language must remain selected.</Text>
        </View>

        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        <TouchableOpacity style={[s.primaryButton, (!file || busy) && s.primaryDim]} onPress={processSong} disabled={!file || busy} accessibilityRole="button">
          {busy ? <><ActivityIndicator color="#FFFFFF" /><Text style={s.primaryText}>Uploading {progress}%</Text></> : <><Text style={s.primaryText}>Process my song</Text><Text style={s.arrow}>→</Text></>}
        </TouchableOpacity>

        <View style={s.demoCard}>
          <View style={s.demoBadge}><Text style={s.demoBadgeText}>DEMO MODE</Text></View>
          <Text style={s.demoTitle}>Not ready to upload?</Text>
          <Text style={s.muted}>Preview the results UI using original sample Sinhala text. This works without Firebase, API keys or a running backend.</Text>
          <TouchableOpacity style={s.demoButton} onPress={runDemo} accessibilityRole="button">
            <Text style={s.demoButtonText}>Try sample lyrics  ↗</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>Your audio should be yours to use. Demo text is synthetic and is not a quotation from a published song.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 20, paddingBottom: 34 },
  back: { minHeight: 42, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { color: c.lightBlue, fontSize: 15, fontWeight: '700' },
  hero: { paddingTop: 18, paddingBottom: 24 },
  kicker: { color: c.lightBlue, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: c.text, fontSize: 32, lineHeight: 38, fontWeight: '900', marginTop: 12 },
  subtitle: { color: c.secondaryText, fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 330 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 18 },
  pill: { overflow: 'hidden', color: c.lightBlue, backgroundColor: c.cardSecondary, borderColor: c.border, borderWidth: 1, borderRadius: 7, paddingVertical: 7, paddingHorizontal: 9, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  card: { backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: 18, padding: 17, marginBottom: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconTile: { width: 46, height: 46, borderRadius: 13, backgroundColor: c.cardSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  music: { color: c.lightBlue, fontSize: 23, fontWeight: '800' },
  cardTitle: { color: c.text, fontSize: 17, fontWeight: '800' },
  muted: { color: c.secondaryText, fontSize: 13, lineHeight: 19, marginTop: 4 },
  mutedSmall: { color: c.secondaryText, fontSize: 11, lineHeight: 16, marginTop: 6 },
  step: { backgroundColor: c.background, borderColor: c.border, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7 },
  stepText: { color: c.secondaryText, fontSize: 10, fontWeight: '800' },
  outlineButton: { minHeight: 49, alignItems: 'center', justifyContent: 'center', borderColor: c.primary, borderWidth: 1, borderRadius: 11, backgroundColor: c.cardSecondary },
  outlineText: { color: c.lightBlue, fontWeight: '800', fontSize: 14 },
  dropHint: { marginTop: 12, borderWidth: 1, borderColor: c.border, borderStyle: 'dashed', borderRadius: 11, alignItems: 'center', padding: 13 },
  dropSymbol: { color: c.lightBlue, fontSize: 20, fontWeight: '800' },
  dropText: { color: c.secondaryText, textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 4 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: c.cardSecondary, borderRadius: 11, padding: 12 },
  fileGlyph: { width: 34, height: 34, borderRadius: 9, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
  fileGlyphText: { color: c.lightBlue, fontSize: 20 },
  fileName: { color: c.text, fontSize: 13, fontWeight: '700' },
  remove: { color: c.error, fontSize: 25, paddingHorizontal: 5 },
  fieldLabel: { color: c.secondaryText, fontSize: 10, letterSpacing: 1.2, fontWeight: '800', marginBottom: 10 },
  languageRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  language: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingVertical: 13, alignItems: 'center', backgroundColor: c.background },
  languageSelected: { borderColor: c.primary, backgroundColor: '#143766' },
  languageText: { color: c.secondaryText, fontSize: 14, fontWeight: '700' },
  languageTextSelected: { color: '#FFFFFF' },
  errorBox: { backgroundColor: '#2A1A24', borderColor: c.error, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: c.error, fontSize: 13, lineHeight: 19 },
  primaryButton: { minHeight: 55, borderRadius: 13, backgroundColor: c.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 2 },
  primaryDim: { opacity: 0.48 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  arrow: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  demoCard: { marginTop: 17, backgroundColor: c.cardSecondary, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 17 },
  demoBadge: { alignSelf: 'flex-start', borderRadius: 5, backgroundColor: '#173B39', paddingHorizontal: 8, paddingVertical: 5 },
  demoBadgeText: { color: '#86EFAC', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  demoTitle: { color: c.text, fontSize: 17, fontWeight: '800', marginTop: 11 },
  demoButton: { alignSelf: 'flex-start', marginTop: 14, backgroundColor: c.background, borderRadius: 10, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 11 },
  demoButtonText: { color: c.lightBlue, fontSize: 13, fontWeight: '800' },
  footer: { color: c.secondaryText, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 18, paddingHorizontal: 8 },
});