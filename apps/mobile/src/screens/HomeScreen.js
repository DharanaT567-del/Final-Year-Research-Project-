import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ImageBackground, Image, Platform, StatusBar } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=11' }} style={styles.profileAvatar} />
          <Text style={styles.headerLogo}>BeatAcademy</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>7</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150, flexGrow: 1 }}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>Ready to master the rhythms of Sinhala Classical?</Text>
        </View>

        {/* Currently Learning Card */}
        <View style={styles.learningCardContainer}>
          <View style={styles.learningCard}>
            {/* Using a placeholder dark background to simulate the image */}
            <View style={styles.learningCardContent}>
              <View style={styles.tag}>
                <View style={styles.dot} />
                <Text style={styles.tagText}>Currently Learning</Text>
              </View>
              <Text style={styles.songTitle}>Ninda Nena Rathriye</Text>
              <Text style={styles.artistName}>W.D. Amaradeva</Text>
              <View style={styles.badgesContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Intermediate</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Vocals & Sitar</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarFill} />
            </View>
          </View>
        </View>

        {/* Quick Access & AI Tools */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Access & AI Tools</Text>
          <Text style={styles.aiPoweredText}>AI Powered</Text>
        </View>
        
        <View style={styles.toolsGrid}>
          <View style={styles.toolCard}>
            <View style={styles.toolHeader}>
               <View style={styles.iconContainer}>
                 <Text style={styles.toolIcon}>ılı</Text>
               </View>
               <View style={styles.toolTag}>
                 <Text style={styles.toolTagText}>AI Engine</Text>
               </View>
            </View>
            <Text style={styles.toolTitle}>Audio Engine</Text>
            <Text style={styles.toolSubtitle}>Upload & decompose tracks</Text>
          </View>
          
          <View style={styles.toolCard}>
            <View style={styles.toolHeader}>
               <View style={styles.iconContainer}>
                 <Text style={styles.toolIcon}>A文</Text>
               </View>
               <View style={[styles.toolTag, {backgroundColor: '#30183b', borderColor: '#4a2559'}]}>
                 <Text style={[styles.toolTagText, {color: '#c074ff'}]}>Vocab</Text>
               </View>
            </View>
            <Text style={styles.toolTitle}>Smart Lyrics</Text>
            <Text style={styles.toolSubtitle}>Translate & simplify lyrics</Text>
          </View>
        </View>

        {/* Suggested Sinhala Classical */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suggested Sinhala Classical</Text>
          <Text style={styles.seeAllText}>See All</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestedList}>
          <View style={styles.suggestedCard}>
             <View style={styles.suggestedImagePlaceholder}>
               <Text style={styles.suggestedIcon}>🥁</Text>
             </View>
          </View>
          <View style={styles.suggestedCard}>
             <View style={styles.suggestedImagePlaceholder}>
               <Text style={styles.suggestedIcon}>🎵</Text>
             </View>
          </View>
        </ScrollView>
      </ScrollView>

      {/* Floating AI Bot Button */}
      <TouchableOpacity style={styles.fab}>
         <View style={styles.fabGlow}>
           <Text style={styles.fabIcon}>🤖</Text>
         </View>
         <View style={styles.fabBadge} />
      </TouchableOpacity>

      {/* Bottom Tab Bar Mockup */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={[styles.tabIcon, {color: '#00e5ff'}]}>🏠</Text>
          <Text style={[styles.tabText, {color: '#00e5ff', fontWeight: 'bold'}]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>🔍</Text>
          <Text style={styles.tabText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>🎵</Text>
          <Text style={styles.tabText}>Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={styles.tabText}>Profile</Text>
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
    paddingBottom: 40,
    backgroundColor: '#222', // Mock image background
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12252a',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
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
  songTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    color: '#eee',
    fontSize: 12,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#d6a3ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#00e5ff',
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  playIcon: {
    fontSize: 24,
    color: '#6020a0',
    marginLeft: 4, // center visually
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
