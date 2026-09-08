import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import BottomNav from "../components/bottomNav";

export default function Layout() {
  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }} />
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});