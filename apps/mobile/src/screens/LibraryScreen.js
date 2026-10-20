import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
    StatusBar,
} from 'react-native';
import { CLASSICAL_SONGS, DIFFICULTY_TIERS } from '../data/classicalSongs';

export default function LibraryScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTier, setSelectedTier] = useState(DIFFICULTY_TIERS.ALL);
    const [selectedSong, setSelectedSong] = useState(null);

    const filteredSongs = useMemo(() => {
        return CLASSICAL_SONGS.filter((song) => {
            // Tier filter
            const matchesTier =
                selectedTier === DIFFICULTY_TIERS.ALL || song.difficultyLabel === selectedTier;

            // Search filter
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                song.title.toLowerCase().includes(q) ||
                song.titleSinhala.toLowerCase().includes(q) ||
                song.artist.toLowerCase().includes(q) ||
                song.taal.toLowerCase().includes(q) ||
                song.dominantEmotion.toLowerCase().includes(q);

            return matchesTier && matchesSearch;
        });
    }, [searchQuery, selectedTier]);

    const tierCounts = useMemo(() => {
        return {
            [DIFFICULTY_TIERS.ALL]: CLASSICAL_SONGS.length,
            [DIFFICULTY_TIERS.BEGINNER]: CLASSICAL_SONGS.filter(
                (s) => s.difficultyLabel === DIFFICULTY_TIERS.BEGINNER
            ).length,
            [DIFFICULTY_TIERS.INTERMEDIATE]: CLASSICAL_SONGS.filter(
                (s) => s.difficultyLabel === DIFFICULTY_TIERS.INTERMEDIATE
            ).length,
            [DIFFICULTY_TIERS.ADVANCED]: CLASSICAL_SONGS.filter(
                (s) => s.difficultyLabel === DIFFICULTY_TIERS.ADVANCED
            ).length,
        };
    }, []);

    const getDifficultyBadgeStyle = (label) => {
        switch (label) {
            case 'Beginner':
                return {
                    bg: 'rgba(0, 229, 255, 0.12)',
                    border: 'rgba(0, 229, 255, 0.4)',
                    text: '#00e5ff',
                    dot: '#00e5ff',
                };
            case 'Intermediate':
                return {
                    bg: 'rgba(255, 209, 102, 0.12)',
                    border: 'rgba(255, 209, 102, 0.4)',
                    text: '#ffd166',
                    dot: '#ffd166',
                };
            case 'Advanced':
                return {
                    bg: 'rgba(239, 71, 111, 0.12)',
                    border: 'rgba(239, 71, 111, 0.4)',
                    text: '#ef476f',
                    dot: '#ef476f',
                };
            default:
                return {
                    bg: 'rgba(192, 116, 255, 0.12)',
                    border: 'rgba(192, 116, 255, 0.4)',
                    text: '#c074ff',
                    dot: '#c074ff',
                };
        }
    };

    const handleAskTutor = (song) => {
        navigation.navigate('AiTutor', {
            initialQuery: `Tell me about the Sinhala classical song "${song.title}" (${song.titleSinhala}) by ${song.artist}. What is its difficulty level, taal structure, and how should a student practice it?`,
        });
    };

    return (
        <View style={styles.container}>
            {/* Top Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Classical Music Library</Text>
                    <Text style={styles.headerSubtitle}>Pinecone Knowledge Base • AI Difficulty Marked</Text>
                </View>
                <TouchableOpacity
                    style={styles.aiTutorHeaderBtn}
                    onPress={() => navigation.navigate('AiTutor')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.aiTutorHeaderIcon}>🤖</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search songs, artists, taals, emotions..."
                        placeholderTextColor="#777"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Text style={styles.clearSearchIcon}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Difficulty Filter Chips */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Difficulty Filter:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsRow}>
                        {Object.values(DIFFICULTY_TIERS).map((tier) => {
                            const isSelected = selectedTier === tier;
                            let chipColor = '#c074ff';
                            if (tier === 'Beginner') chipColor = '#00e5ff';
                            if (tier === 'Intermediate') chipColor = '#ffd166';
                            if (tier === 'Advanced') chipColor = '#ef476f';

                            return (
                                <TouchableOpacity
                                    key={tier}
                                    style={[
                                        styles.filterChip,
                                        isSelected && {
                                            backgroundColor: chipColor,
                                            borderColor: chipColor,
                                        },
                                    ]}
                                    onPress={() => setSelectedTier(tier)}
                                    activeOpacity={0.75}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            isSelected && { color: '#000', fontWeight: 'bold' },
                                        ]}
                                    >
                                        {tier} ({tierCounts[tier]})
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Songs Count Indicator */}
                <View style={styles.resultsSummary}>
                    <Text style={styles.resultsCountText}>
                        Showing <Text style={{ color: '#00e5ff', fontWeight: 'bold' }}>{filteredSongs.length}</Text>{' '}
                        Sinhala classical songs
                    </Text>
                    <Text style={styles.corpusBadge}>Pinecone RAG</Text>
                </View>

                {/* Song Cards List */}
                <View style={styles.songsList}>
                    {filteredSongs.map((song) => {
                        const badge = getDifficultyBadgeStyle(song.difficultyLabel);
                        const scorePct = (song.difficultyScore / 10) * 100;
                        const isExpanded = selectedSong === song.id;

                        return (
                            <TouchableOpacity
                                key={song.id}
                                style={[
                                    styles.songCard,
                                    isExpanded && { borderColor: badge.border, borderWidth: 1.5 },
                                ]}
                                onPress={() => setSelectedSong(isExpanded ? null : song.id)}
                                activeOpacity={0.9}
                            >
                                {/* Card Top: Title, Artist, and Difficulty Badge */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.titleArea}>
                                        <Text style={styles.songTitle}>{song.title}</Text>
                                        <Text style={styles.songTitleSinhala}>{song.titleSinhala}</Text>
                                        <Text style={styles.artistName}>👤 {song.artist}</Text>
                                    </View>

                                    {/* Difficulty Badge */}
                                    <View
                                        style={[
                                            styles.difficultyBadge,
                                            { backgroundColor: badge.bg, borderColor: badge.border },
                                        ]}
                                    >
                                        <View style={[styles.badgeDot, { backgroundColor: badge.dot }]} />
                                        <Text style={[styles.difficultyBadgeText, { color: badge.text }]}>
                                            {song.difficultyLabel}
                                        </Text>
                                        <Text style={[styles.difficultyScoreText, { color: badge.text }]}>
                                            {song.difficultyScore.toFixed(1)}/10
                                        </Text>
                                    </View>
                                </View>

                                {/* Difficulty Progress Bar */}
                                <View style={styles.meterContainer}>
                                    <View style={styles.meterTrack}>
                                        <View
                                            style={[
                                                styles.meterFill,
                                                { width: `${scorePct}%`, backgroundColor: badge.text },
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.meterPctText, { color: badge.text }]}>
                                        {Math.round(scorePct)}% Difficulty
                                    </Text>
                                </View>

                                {/* Metadata Tags */}
                                <View style={styles.tagsRow}>
                                    <View style={styles.tag}>
                                        <Text style={styles.tagIcon}>🥁</Text>
                                        <Text style={styles.tagText}>{song.taal}</Text>
                                    </View>
                                    <View style={styles.tag}>
                                        <Text style={styles.tagIcon}>💭</Text>
                                        <Text style={styles.tagText}>{song.dominantEmotion}</Text>
                                    </View>
                                    <View style={styles.tag}>
                                        <Text style={styles.tagIcon}>⏱</Text>
                                        <Text style={styles.tagText}>{song.duration}</Text>
                                    </View>
                                </View>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <View style={styles.expandedSection}>
                                        <Text style={styles.descriptionText}>{song.description}</Text>

                                        <View style={styles.instrumentsContainer}>
                                            <Text style={styles.instrumentsLabel}>Key Instruments:</Text>
                                            <View style={styles.instrumentsList}>
                                                {song.instruments.map((inst, i) => (
                                                    <View key={i} style={styles.instChip}>
                                                        <Text style={styles.instChipText}>{inst}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>

                                        <View style={styles.actionRow}>
                                            <TouchableOpacity
                                                style={styles.askAiButton}
                                                onPress={() => handleAskTutor(song)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={styles.askAiButtonIcon}>🤖</Text>
                                                <Text style={styles.askAiButtonText}>Ask AI Tutor About Song</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Floating AI Bot Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AiTutor')}
                activeOpacity={0.8}
                accessibilityLabel="Open AI Tutor Chat"
            >
                <View style={styles.fabGlow}>
                    <Text style={styles.fabIcon}>🤖</Text>
                </View>
                <View style={styles.fabBadge} />
            </TouchableOpacity>

            {/* Bottom Tab Bar */}
            <View style={styles.bottomTabBar}>
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.tabIcon}>🏠</Text>
                    <Text style={styles.tabText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
                    <Text style={styles.tabIcon}>🔍</Text>
                    <Text style={styles.tabText}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
                    <Text style={[styles.tabIcon, { color: '#00e5ff' }]}>🎵</Text>
                    <Text style={[styles.tabText, { color: '#00e5ff', fontWeight: 'bold' }]}>Library</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => navigation.navigate('Dashboard')}
                    activeOpacity={0.7}
                >
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
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#1e1e1e',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    backIcon: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#00e5ff',
        fontSize: 11,
        marginTop: 2,
    },
    aiTutorHeaderBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#241432',
        borderWidth: 1,
        borderColor: '#c074ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiTutorHeaderIcon: {
        fontSize: 18,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1c1c1e',
        marginHorizontal: 16,
        marginTop: 14,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#2c2c2e',
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        padding: 0,
    },
    clearSearchIcon: {
        color: '#888',
        fontSize: 14,
        paddingHorizontal: 6,
    },
    filterSection: {
        marginTop: 14,
        paddingHorizontal: 16,
    },
    filterSectionTitle: {
        color: '#aaa',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterChipsRow: {
        flexDirection: 'row',
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#1e1e24',
        borderWidth: 1,
        borderColor: '#333',
        marginRight: 8,
    },
    filterChipText: {
        color: '#ccc',
        fontSize: 12,
        fontWeight: '500',
    },
    resultsSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 14,
        marginBottom: 8,
    },
    resultsCountText: {
        color: '#888',
        fontSize: 12,
    },
    corpusBadge: {
        color: '#c074ff',
        fontSize: 10,
        fontWeight: '600',
        backgroundColor: '#2a1738',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        overflow: 'hidden',
    },
    songsList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    songCard: {
        backgroundColor: '#1a1a22',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#272733',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleArea: {
        flex: 1,
        paddingRight: 10,
    },
    songTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    songTitleSinhala: {
        color: '#c074ff',
        fontSize: 13,
        marginTop: 2,
    },
    artistName: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 4,
    },
    difficultyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        gap: 5,
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    difficultyBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    difficultyScoreText: {
        fontSize: 11,
        fontWeight: '600',
        opacity: 0.85,
    },
    meterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 10,
    },
    meterTrack: {
        flex: 1,
        height: 6,
        backgroundColor: '#252530',
        borderRadius: 3,
        overflow: 'hidden',
    },
    meterFill: {
        height: '100%',
        borderRadius: 3,
    },
    meterPctText: {
        fontSize: 11,
        fontWeight: '600',
        minWidth: 80,
        textAlign: 'right',
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        gap: 6,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#242432',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    tagIcon: {
        fontSize: 11,
    },
    tagText: {
        color: '#bbb',
        fontSize: 11,
    },
    expandedSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#272733',
    },
    descriptionText: {
        color: '#ccc',
        fontSize: 12,
        lineHeight: 18,
    },
    instrumentsContainer: {
        marginTop: 10,
    },
    instrumentsLabel: {
        color: '#888',
        fontSize: 11,
        marginBottom: 4,
    },
    instrumentsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    instChip: {
        backgroundColor: '#2a2238',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    instChipText: {
        color: '#e0c8ff',
        fontSize: 10,
    },
    actionRow: {
        marginTop: 14,
    },
    askAiButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#241432',
        borderWidth: 1,
        borderColor: '#c074ff',
        borderRadius: 10,
        paddingVertical: 10,
        gap: 8,
    },
    askAiButtonIcon: {
        fontSize: 16,
    },
    askAiButtonText: {
        color: '#c074ff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 85,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#c074ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    fabGlow: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#201026',
        borderWidth: 2,
        borderColor: '#c074ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fabIcon: {
        fontSize: 26,
    },
    fabBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#00e5ff',
        borderWidth: 2,
        borderColor: '#121212',
    },
    bottomTabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 65,
        backgroundColor: '#161616',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    tabIcon: {
        fontSize: 20,
        color: '#888',
        marginBottom: 2,
    },
    tabText: {
        fontSize: 10,
        color: '#888',
    },
});
