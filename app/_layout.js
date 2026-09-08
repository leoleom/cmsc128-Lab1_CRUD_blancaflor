import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BottomNav from "../frontend/components/bottomNav";

export default function Layout() {
    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <Stack screenOptions={{ headerShown: false }} />
                <BottomNav />
            </View>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
});