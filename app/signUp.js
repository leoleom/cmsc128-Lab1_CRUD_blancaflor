import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function Signup() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignup = () => {
        // TODO signup
        console.log("Signup pressed", { displayName, email, password });
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

                <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
                    <Text style={styles.buttonText}>Sign Up</Text>
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