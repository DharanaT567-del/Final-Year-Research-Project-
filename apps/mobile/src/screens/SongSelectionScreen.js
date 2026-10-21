import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { DEMO_SONGS, SINHALA_LABELS, MOCK_USER_PROFILE } from '../services/emotionMockData';

export default function SongSelectionScreen({ navigation }) {
  const [selectedSong, setSelectedSong] = useState(DEMO_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Toggle simulated audio playback
  const handleTogglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Mock audio file selection / upload
  const handleSelectAudioFile = () => {
    Alert.alert(
      'ශ්‍රව්‍ය ගොනුවක් තෝරන්න',
      'ආදර්ශන ගොනුවක් තෝරා විශ්ලේෂණය අත්හදා බලන්න:',
      [
        {
          text: 'නිහඬ රැයේ සිහින (MP3)',
          onPress: () => {
            setSelectedSong(DEMO_SONGS[0]);
            setUploadedFileName('S001_Nihanda_Raye.mp3');
            setUploadError('');
          }
        },
        {
          text: 'නින්දා නේන රාත්‍රියේ (MP3)',
          onPress: () => {
            setSelectedSong(DEMO_SONGS[1]);
            setUploadedFileName('S002_Ninda_Nena.mp3');
            setUploadError('');
          }
        },
        {
          text: 'අනුමත නොවන ගොනුවක් (PDF පරීක්ෂාව)',
          onPress: () => {
            setUploadError('අනුමත නොකරන ලද ගොනු වර්ගයකි. කරුණාකර MP3 හෝ WAV ශ්‍රව්‍ය ගොනුවක් පමණක් තෝරන්න.');
          }
        },
        { text: 'අවලංගු කරන්න', style: 'cancel' }
      ]
    );
  };

  // Start analysis trigger
  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      navigation.navigate('EmotionAnalysisResults', { songId: selectedSong.id });
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Top Header - Matches HomePageSS.png */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: MOCK_USER_PROFILE.avatar }} style={styles.avatar} />
          <Text style={styles.headerLogo}>{SINHALA_LABELS.appName}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>7</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>{SINHALA_LABELS.welcomeTitle}</Text>
          <Text style={styles.welcomeSubtitle}>{SINHALA_LABELS.welcomeSubtitle}</Text>
        </View>

        {/* Demo Disclaimer Banner */}
        <View style={styles.disclaimerBanner}>
          <Text style={styles.disclaimerText}>{SINHALA_LABELS.demoDisclaimer}</Text>
        </View>

        {/* Hero Card - Selected Song & Playback */}
        <View style={styles.heroCardContainer}>
          <View style={styles.heroCard}>
            <Image
              source={{ uri: selectedSong.coverImage }}
              style={styles.heroCardImage}
              blurRadius={2}
            />
            <View style={styles.heroOverlay} />

            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <View style={styles.heroDot} />
                <Text style={styles.heroBadgeText}>{SINHALA_LABELS.currentlyLearning}</Text>
              </View>

              <View style={styles.heroRow}>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.songTitle} numberOfLines={1}>{selectedSong.title}</Text>
                  <Text style={styles.artistName}>{selectedSong.artist}</Text>
                  <View style={styles.tagsContainer}>
                    {selectedSong.tags.map((tag, idx) => (
                      <View key={idx} style={styles.tagPill}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Glowing Play Button with Progress Ring */}
                <TouchableOpacity
                  style={[styles.playBtn, isPlaying && styles.playBtnActive]}
                  onPress={handleTogglePlayback}
                  activeOpacity={0.8}
                >
                  <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
                </TouchableOpacity>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarWrapper}>
                <View style={[styles.progressBarFill, { width: isPlaying ? '68%' : '42%' }]} />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{isPlaying ? '02:33' : '01:24'}</Text>
                <Text style={styles.timeText}>{selectedSong.duration}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Audio Upload / Selector Card */}
        <View style={styles.uploadSection}>
          <TouchableOpacity
            style={styles.uploadCard}
            onPress={handleSelectAudioFile}
            activeOpacity={0.85}
          >
            <View style={styles.uploadIconWrapper}>
              <Text style={styles.uploadIcon}>🎵</Text>
            </View>
            <Text style={styles.uploadTitle}>{SINHALA_LABELS.chooseSong}</Text>
            <Text style={styles.uploadSubtitle}>
              {uploadedFileName ? `තෝරාගත් ගොනුව: ${uploadedFileName}` : SINHALA_LABELS.orUpload}
            </Text>
            <View style={styles.uploadPill}>
              <Text style={styles.uploadPillText}>ගොනුව තෝරන්න (MP3 / WAV)</Text>
            </View>
          </TouchableOpacity>

          {/* Unsupported file error state */}
          {uploadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{uploadError}</Text>
            </View>
          ) : null}
        </View>

        {/* Primary Sinhala Action Button: Start Analysis */}
        <View style={styles.actionBtnContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, isAnalyzing && styles.actionBtnDisabled]}
            onPress={handleStartAnalysis}
            disabled={isAnalyzing}
            activeOpacity={0.85}
          >
            {isAnalyzing ? (
              <View style={styles.analyzingRow}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.actionBtnText}>{SINHALA_LABELS.analyzingProgress}</Text>
              </View>
            ) : (
              <Text style={styles.actionBtnText}>{SINHALA_LABELS.startAnalysis}  ➔</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Access & AI Tools - Matches HomePageSS.png */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ක්ෂණික පිවිසුම් සහ AI මෙවලම්</Text>
          <Text style={styles.sectionBadge}>AI බලගන්වන ලද</Text>
        </View>

        <View style={styles.toolsGrid}>
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => navigation.navigate('EmotionAnalysisResults', { songId: selectedSong.id })}
          >
            <View style={styles.toolCardHeader}>
              <View style={[styles.toolIconCircle, { backgroundColor: 'rgba(0, 229, 255, 0.15)' }]}>
                <Text style={[styles.toolIconText, { color: '#00e5ff' }]}>ılı</Text>
              </View>
              <View style={styles.toolBadge}>
                <Text style={styles.toolBadgeText}>හැඟීම් AI</Text>
              </View>
            </View>
            <Text style={styles.toolTitle}>හැඟීම් විශ්ලේෂණය</Text>
            <Text style={styles.toolDesc}>ගීතයේ භාවයන් 6ක ප්‍රතිශත වෙන්කර හඳුනාගන්න</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => navigation.navigate('EmotionAnalysisResults', { songId: selectedSong.id })}
          >
            <View style={styles.toolCardHeader}>
              <View style={[styles.toolIconCircle, { backgroundColor: 'rgba(192, 116, 255, 0.15)' }]}>
                <Text style={[styles.toolIconText, { color: '#c074ff' }]}>文</Text>
              </View>
              <View style={styles.toolBadge}>
                <Text style={styles.toolBadgeText}>පදමාලා</Text>
              </View>
            </View>
            <Text style={styles.toolTitle}>පද සරල කිරීම</Text>
            <Text style={styles.toolDesc}>පැරණි සාහිත්‍යමය පද සාමාන්‍ය සිංහලට පෙරළන්න</Text>
          </TouchableOpacity>
        </View>

        {/* Suggested Sinhala Classical Songs Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>යෝජිත සම්භාව්‍ය ගීත</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>සියල්ල බලන්න</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSongsList}>
          {DEMO_SONGS.map((song) => (
            <TouchableOpacity
              key={song.id}
              style={[
                styles.songThumbnailCard,
                selectedSong.id === song.id && styles.songThumbnailCardActive
              ]}
              onPress={() => {
                setSelectedSong(song);
                setUploadedFileName(`${song.audioFile}`);
                setUploadError('');
              }}
            >
              <Image source={{ uri: song.coverImage }} style={styles.songThumbnailImage} />
              <Text style={styles.songThumbnailTitle} numberOfLines={1}>{song.title}</Text>
              <Text style={styles.songThumbnailArtist} numberOfLines={1}>{song.artist}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Floating AI Tutor Button */}
      <TouchableOpacity
        style={styles.floatingTutorBtn}
        onPress={() => navigation.navigate('AiTutor')}
        activeOpacity={0.85}
      >
        <Text style={styles.floatingTutorIcon}>🤖</Text>
        <View style={styles.onlineDot} />
      </TouchableOpacity>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Text style={[styles.navIcon, { color: '#00e5ff' }]}>🏠</Text>
          <Text style={[styles.navLabel, { color: '#00e5ff' }]}>{SINHALA_LABELS.tabs.home}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navLabel}>{SINHALA_LABELS.tabs.search}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('EmotionAnalysisResults', { songId: selectedSong.id })}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>විශ්ලේෂණ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#c074ff',
    marginRight: 10,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#201625',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff5c8d',
  },
  streakIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  settingsBtn: {
    padding: 6,
  },
  settingsIcon: {
    fontSize: 18,
    color: '#d6a3ff',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 34,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 6,
    lineHeight: 18,
  },
  disclaimerBanner: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#00e5ff',
    lineHeight: 16,
  },
  heroCardContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  heroCard: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1b1b1f',
    borderWidth: 1,
    borderColor: '#2d2d38',
  },
  heroCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 12, 18, 0.82)',
  },
  heroContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00e5ff',
    marginRight: 6,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00e5ff',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  artistName: {
    fontSize: 13,
    color: '#cccccc',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    color: '#e0e0e0',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d6a3ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00e5ff',
    elevation: 4,
  },
  playBtnActive: {
    backgroundColor: '#00e5ff',
    borderColor: '#d6a3ff',
  },
  playIcon: {
    fontSize: 18,
    color: '#121212',
    fontWeight: '800',
    marginLeft: 2,
  },
  progressBarWrapper: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00e5ff',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#888888',
  },
  uploadSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  uploadCard: {
    backgroundColor: '#1a1a1f',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#333342',
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
  },
  uploadIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadIcon: {
    fontSize: 20,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  uploadSubtitle: {
    fontSize: 11,
    color: '#999999',
    marginTop: 4,
    textAlign: 'center',
  },
  uploadPill: {
    marginTop: 10,
    backgroundColor: '#262635',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#424258',
  },
  uploadPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d6a3ff',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 92, 92, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff5c5c',
    padding: 10,
    marginTop: 10,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    color: '#ff8585',
    lineHeight: 16,
  },
  actionBtnContainer: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  actionBtn: {
    backgroundColor: '#9b51e0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c074ff',
    elevation: 3,
  },
  actionBtnDisabled: {
    opacity: 0.7,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00e5ff',
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#c074ff',
  },
  toolsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  toolCard: {
    flex: 1,
    backgroundColor: '#1a1a22',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2c2c3a',
  },
  toolCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  toolBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  toolBadgeText: {
    fontSize: 9,
    color: '#cccccc',
  },
  toolTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  toolDesc: {
    fontSize: 10,
    color: '#8e8e9e',
    lineHeight: 14,
  },
  horizontalSongsList: {
    paddingLeft: 20,
    marginTop: 4,
  },
  songThumbnailCard: {
    width: 130,
    marginRight: 14,
    backgroundColor: '#181820',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#262635',
  },
  songThumbnailCardActive: {
    borderColor: '#00e5ff',
  },
  songThumbnailImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 6,
  },
  songThumbnailTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  songThumbnailArtist: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },
  floatingTutorBtn: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7b2cbf',
    borderWidth: 2,
    borderColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  floatingTutorIcon: {
    fontSize: 24,
  },
  onlineDot: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00e5ff',
    borderWidth: 1.5,
    borderColor: '#121212',
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
