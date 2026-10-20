import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { requestPasswordReset } from "../backend/services/authService";

function showAlert(title, message) {
    if (Platform.OS === "web") {
        window.alert(message ? `${title}\n\n${message}` : title);
    } else {
        Alert.alert(title, message);
    }
}

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReset = async () => {
        if (!email.trim()) {
            showAlert("Missing email", "Please enter your email address.");
            return;
        }

        setIsSubmitting(true);
        try {
            await requestPasswordReset(email.trim());
            showAlert(
                "Check your email",
                "If an account exists for that email, a password reset link has been sent."
            );
            router.back();
        } catch (error) {
            console.error("requestPasswordReset failed:", error);
            showAlert("Error", "Couldn't send the reset email. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.form}>
                <Text style={styles.screenTitle}>Reset Password</Text>
                <Text style={styles.subtitle}>
                    Enter your account email and we'll send you a link to reset your password.
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleReset}
                    disabled={isSubmitting}
                >
                    <Text style={styles.buttonText}>
                        {isSubmitting ? "Sending..." : "Send Reset Link"}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.linkRow}>
                    Remembered your password?{" "}
                    <Text style={styles.linkText} onPress={() => router.push("/login")}>
                        Log In
                    </Text>
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff"
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
        marginBottom: 12,
        textAlign: "center"
    },
    subtitle: {
        fontSize: 14,
        color: "#666",
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
    resetButton: {
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
        color: "#333"
    },
    linkText: {
        color: "#e67e22",
        fontWeight: "600"
    },
});