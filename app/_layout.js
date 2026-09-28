import { useEffect, useState } from "react";
import { Stack, useRouter, usePathname } from "expo-router";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BottomNav from "../frontend/components/bottomNav";
import { subscribeToAuthChanges } from "../backend/services/authService";

const PUBLIC_ROUTES = ["/login", "/signUp"];

export default function Layout() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setIsCheckingAuth(false);
    });
    return unsubscribe;
  }, []);

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
      <SafeAreaProvider>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#e67e22" />
        </View>
      </SafeAreaProvider>
    );
  }

  const showBottomNav = user && !PUBLIC_ROUTES.includes(pathname);

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
  centered: { justifyContent: "center", alignItems: "center" },
});