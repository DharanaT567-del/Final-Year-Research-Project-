import { useRouter } from "expo-router";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  background: "#07111F",
  surface: "#0E1B2D",
  surfaceLight: "#142742",
  border: "#233B59",
  purple: "#3B82F6",
  purpleLight: "#93C5FD",
  white: "#F1F7FF",
  muted: "#94A9C4",
  green: "#4ADE80",
};

function MusicLogo() {
  return (
    <View style={styles.logo}>
      <View style={styles.logoBarShort} />
      <View style={styles.logoBarTall} />
      <View style={styles.logoBarMedium} />
      <View style={styles.logoBarTall} />
      <View style={styles.logoBarShort} />
    </View>
  );
}

function SectionHeading({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <MusicLogo />
            <View>
              <Text style={styles.brandName}>naada</Text>
              <Text style={styles.brandTagline}>LEARN THROUGH MUSIC</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            accessibilityLabel="Profile"
            onPress={() => router.push("/explore")}
          >
            <Text style={styles.profileInitial}>N</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome section */}
        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>YOUR PERSONAL MUSIC CLASSROOM</Text>
          <Text style={styles.welcomeTitle}>
            Every song has a{"\n"}
            <Text style={styles.highlight}>story to understand.</Text>
          </Text>
          <Text style={styles.welcomeDescription}>
            Explore Sinhala songs, understand their lyrics, and discover the
            meaning behind every line.
          </Text>
        </View>

        {/* Main action */}
        <TouchableOpacity
          style={styles.primaryCard}
          activeOpacity={0.85}
          onPress={() => router.push("/process")}
        >
          <View style={styles.primaryCardTop}>
            <View style={styles.primaryIcon}>
              <Text style={styles.playSymbol}>▶</Text>
            </View>
            <View style={styles.availableBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.availableText}>SINHALA</Text>
            </View>
          </View>

          <Text style={styles.primaryTitle}>Understand a song</Text>
          <Text style={styles.primaryDescription}>
            Upload Sinhala audio and begin your lyrics learning journey.
          </Text>

          <View style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Process a song</Text>
            <Text style={styles.primaryButtonArrow}>→</Text>
          </View>

          <View style={styles.decorativeCircle} />
          <View style={styles.decorativeCircleSmall} />
        </TouchableOpacity>

        {/* Learning pipeline */}
        <SectionHeading title="Your learning journey" />

        <View style={styles.learningCard}>
          <View style={styles.learningStep}>
            <View style={[styles.stepIcon, styles.stepIconActive]}>
              <Text style={styles.stepEmoji}>♫</Text>
            </View>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>Listen to the song</Text>
              <Text style={styles.stepDescription}>
                Start with music you love.
              </Text>
            </View>
            <Text style={styles.stepNumber}>01</Text>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.learningStep}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepEmoji}>文</Text>
            </View>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>Explore the lyrics</Text>
              <Text style={styles.stepDescription}>
                Follow the Sinhala words as you listen.
              </Text>
            </View>
            <Text style={styles.stepNumber}>02</Text>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.learningStep}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepEmoji}>✧</Text>
            </View>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>Discover the meaning</Text>
              <Text style={styles.stepDescription}>
                Learn about unfamiliar words and expressions.
              </Text>
            </View>
            <Text style={styles.stepNumber}>03</Text>
          </View>
        </View>

        {/* History preview */}
        <SectionHeading title="Recently explored" action="PP1 preview" />

        <View style={styles.emptyHistory}>
          <View style={styles.emptyHistoryIcon}>
            <Text style={styles.emptyMusicNote}>♫</Text>
          </View>
          <Text style={styles.emptyHistoryTitle}>
            Your music journey starts here
          </Text>
          <Text style={styles.emptyHistoryDescription}>
            Songs you process will appear here once history is connected.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/history")}
            activeOpacity={0.7}
          >
            <Text style={styles.historyLink}>View learning history →</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>MADE FOR MUSIC LOVERS · NAADA</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 35,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  logo: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  logoBarShort: {
    width: 3,
    height: 10,
    borderRadius: 3,
    backgroundColor: COLORS.purpleLight,
  },
  logoBarMedium: {
    width: 3,
    height: 18,
    borderRadius: 3,
    backgroundColor: COLORS.purple,
  },
  logoBarTall: {
    width: 3,
    height: 25,
    borderRadius: 3,
    backgroundColor: COLORS.purpleLight,
  },
  brandName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  brandTagline: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 1,
  },
  profileButton: {
    width: 41,
    height: 41,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    color: COLORS.purpleLight,
    fontSize: 15,
    fontWeight: "700",
  },
  welcome: {
    marginBottom: 26,
  },
  eyebrow: {
    color: COLORS.purpleLight,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 13,
  },
  welcomeTitle: {
    color: COLORS.white,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  highlight: {
    color: COLORS.purpleLight,
  },
  welcomeDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 22,
    marginTop: 13,
    maxWidth: 330,
  },
  primaryCard: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: "#46365F",
    borderRadius: 22,
    padding: 21,
    marginBottom: 32,
    overflow: "hidden",
  },
  primaryCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 23,
    zIndex: 1,
  },
  primaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#3B82F625",
    borderWidth: 1,
    borderColor: "#3B82F650",
    alignItems: "center",
    justifyContent: "center",
  },
  playSymbol: {
    color: COLORS.purpleLight,
    fontSize: 20,
    marginLeft: 3,
  },
  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#151523",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  availableText: {
    color: COLORS.purpleLight,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  primaryTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
    zIndex: 1,
  },
  primaryDescription: {
    color: "#C2BDD2",
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 285,
    zIndex: 1,
  },
  primaryButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.purple,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 1,
  },
  primaryButtonText: {
    color: "#07111F",
    fontSize: 12,
    fontWeight: "800",
  },
  primaryButtonArrow: {
    color: "#07111F",
    fontSize: 19,
    fontWeight: "700",
  },
  decorativeCircle: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: "#60A5FA12",
    right: -75,
    top: -70,
  },
  decorativeCircleSmall: {
    position: "absolute",
    width: 115,
    height: 115,
    borderRadius: 58,
    borderWidth: 1,
    borderColor: "#60A5FA12",
    right: -45,
    top: -43,
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  sectionAction: {
    color: COLORS.purpleLight,
    fontSize: 10,
    fontWeight: "600",
  },
  learningCard: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    backgroundColor: COLORS.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 31,
  },
  learningStep: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    gap: 12,
  },
  stepIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconActive: {
    backgroundColor: "#8B5CF622",
    borderColor: "#244D7A",
  },
  stepEmoji: {
    color: COLORS.purpleLight,
    fontSize: 19,
    fontWeight: "600",
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 5,
  },
  stepDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
  },
  stepNumber: {
    color: "#6E6784",
    fontSize: 10,
    fontWeight: "700",
  },
  stepDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 54,
  },
  emptyHistory: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 25,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
  },
  emptyHistoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  emptyMusicNote: {
    color: COLORS.purpleLight,
    fontSize: 24,
  },
  emptyHistoryTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyHistoryDescription: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 15,
  },
  historyLink: {
    color: COLORS.purpleLight,
    fontSize: 11,
    fontWeight: "700",
  },
  footer: {
    color: "#625B76",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 30,
  },
});
