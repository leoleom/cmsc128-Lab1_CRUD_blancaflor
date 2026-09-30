import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { loginUser, consumePendingEmailChangeNotice } from "../backend/services/authService";


export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            const shouldNotify = await consumePendingEmailChangeNotice();
            if (shouldNotify) {
                const message = "If you recently changed your email, please log in with your new email address.";
                if (Platform.OS === "web") {
                    window.alert(message);
                } else {
                    Alert.alert("Email updated", message);
                }
            }
        })();
    }, []);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert("Missing info", "Please enter both email and password.");
            return;
        }

        setIsSubmitting(true);
        try {
            await loginUser({ email: email.trim(), password });
            router.replace("/");
        } catch (error) {
            Alert.alert("Login failed", "Incorrect email or password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.form}>
                <Text style={styles.screenTitle}>LOG IN</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.loginButton}
                    onPress={handleLogin} disabled={isSubmitting}>
                    <Text style={styles.buttonText}>
                        {isSubmitting ? "Logging in..." : "Log In"}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.linkRow}>
                    Don't have an account?{" "}
                    <Text style={styles.linkText} onPress={() => router.push("/signUp")}>
                        Sign Up
                    </Text>
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f2f2f2"
    },
    form: {
        flex: 1,
        padding: 20,
        justifyContent: "center"
    },
    screenTitle: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 24,
        textAlign: "center"
    },
    input: {
        backgroundColor: "#eee",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 14,
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: "#4caf50",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 8,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16
    },
    linkRow: {
        textAlign: "center",
        marginTop: 18,
        color: "#333",
    },
    linkText: {
        color: "#e67e22",
        fontWeight: "600",
    },
});