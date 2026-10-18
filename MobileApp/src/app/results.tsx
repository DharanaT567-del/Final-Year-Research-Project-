import { StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";

export default function ResultsScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Synchronized lyrics" />
      <Text style={styles.description}>Lyrics and audio results</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  description: {
    color: "#60646C",
    fontSize: 16,
  },
});
