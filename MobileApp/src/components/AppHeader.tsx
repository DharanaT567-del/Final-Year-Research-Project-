import { StyleSheet, Text, View } from "react-native";

type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  title: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "600",
  },
});
