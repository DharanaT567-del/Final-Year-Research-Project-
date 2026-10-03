import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Platform, StatusBar, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function DashboardScreen({ navigation }) {
  const { user, logout, deleteAccount } = useContext(AuthContext);

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

  const userName = user?.name || 'Asha Perera';

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerLogo}>Naada</Text>
        <TouchableOpacity>
          <View>
            <Text style={styles.headerIcon}>🔔</Text>
            <View style={styles.notificationDot} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=47' }} // Random placeholder matching a female profile
              style={styles.avatar} 
            />
            <View style={styles.avatarGlow} />
            <TouchableOpacity style={styles.settingsIconContainer}>
              <Text style={styles.settingsIcon}>⚙</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userLevel}>Level 7 - Intermediate</Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#e0c8ff' }]}>12</Text>
            <Text style={styles.statLabel}>Songs Analyzed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#00e5ff' }]}>45</Text>
            <Text style={styles.statLabel}>Quizzes Passed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#ff66a3' }]}>🔥14</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#c074ff' }]}>82%</Text>
            <Text style={styles.statLabel}>Avg. Score</Text>
          </View>
        </View>

        {/* Recent Learning */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Learning</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.learningList}>
          {/* Item 1 */}
          <View style={styles.learningCard}>
            <View style={styles.learningThumbnailPlaceholder}>
               <Text style={styles.thumbnailIcon}>🎵</Text>
            </View>
            <View style={styles.learningInfo}>
              <Text style={styles.learningTitle}>Ninda Nena Rathriye</Text>
              <Text style={styles.learningSubtitle}>Rhythm Analysis • Completed</Text>
            </View>
            <View style={styles.iconCircleCheck}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          </View>

          {/* Item 2 */}
          <View style={styles.learningCard}>
            <View style={[styles.learningThumbnailPlaceholder, {backgroundColor: '#1a2a3a'}]}>
              <Text style={styles.thumbnailIcon}>📊</Text>
            </View>
            <View style={styles.learningInfo}>
              <Text style={styles.learningTitle}>Maha Wessaka</Text>
              <Text style={styles.learningSubtitle}>Melody Construction • 60%</Text>
            </View>
            <View style={styles.iconCircleProgress}>
              <Text style={styles.progressText}></Text>
            </View>
          </View>

          {/* Item 3 */}
          <View style={[styles.learningCard, { opacity: 0.6 }]}>
            <View style={[styles.learningThumbnailPlaceholder, {backgroundColor: '#222'}]}>
              <Text style={styles.thumbnailIcon}>🔒</Text>
            </View>
            <View style={styles.learningInfo}>
              <Text style={styles.learningTitle}>Advanced Harmony</Text>
              <Text style={styles.learningSubtitle}>Unlocks at Level 8</Text>
            </View>
          </View>
        </View>
        
        {/* Account Settings */}
        <View style={[styles.sectionHeader, {marginTop: 10}]}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
        </View>

        <View style={styles.accountSettingsContainer}>
           <TouchableOpacity onPress={logout} style={styles.logoutButton}>
             <Text style={styles.logoutIcon}>🚪</Text>
             <Text style={styles.logoutText}>Log Out</Text>
           </TouchableOpacity>

           <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteButton}>
             <Text style={styles.deleteIcon}>⚠️</Text>
             <Text style={styles.deleteText}>Delete Account</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Tab Bar Mockup */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>🔍</Text>
          <Text style={styles.tabText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>🎵</Text>
          <Text style={styles.tabText}>Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={[styles.tabIcon, {color: '#00e5ff'}]}>👤</Text>
          <Text style={[styles.tabText, {color: '#00e5ff', fontWeight: 'bold'}]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#222',
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