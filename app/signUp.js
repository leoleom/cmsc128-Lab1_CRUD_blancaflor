import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { registerUser } from "../backend/services/authService";
import { showAlert } from "../frontend/utils/alerts";
import PasswordInput from "../frontend/components/passwordInput";

export default function Signup() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSignup = async () => {
        if (!displayName.trim() || !email.trim() || !password) {
            showAlert("Missing info", "Please fill in all fields.");
            return;
        }

        if (password.length < 8) {
            showAlert("Weak password", "Password must be at least 8 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            await registerUser({ email: email.trim(), password, displayName: displayName.trim() });
            router.replace("/");
        } catch (error) {
            if (error.code === "auth/email-already-in-use") {
                showAlert("Sign up failed", "That email is already registered.");
            } else {
                showAlert("Sign up failed", "Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
            <View style={styles.form}>
                <Text style={styles.screenTitle}>SIGN UP</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Display Name"
                    placeholderTextColor="#999"
                    value={displayName}
                    onChangeText={setDisplayName}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <PasswordInput
                    containerStyle={styles.passwordInputContainer}
                    inputStyle={[styles.input, styles.passwordInput]}
                    buttonStyle={styles.passwordVisibilityButton}
                    placeholder="Password (must be 8 characters)"
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity style={[styles.signupButton, isSubmitting && styles.disabledButton]}
                    onPress={handleSignup} disabled={isSubmitting}>
                    <Text style={styles.buttonText}>
                        {isSubmitting ? "Creating account..." : "Sign Up"}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.linkRow}>
                    Already have an account?{" "}
                    <Text style={styles.linkText} onPress={() => router.push("/login")}>
                        Log in
                    </Text>
                </Text>
            </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff"
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    form: {
        flexGrow: 1,
        width: "100%",
        maxWidth: 480,
        alignSelf: "center",
        justifyContent: "center",
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
    passwordInputContainer: {
        position: "relative",
        height: 46,
        marginBottom: 14,
    },
    passwordInput: {
        height: 46,
        marginBottom: 0,
        paddingRight: 48,
    },
    passwordVisibilityButton: {
        position: "absolute",
        top: 0,
        right: 2,
        bottom: 0,
        width: 40,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
    },
    signupButton: {
        backgroundColor: "#4caf50",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 8,
    },
    disabledButton: {
        opacity: 0.6,
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