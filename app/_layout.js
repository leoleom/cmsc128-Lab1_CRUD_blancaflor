import { useEffect } from "react";
import { Stack, useRouter, usePathname } from "expo-router";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BottomNav from "../frontend/components/bottomNav";
import { AuthProvider, useAuth } from "../frontend/context/AuthContext";

const PUBLIC_ROUTES = ["/login", "/signUp", "/forgotPassword"];

function AuthGate() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isCheckingAuth } = useAuth();

    useEffect(() => {
        if (isCheckingAuth) {
            return;
        }

        const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

        if (!user && !isPublicRoute) {
            router.replace("/login");
        }

        if (user && isPublicRoute) {
            router.replace("/");
        }
    }, [user, isCheckingAuth, pathname]);

    if (isCheckingAuth) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#e67e22" />
            </View>
        );
    }

    const showBottomNav = user && !PUBLIC_ROUTES.includes(pathname);

    return (
        <View style={styles.container}>
            <Stack screenOptions={{ headerShown: false }} />
            {showBottomNav && <BottomNav />}
        </View>
    );
}

export default function Layout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <AuthGate />
            </AuthProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    centered: {
        justifyContent: "center",
        alignItems: "center"
    },
});