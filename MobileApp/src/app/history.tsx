import { StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Learning history" />
      <Text style={styles.description}>Your learning activity</Text>
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
