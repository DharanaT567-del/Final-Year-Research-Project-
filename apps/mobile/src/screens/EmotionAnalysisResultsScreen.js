import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  StatusBar
} from 'react-native';
import { DEMO_SONGS, SINHALA_LABELS } from '../services/emotionMockData';

export default function EmotionAnalysisResultsScreen({ route, navigation }) {
  const songId = route?.params?.songId || 'song-001';
  const song = DEMO_SONGS.find(s => s.id === songId) || DEMO_SONGS[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('emotions'); // 'emotions' | 'simplified' | 'lyrics'
  const [tutorModalVisible, setTutorModalVisible] = useState(false);
  const [selectedTutorQ, setSelectedTutorQ] = useState(null);

  const emotionsList = Object.keys(song.emotions).map(key => ({
    key,
    ...song.emotions[key]
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Top Header - Matches DashboardSS.png */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>‹ ආපසු</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{SINHALA_LABELS.appName}</Text>
        <TouchableOpacity style={styles.bellBtn}>
          <Text style={styles.bellIcon}>🔔</Text>
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Song Hero Profile Section - Matches DashboardSS Avatar & Glow */}
        <View style={styles.songProfileSection}>
          <View style={styles.avatarGlowContainer}>
            <Image source={{ uri: song.coverImage }} style={styles.avatarImage} />
            <View style={styles.avatarGlow} />
            <TouchableOpacity
              style={styles.floatingPlayBtn}
              onPress={() => setIsPlaying(!isPlaying)}
            >
              <Text style={styles.floatingPlayIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.songTitleMain}>{song.title}</Text>
          <Text style={styles.songArtistMain}>{song.artist}</Text>

          {/* Analysis Status Badge */}
          <View style={styles.statusBadge}>
            <Text style={styles.checkmarkIcon}>✓</Text>
            <Text style={styles.statusBadgeText}>විශ්ලේෂණය සාර්ථකයි (100% ප්‍රතිශත)</Text>
          </View>

          {/* Audio Progress Bar */}
          <View style={styles.audioControlsRow}>
            <Text style={styles.audioTimeText}>{isPlaying ? '02:15' : '01:10'}</Text>
            <View style={styles.audioProgressBarTrack}>
              <View style={[styles.audioProgressBarFill, { width: isPlaying ? '60%' : '35%' }]} />
            </View>
            <Text style={styles.audioTimeText}>{song.duration}</Text>
          </View>
        </View>

        {/* Demo Disclaimer Box */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>{SINHALA_LABELS.demoDisclaimer}</Text>
        </View>

        {/* 2x2 Stats Summary Grid - Matches DashboardSS.png */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#00e5ff' }]}>35%</Text>
            <Text style={styles.statLabel}>ප්‍රධාන: සන්සුන් බව</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#c074ff' }]}>මධ්‍යම</Text>
            <Text style={styles.statLabel}>ඉගෙනුම් අපහසුතාව</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#ffd166' }]}>100%</Text>
            <Text style={styles.statLabel}>සම්පූර්ණ භාව එකතුව</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#ff66a3' }]}>පද 4ක්</Text>
            <Text style={styles.statLabel}>සරල කළ පදමාලා</Text>
          </View>
        </View>

        {/* Navigation Tabs for Analysis View */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'emotions' && styles.tabButtonActive]}
            onPress={() => setActiveTab('emotions')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'emotions' && styles.tabButtonTextActive]}>
              හැඟීම් 6 ප්‍රතිශත
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'simplified' && styles.tabButtonActive]}
            onPress={() => setActiveTab('simplified')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'simplified' && styles.tabButtonTextActive]}>
              පද සරල කිරීම
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'lyrics' && styles.tabButtonActive]}
            onPress={() => setActiveTab('lyrics')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'lyrics' && styles.tabButtonTextActive]}>
              පද රචනය
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: 6 EMOTIONS BREAKDOWN */}
        {activeTab === 'emotions' && (
          <View style={styles.cardSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitleText}>හැඟීම් ප්‍රතිශත විශ්ලේෂණය</Text>
              <Text style={styles.sumBadge}>එකතුව: 100%</Text>
            </View>
            <Text style={styles.sectionSubtitleText}>
              {song.dominantEmotionSummary}
            </Text>

            {/* List of 6 Emotions */}
            <View style={styles.emotionsContainer}>
              {emotionsList.map((item) => (
                <View key={item.key} style={styles.emotionRow}>
                  <View style={styles.emotionHeader}>
                    <View style={styles.emotionLabelGroup}>
                      <Text style={styles.emotionIcon}>{item.icon}</Text>
                      <Text style={styles.emotionSinhalaName}>{item.label}</Text>
                      <Text style={styles.emotionEnglishName}>({item.english})</Text>
                    </View>
                    <Text style={[styles.emotionPercentageText, { color: item.color }]}>
                      {item.percentage}%
                    </Text>
                  </View>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarColoredFill,
                        {
                          width: `${item.percentage}%`,
                          backgroundColor: item.color
                        }
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Difficulty Guidance Box */}
            <View style={styles.difficultyContainer}>
              <View style={styles.difficultyHeaderRow}>
                <Text style={styles.difficultyTitle}>ඉගෙනුම් අපහසුතා මට්ටම:</Text>
                <View style={styles.difficultyPill}>
                  <Text style={styles.difficultyPillText}>{song.difficulty.level}</Text>
                </View>
              </View>
              <Text style={styles.difficultyExplanation}>
                {song.difficulty.explanation}
              </Text>
            </View>
          </View>
        )}

        {/* TAB 2: SIMPLIFIED LYRICS (NORMALIZATION) */}
        {activeTab === 'simplified' && (
          <View style={styles.cardSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitleText}>පද සරල කිරීම (පැහැදිලි සිංහලට)</Text>
              <Text style={styles.sumBadge}>NLP නියැදිය</Text>
            </View>
            <Text style={styles.sectionSubtitleText}>
              සම්භාව්‍ය හා සංකීර්ණ සිංහල පද පහසුවෙන් අවබෝධ කරගත හැකි සරල සිංහලට හැරවූ ආකාරය:
            </Text>

            {song.simplifiedLyrics.map((item) => (
              <View key={item.lineNo} style={styles.lyricsCompareCard}>
                <View style={styles.lineBadgeRow}>
                  <Text style={styles.lineNumText}>පද පේළිය 0{item.lineNo}</Text>
                </View>

                {/* Original Complex Sinhala */}
                <View style={styles.originalLineBox}>
                  <Text style={styles.lineTagOriginal}>සම්භාව්‍ය පද රචනය:</Text>
                  <Text style={styles.originalLyricsText}>{item.original}</Text>
                </View>

                {/* Arrow */}
                <Text style={styles.arrowIcon}>↓</Text>

                {/* Simplified Clearer Sinhala */}
                <View style={styles.simplifiedLineBox}>
                  <Text style={styles.lineTagSimplified}>සරල හා පැහැදිලි සිංහල:</Text>
                  <Text style={styles.simplifiedLyricsText}>{item.simplified}</Text>
                </View>

                {/* Glossary Chips */}
                {item.glossary && item.glossary.length > 0 && (
                  <View style={styles.glossaryBox}>
                    <Text style={styles.glossaryHeader}>වචන අරුත් (Vocabulary):</Text>
                    <View style={styles.glossaryChipsRow}>
                      {item.glossary.map((vocab, vIdx) => (
                        <View key={vIdx} style={styles.vocabChip}>
                          <Text style={styles.vocabWord}>{vocab.word}</Text>
                          <Text style={styles.vocabMeaning}>: {vocab.meaning}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: FULL READABLE LYRICS */}
        {activeTab === 'lyrics' && (
          <View style={styles.cardSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitleText}>සම්පූර්ණ පද රචනය</Text>
              <Text style={styles.sumBadge}>Unicode Sinhala</Text>
            </View>
            <View style={styles.lyricsPaper}>
              {song.lyricsSample.map((line, lIdx) => (
                <Text key={lIdx} style={styles.lyricsPaperLine}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Prominent Music Tutor CTA Button */}
        <View style={styles.tutorCtaContainer}>
          <TouchableOpacity
            style={styles.tutorCtaBtn}
            onPress={() => setTutorModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.tutorCtaRow}>
              <Text style={styles.tutorCtaIcon}>🤖</Text>
              <View style={styles.tutorCtaTextWrap}>
                <Text style={styles.tutorCtaTitle}>{SINHALA_LABELS.askTutor}</Text>
                <Text style={styles.tutorCtaSubtitle}>
                  රාගය, භාවය සහ පදවල අර්ථය පිළිබඳව AI ගුරුතුමාගෙන් අසන්න
                </Text>
              </View>
              <Text style={styles.tutorCtaArrow}>➔</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Re-analyze Button */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.reanalyzeBtn}
            onPress={() => navigation.navigate('SongSelection')}
          >
            <Text style={styles.reanalyzeBtnText}>⟲  {SINHALA_LABELS.analyzeAnother}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Interactive AI Tutor Modal Dialog */}
      <Modal
        visible={tutorModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTutorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Text style={styles.modalTutorIcon}>🤖</Text>
                <View>
                  <Text style={styles.modalTitle}>{SINHALA_LABELS.tutorTitle}</Text>
                  <Text style={styles.modalSubtitle}>සංගීත ඉගෙනුම් සහායක</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setTutorModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.tutorWelcomeBox}>
                <Text style={styles.tutorWelcomeText}>
                  ආයුබෝවන්! 🙏 මම ඔබේ නාද AI ගුරුතුමා. “{song.title}” ගීතයේ හැඟීම්, තාලය හෝ පදමාලාව ගැන ඔබට ඇති ගැටලු පහතින් තෝරන්න:
                </Text>
              </View>

              {/* Sample Tutor Prompts */}
              <Text style={styles.promptListTitle}>නිතර අසන ප්‍රශ්න:</Text>
              {song.tutorKnowledge.map((item, qIdx) => (
                <TouchableOpacity
                  key={qIdx}
                  style={[
                    styles.tutorPromptBtn,
                    selectedTutorQ === item && styles.tutorPromptBtnActive
                  ]}
                  onPress={() => setSelectedTutorQ(item)}
                >
                  <Text style={styles.tutorPromptText}>❓ {item.question}</Text>
                </TouchableOpacity>
              ))}

              {/* Display Tutor Answer */}
              {selectedTutorQ && (
                <View style={styles.tutorAnswerCard}>
                  <Text style={styles.tutorAnswerBadge}>AI පිළිතුර:</Text>
                  <Text style={styles.tutorAnswerText}>{selectedTutorQ.answer}</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setTutorModalVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>සංවාදය අවසන් කරන්න</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('SongSelection')}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>{SINHALA_LABELS.tabs.home}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navLabel}>{SINHALA_LABELS.tabs.search}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}>
          <Text style={[styles.navIcon, { color: '#00e5ff' }]}>📊</Text>
          <Text style={[styles.navLabel, { color: '#00e5ff' }]}>විශ්ලේෂණ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>{SINHALA_LABELS.tabs.profile}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 18 : 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    color: '#00e5ff',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#d6a3ff',
    letterSpacing: 0.5,
  },
  bellBtn: {
    padding: 6,
    position: 'relative',
  },
  bellIcon: {
    fontSize: 18,
    color: '#ffffff',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00e5ff',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  songProfileSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  avatarGlowContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#c074ff',
  },
  avatarGlow: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1.5,
    borderColor: 'rgba(192, 116, 255, 0.4)',
  },
  floatingPlayBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },
  floatingPlayIcon: {
    fontSize: 12,
    color: '#121212',
    fontWeight: '800',
  },
  songTitleMain: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 12,
    textAlign: 'center',
  },
  songArtistMain: {
    fontSize: 13,
    color: '#a0a0b0',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  checkmarkIcon: {
    color: '#00e5ff',
    fontWeight: '800',
    marginRight: 6,
    fontSize: 12,
  },
  statusBadgeText: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '600',
  },
  audioControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 10,
  },
  audioTimeText: {
    fontSize: 11,
    color: '#888899',
    width: 40,
  },
  audioProgressBarTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#262635',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  audioProgressBarFill: {
    height: '100%',
    backgroundColor: '#00e5ff',
  },
  disclaimerBox: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    padding: 10,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#00e5ff',
    textAlign: 'center',
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1b1b24',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292938',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: '#9e9eb0',
    marginTop: 4,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#191922',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#292938',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#2b2b3a',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8e8e9e',
  },
  tabButtonTextActive: {
    color: '#00e5ff',
    fontWeight: '700',
  },
  cardSection: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#171720',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#252533',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  sumBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00e5ff',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionSubtitleText: {
    fontSize: 12,
    color: '#9e9eb2',
    marginTop: 6,
    lineHeight: 18,
  },
  emotionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  emotionRow: {
    marginBottom: 4,
  },
  emotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  emotionLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emotionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  emotionSinhalaName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  emotionEnglishName: {
    fontSize: 11,
    color: '#777788',
    marginLeft: 4,
  },
  emotionPercentageText: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#262635',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarColoredFill: {
    height: '100%',
    borderRadius: 4,
  },
  difficultyContainer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#282838',
  },
  difficultyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficultyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  difficultyPill: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00e5ff',
  },
  difficultyExplanation: {
    fontSize: 12,
    color: '#9e9eb2',
    marginTop: 8,
    lineHeight: 18,
  },
  lyricsCompareCard: {
    backgroundColor: '#1f1f2b',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2e2e40',
  },
  lineBadgeRow: {
    marginBottom: 6,
  },
  lineNumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00e5ff',
    letterSpacing: 0.5,
  },
  originalLineBox: {
    backgroundColor: '#16161f',
    padding: 10,
    borderRadius: 8,
  },
  lineTagOriginal: {
    fontSize: 10,
    color: '#8e8e9e',
    marginBottom: 2,
  },
  originalLyricsText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  arrowIcon: {
    textAlign: 'center',
    color: '#c074ff',
    fontSize: 16,
    marginVertical: 4,
  },
  simplifiedLineBox: {
    backgroundColor: 'rgba(192, 116, 255, 0.1)',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#c074ff',
  },
  lineTagSimplified: {
    fontSize: 10,
    color: '#d6a3ff',
    marginBottom: 2,
    fontWeight: '600',
  },
  simplifiedLyricsText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    fontWeight: '600',
  },
  glossaryBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#282838',
  },
  glossaryHeader: {
    fontSize: 11,
    color: '#a0a0b0',
    marginBottom: 6,
  },
  glossaryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  vocabChip: {
    flexDirection: 'row',
    backgroundColor: '#29293a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vocabWord: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00e5ff',
  },
  vocabMeaning: {
    fontSize: 11,
    color: '#cccccc',
  },
  lyricsPaper: {
    backgroundColor: '#1a1a24',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  lyricsPaperLine: {
    fontSize: 14,
    color: '#e0e0ee',
    lineHeight: 26,
    textAlign: 'center',
  },
  tutorCtaContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  tutorCtaBtn: {
    backgroundColor: 'linear-gradient(135deg, #7b2cbf 0%, #3c096c 100%)',
    backgroundColor: '#4a154b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#c074ff',
  },
  tutorCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tutorCtaIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  tutorCtaTextWrap: {
    flex: 1,
  },
  tutorCtaTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  tutorCtaSubtitle: {
    fontSize: 11,
    color: '#d6a3ff',
    marginTop: 2,
    lineHeight: 16,
  },
  tutorCtaArrow: {
    fontSize: 18,
    color: '#00e5ff',
    fontWeight: '800',
    marginLeft: 8,
  },
  actionRow: {
    paddingHorizontal: 20,
    marginTop: 14,
  },
  reanalyzeBtn: {
    backgroundColor: '#1d1d28',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#343448',
  },
  reanalyzeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00e5ff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#181822',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    borderTopWidth: 2,
    borderTopColor: '#c074ff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#282838',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTutorIcon: {
    fontSize: 26,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#00e5ff',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#a0a0b0',
  },
  modalBody: {
    marginTop: 12,
  },
  tutorWelcomeBox: {
    backgroundColor: '#20202e',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  tutorWelcomeText: {
    fontSize: 13,
    color: '#e0e0f0',
    lineHeight: 20,
  },
  promptListTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9e9eb2',
    marginBottom: 8,
  },
  tutorPromptBtn: {
    backgroundColor: '#222232',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#313146',
  },
  tutorPromptBtnActive: {
    borderColor: '#00e5ff',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  tutorPromptText: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
  },
  tutorAnswerCard: {
    backgroundColor: '#281c34',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c074ff',
    marginTop: 10,
  },
  tutorAnswerBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d6a3ff',
    marginBottom: 4,
  },
  tutorAnswerText: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 20,
  },
  modalDoneBtn: {
    backgroundColor: '#9b51e0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    backgroundColor: '#131317',
    borderTopWidth: 1,
    borderTopColor: '#242430',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 14 : 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 18,
    color: '#777788',
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#777788',
  },
});
