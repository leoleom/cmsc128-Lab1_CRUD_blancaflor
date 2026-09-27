import { Stack, usePathname } from "expo-router";
import { View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BottomNav from "../frontend/components/bottomNav";

const HIDE_NAV_ROUTES = ["/login", "/signUp"];

export default function Layout() {
    const pathname = usePathname();
    const showBottomNav = !HIDE_NAV_ROUTES.includes(pathname);

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <Stack screenOptions={{ headerShown: false }} />
                {showBottomNav && <BottomNav />}
            </View>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
});