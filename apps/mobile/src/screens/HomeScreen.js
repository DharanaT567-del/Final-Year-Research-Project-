import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, StatusBar } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import PrimaryTabBar from '../components/PrimaryTabBar';
import { getSongs } from '../services/songLibraryService';
import { getLearnerProgress } from '../services/learnerProgressService';
import { lyricsTheme } from '../theme/lyricsTheme';

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [songs, setSongs] = useState([]);
  const [progress, setProgress] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    getSongs().then((items) => { if (mounted) setSongs(items); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    getLearnerProgress(user?.uid).then((data) => { if (mounted) setProgress(data); }).catch(() => {});
    return () => { mounted = false; };
  }, [user?.uid]);

  const name = user?.name || user?.displayName || 'Learner';
  const latestAssessment = progress?.latestAssessment;

  return (
    <View style={homeStyles.screen}>
      <View style={homeStyles.header}>
        <Text style={homeStyles.brand}>Naada</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} accessibilityRole="button" accessibilityLabel="Open profile">
          <Text style={homeStyles.profileMark}>○</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={homeStyles.content}>
        <Text style={homeStyles.kicker}>SING, LISTEN, LEARN</Text>
        <Text style={homeStyles.greeting}>Welcome, {name}</Text>
        <Text style={homeStyles.subtitle}>Learn Sinhala through selected songs and their words.</Text>

        <View style={homeStyles.search}>
          <TextInput
            style={homeStyles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search songs or artists"
            placeholderTextColor={lyricsTheme.colors.secondaryText}
            returnKeyType="search"
            onSubmitEditing={() => navigation.navigate('SongLibrary', { query: search })}
            accessibilityLabel="Search songs or artists"
          />
          <TouchableOpacity onPress={() => navigation.navigate('SongLibrary', { query: search })} accessibilityRole="button">
            <Text style={homeStyles.searchAction}>Search</Text>
          </TouchableOpacity>
        </View>

        <View style={homeStyles.sectionHeading}>
          <Text style={homeStyles.sectionTitle}>Recommended songs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SongLibrary')} accessibilityRole="button">
            <Text style={homeStyles.link}>See all</Text>
          </TouchableOpacity>
        </View>
        {songs.slice(0, 2).map((song) => (
          <TouchableOpacity
            key={song.id}
            style={homeStyles.songRow}
            onPress={() => navigation.navigate('SongPlayer', { songId: song.id })}
            accessibilityRole="button"
          >
            <View style={homeStyles.artwork}><Text style={homeStyles.artworkMark}>{song.artworkMark}</Text></View>
            <View style={homeStyles.songText}>
              <Text style={homeStyles.songTitle}>{song.title}</Text>
              <Text style={homeStyles.songMeta}>{song.artist}</Text>
              <Text style={homeStyles.sample}>{song.sourceLabel}</Text>
            </View>
            <Text style={homeStyles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={homeStyles.sectionHeading}>
          <Text style={homeStyles.sectionTitle}>Your learning</Text>
        </View>
        <View style={homeStyles.progressPanel}>
          <Text style={homeStyles.progressValue}>{latestAssessment?.level || 'Not assessed'}</Text>
          <Text style={homeStyles.progressDetail}>
            {latestAssessment
              ? `${latestAssessment.score} of ${latestAssessment.total} assessment answers correct`
              : 'Take a short check-in to get a provisional starting level.'}
          </Text>
          <TouchableOpacity
            style={homeStyles.actionButton}
            onPress={() => navigation.navigate('LearnerAssessment')}
            accessibilityRole="button"
          >
            <Text style={homeStyles.actionText}>{latestAssessment ? 'Retake assessment' : 'Start assessment'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={homeStyles.progressLink} onPress={() => navigation.navigate('LearningProgress')} accessibilityRole="button">
          <Text style={homeStyles.link}>View learning progress  ›</Text>
        </TouchableOpacity>
      </ScrollView>
      <PrimaryTabBar navigation={navigation} activeRoute="Home" />
    </View>
  );
}

const homeStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lyricsTheme.colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: lyricsTheme.colors.border },
  brand: { color: lyricsTheme.colors.text, fontSize: 19, fontWeight: '900' },
  profileMark: { color: lyricsTheme.colors.lightBlue, fontSize: 25, paddingHorizontal: 4 },
  content: { paddingHorizontal: 20, paddingTop: 23, paddingBottom: 24 },
  kicker: { color: lyricsTheme.colors.lightBlue, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  greeting: { color: lyricsTheme.colors.text, fontSize: 27, lineHeight: 35, fontWeight: '900', marginTop: 8 },
  subtitle: { color: lyricsTheme.colors.secondaryText, fontSize: 14, lineHeight: 22, marginTop: 6 },
  search: { minHeight: 48, flexDirection: 'row', alignItems: 'center', backgroundColor: lyricsTheme.colors.card, borderWidth: 1, borderColor: lyricsTheme.colors.border, borderRadius: 8, marginTop: 20, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: lyricsTheme.colors.text, fontSize: 13, paddingVertical: 10 },
  searchAction: { color: lyricsTheme.colors.lightBlue, fontSize: 12, fontWeight: '800' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 8 },
  sectionTitle: { color: lyricsTheme.colors.text, fontSize: 16, fontWeight: '800' },
  link: { color: lyricsTheme.colors.lightBlue, fontSize: 12, fontWeight: '700' },
  songRow: { minHeight: 77, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: lyricsTheme.colors.border },
  artwork: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: lyricsTheme.colors.cardSecondary, borderRadius: 7, marginRight: 11 },
  artworkMark: { color: lyricsTheme.colors.lightBlue, fontSize: 21, fontWeight: '800' },
  songText: { flex: 1 },
  songTitle: { color: lyricsTheme.colors.text, fontSize: 14, fontWeight: '800' },
  songMeta: { color: lyricsTheme.colors.secondaryText, fontSize: 11, marginTop: 3 },
  sample: { color: lyricsTheme.colors.lightBlue, fontSize: 10, marginTop: 4 },
  arrow: { color: lyricsTheme.colors.lightBlue, fontSize: 24, marginLeft: 8 },
  progressPanel: { backgroundColor: lyricsTheme.colors.card, borderWidth: 1, borderColor: lyricsTheme.colors.border, borderRadius: 8, padding: 15 },
  progressValue: { color: lyricsTheme.colors.text, fontSize: 18, fontWeight: '900' },
  progressDetail: { color: lyricsTheme.colors.secondaryText, fontSize: 12, lineHeight: 19, marginTop: 5 },
  actionButton: { alignSelf: 'flex-start', backgroundColor: lyricsTheme.colors.primary, borderRadius: 7, paddingHorizontal: 13, paddingVertical: 10, marginTop: 13 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  progressLink: { alignSelf: 'flex-start', paddingVertical: 12 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#c074ff',
  },
  headerLogo: {
    color: '#e0c8ff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#221528',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#3a2045',
  },
  streakIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingsIcon: {
    color: '#c074ff',
    fontSize: 22,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  welcomeTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: '#d6a3ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#00e5ff',
    fontWeight: '500',
  },
  learningCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  learningCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  learningCardContent: {
    padding: 20,
    backgroundColor: '#222', // Mock image background
  },
  cardHeaderRow: {
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12252a',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1a3a42',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00e5ff',
    marginRight: 8,
  },
  tagText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTextContent: {
    flex: 1,
    marginRight: 16,
  },
  songTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 15,
    color: '#aaa',
    marginBottom: 14,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    color: '#eee',
    fontSize: 12,
  },
  playButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#d6a3ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  playIcon: {
    fontSize: 22,
    color: '#6020a0',
    marginLeft: 3, // center visually
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#333',
    width: '100%',
  },
  progressBarFill: {
    width: '65%',
    height: '100%',
    backgroundColor: '#00e5ff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  aiPoweredText: {
    fontSize: 14,
    color: '#00e5ff',
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    color: '#d6a3ff',
    fontWeight: '600',
  },
  toolsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  toolCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#15252a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00e5ff',
  },
  toolIcon: {
    color: '#00e5ff',
    fontSize: 16,
  },
  toolTag: {
    backgroundColor: '#15252a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#203a40',
  },
  toolTagText: {
    color: '#00e5ff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  toolSubtitle: {
    fontSize: 12,
    color: '#aaa',
  },
  suggestedList: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  suggestedCard: {
    width: 200,
    height: 120,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  suggestedImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  suggestedIcon: {
    fontSize: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c074ff',
    zIndex: 10,
  },
  fabGlow: {
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 28,
  },
  fabBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00e5ff',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingBottom: 25, // safe area spacing
  },
  tabItem: {
    alignItems: 'center',
  },
  tabIcon: {
    color: '#888',
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    color: '#888',
    fontSize: 10,
  },
});
