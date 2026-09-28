import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { registerUser } from "../backend/services/authService";

export default function Signup() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSignup = async () => {
        if (!displayName.trim() || !email.trim() || !password) {
            Alert.alert("Missing info", "Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Weak password", "Password must be at least 6 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            await registerUser({ email: email.trim(), password, displayName: displayName.trim() });
            router.replace("/");
        } catch (error) {
            if (error.code === "auth/email-already-in-use") {
                Alert.alert("Sign up failed", "That email is already registered.");
            } else {
                Alert.alert("Sign up failed", "Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
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

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.signupButton}
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
    signupButton: {
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