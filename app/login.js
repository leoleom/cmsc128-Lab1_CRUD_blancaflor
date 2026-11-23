import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { loginUser } from "../backend/services/authService";
import { showAlert } from "../frontend/utils/alerts";
import PasswordInput from "../frontend/components/passwordInput";


export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [focusedField, setFocusedField] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isForgotPressed, setIsForgotPressed] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            showAlert("Missing info", "Please enter both email and password.");
            return;
        }

        setIsSubmitting(true);
        try {
            await loginUser({ email: email.trim(), password });
            router.replace("/");
        } catch (error) {
            showAlert("Login failed", "Incorrect email or password.");
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
                <Text style={styles.screenTitle}>LOG IN</Text>

                <View
                    style={[
                        styles.inputContainer,
                        focusedField === "email" && styles.inputContainerFocused,
                    ]}
                >
                    <TextInput
                        style={styles.fieldInput}
                        placeholder="Email"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                    />
                </View>

                <PasswordInput
                    containerStyle={[
                        styles.inputContainer,
                        styles.passwordInputContainer,
                        focusedField === "password" && styles.inputContainerFocused,
                    ]}
                    inputStyle={[styles.fieldInput, styles.passwordInput]}
                    buttonStyle={styles.passwordVisibilityButton}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                />

                <View style={styles.forgotPasswordRow}>
                    <Text
                        style={[styles.forgotPasswordText, isForgotPressed && styles.forgotPasswordTextPressed]}
                        onPress={() => router.push("/forgotPassword")}
                        onPressIn={() => setIsForgotPressed(true)}
                        onPressOut={() => setIsForgotPressed(false)}
                    >
                        Forgot Password?
                    </Text>
                </View>

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
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        height: 46,
        backgroundColor: "#eee",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        marginBottom: 14,
    },
    inputContainerFocused: {
        borderColor: "#e67e22",
    },
    fieldInput: {
        flex: 1,
        height: "100%",
        paddingHorizontal: 14,
        fontSize: 14,
        backgroundColor: "transparent",
        borderWidth: 0,
        ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
    },
    passwordInputContainer: {
        position: "relative",
        overflow: "hidden",
    },
    passwordInput: {
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
    forgotPasswordRow: {
        alignItems: "flex-end",
        marginBottom: 8,
    },
    forgotPasswordText: {
        color: "#333",
        fontWeight: "600",
        fontSize: 13,
    },
    forgotPasswordTextPressed: {
        color: "#e67e22",
    },
});