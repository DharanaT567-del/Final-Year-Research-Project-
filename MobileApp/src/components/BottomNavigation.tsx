import { StyleSheet, Text, View } from "react-native";

const destinations = ["Home", "Process", "Results", "History"];

export function BottomNavigation() {
  return (
    <View style={styles.container}>
      {destinations.map((destination) => (
        <Text key={destination} style={styles.label}>
          {destination}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
  },
  label: {
    color: "#60646C",
    fontSize: 12,
  },
});
