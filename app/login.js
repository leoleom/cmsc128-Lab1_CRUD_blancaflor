import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { loginUser } from "../backend/services/authService";


export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isForgotPressed, setIsForgotPressed] = useState(false);

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

                <View
                    style={[
                        styles.inputContainer,
                        styles.passwordInputContainer,
                        focusedField === "password" && styles.inputContainerFocused,
                    ]}
                >
                    <TextInput
                        style={[styles.fieldInput, styles.passwordInput]}
                        placeholder="Password"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        underlineColorAndroid="transparent"
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                    />
                    <TouchableOpacity
                        style={styles.passwordVisibilityButton}
                        onPress={() => setShowPassword((visible) => !visible)}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                    >
                        <Ionicons
                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color="#555"
                        />
                    </TouchableOpacity>
                </View>

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