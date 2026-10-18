import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import PrimaryTabBar from '../components/PrimaryTabBar';
import { getLearnerProgress } from '../services/learnerProgressService';
import { lyricsTheme } from '../theme/lyricsTheme';

export default function DashboardScreen({ navigation }) {
  const { user, logout, deleteAccount } = useContext(AuthContext);
  const [latestAssessment, setLatestAssessment] = useState(null);

  useEffect(() => {
    let mounted = true;
    getLearnerProgress(user?.uid)
      .then((progress) => { if (mounted) setLatestAssessment(progress.latestAssessment); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [user?.uid]);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteAccount }
      ]
    );
  };

  const userName = user?.name || user?.displayName || 'Learner';

  return (
    <View style={profileStyles.screen}>
      <View style={profileStyles.header}><Text style={profileStyles.brand}>Profile</Text></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={profileStyles.content}>
        <View style={profileStyles.identity}>
          <View style={profileStyles.avatar}><Text style={profileStyles.avatarText}>{userName.charAt(0).toUpperCase()}</Text></View>
          <Text style={profileStyles.name}>{userName}</Text>
          {user?.email ? <Text style={profileStyles.email}>{user.email}</Text> : null}
        </View>

        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionTitle}>Learner assessment</Text>
          <Text style={profileStyles.detail}>
            {latestAssessment
              ? `${latestAssessment.level} · ${latestAssessment.score}/${latestAssessment.total} correct · ${new Date(latestAssessment.takenAt).toLocaleDateString()}`
              : 'No assessment has been completed yet.'}
          </Text>
          <TouchableOpacity style={profileStyles.linkRow} onPress={() => navigation.navigate('LearnerAssessment')} accessibilityRole="button">
            <Text style={profileStyles.link}>{latestAssessment ? 'Retake assessment' : 'Start assessment'}</Text><Text style={profileStyles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.linkRow} onPress={() => navigation.navigate('LearningProgress')} accessibilityRole="button">
            <Text style={profileStyles.link}>View learning progress</Text><Text style={profileStyles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={profileStyles.section}>
          <Text style={profileStyles.sectionTitle}>Account</Text>
          <TouchableOpacity style={profileStyles.accountButton} onPress={logout} accessibilityRole="button">
            <Text style={profileStyles.accountText}>Sign out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.deleteButton} onPress={handleDeleteAccount} accessibilityRole="button">
            <Text style={profileStyles.deleteText}>Delete account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <PrimaryTabBar navigation={navigation} activeRoute="Dashboard" />
    </View>
  );
}

const profileStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lyricsTheme.colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { minHeight: 54, justifyContent: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: lyricsTheme.colors.border },
  brand: { color: lyricsTheme.colors.text, fontSize: 18, fontWeight: '900' },
  content: { padding: 20, paddingBottom: 24 },
  identity: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: lyricsTheme.colors.cardSecondary, borderWidth: 1, borderColor: lyricsTheme.colors.border },
  avatarText: { color: lyricsTheme.colors.lightBlue, fontSize: 27, fontWeight: '900' },
  name: { color: lyricsTheme.colors.text, fontSize: 21, fontWeight: '900', marginTop: 13 },
  email: { color: lyricsTheme.colors.secondaryText, fontSize: 13, marginTop: 4 },
  section: { paddingTop: 18, paddingBottom: 12, borderTopWidth: 1, borderTopColor: lyricsTheme.colors.border, marginTop: 10 },
  sectionTitle: { color: lyricsTheme.colors.text, fontSize: 16, fontWeight: '800' },
  detail: { color: lyricsTheme.colors.secondaryText, fontSize: 12, lineHeight: 19, marginTop: 8 },
  linkRow: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: lyricsTheme.colors.border, marginTop: 8 },
  link: { color: lyricsTheme.colors.lightBlue, fontSize: 13, fontWeight: '700' },
  arrow: { color: lyricsTheme.colors.lightBlue, fontSize: 22 },
  accountButton: { minHeight: 46, justifyContent: 'center', borderTopWidth: 1, borderTopColor: lyricsTheme.colors.border, marginTop: 9 },
  accountText: { color: lyricsTheme.colors.lightBlue, fontSize: 13, fontWeight: '700' },
  deleteButton: { minHeight: 44, justifyContent: 'center', borderTopWidth: 1, borderTopColor: lyricsTheme.colors.border },
  deleteText: { color: lyricsTheme.colors.error, fontSize: 13, fontWeight: '700' },
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
  headerIcon: {
    color: '#fff',
    fontSize: 24,
  },
  headerLogo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textShadowColor: '#c074ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00e5ff',
    borderWidth: 2,
    borderColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#c074ff',
    zIndex: 2,
  },
  avatarGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 60,
    backgroundColor: '#c074ff',
    opacity: 0.3,
    zIndex: 1,
  },
  settingsIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2a2a2a',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    borderWidth: 2,
    borderColor: '#121212',
  },
  settingsIcon: {
    color: '#fff',
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userLevel: {
    fontSize: 14,
    color: '#00e5ff',
    fontWeight: '600',
    marginBottom: 15,
  },
  progressBarContainer: {
    width: '60%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#00e5ff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewAllText: {
    color: '#e0c8ff',
    fontSize: 14,
  },
  learningList: {
    paddingHorizontal: 20,
  },
  learningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  learningThumbnailPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2a1a3a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  thumbnailIcon: {
    fontSize: 24,
  },
  learningInfo: {
    flex: 1,
  },
  learningTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  learningSubtitle: {
    color: '#aaa',
    fontSize: 12,
  },
  iconCircleCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#003333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: '#00e5ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  iconCircleProgress: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#c074ff',
    borderTopColor: '#333',
    borderRightColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  progressText: {},
  accountSettingsContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  logoutText: {
    color: '#00e5ff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5a2a2a',
  },
  deleteIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  deleteText: {
    color: '#ff4d4d',
    fontSize: 16,
    fontWeight: '600',
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
    paddingBottom: 25,
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