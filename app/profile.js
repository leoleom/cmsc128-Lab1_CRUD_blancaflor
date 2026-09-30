import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { logoutUser, changeUserPassword, updateDisplayName, requestEmailChange } from "../backend/services/authService";
import { useAuth } from "../frontend/context/AuthContext";

function showAlert(title, message) {
    if (Platform.OS === "web") {
        window.alert(message ? `${title}\n\n${message}` : title);
    } else {
        const { Alert } = require("react-native");
        Alert.alert(title, message);
    }
}

function maskEmail(email) {
    if (!email) return "";
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    const visible = local.slice(0, 1);
    const hidden = "*".repeat(Math.max(local.length - 1, 3));
    return `${visible}${hidden}@${domain}`;
}

export default function Profile() {
    const { user } = useAuth();

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showNameModal, setShowNameModal] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState("");
    const [isSavingName, setIsSavingName] = useState(false);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [editEmail, setEditEmail] = useState("");
    const [editEmailPassword, setEditEmailPassword] = useState("");
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    const resetPasswordFields = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert("Missing info", "Please fill in all password fields.");
            return;
        }

        if (newPassword.length < 6) {
            showAlert("Weak password", "New password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert("Mismatch", "New password and confirmation don't match.");
            return;
        }

        setIsSubmitting(true);
        try {
            await changeUserPassword({ currentPassword, newPassword });
            setShowPasswordModal(false);
            resetPasswordFields();
            showAlert("Success", "Your password has been updated.");
        } catch (error) {
            if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
                showAlert("Incorrect password", "Your current password is wrong.");
            } else if (error.code === "auth/requires-recent-login") {
                showAlert("Please log in again", "For security, log out and back in, then retry.");
            } else {
                showAlert("Error", "Couldn't update your password. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const openNameModal = () => {
        setEditDisplayName(user?.displayName || "");
        setShowNameModal(true);
    };

    const closeNameModal = () => {
        setShowNameModal(false);
    };

    const handleSaveName = async () => {
        const trimmedName = editDisplayName.trim();

        if (!trimmedName) {
            showAlert("Missing name", "Please enter a display name.");
            return;
        }

        if (trimmedName === (user?.displayName || "")) {
            closeNameModal();
            return;
        }

        setIsSavingName(true);
        try {
            await updateDisplayName(trimmedName);
            showAlert("Success", "Your display name has been updated.");
            closeNameModal();
        } catch (error) {
            showAlert("Error", "Couldn't update your display name. Please try again.");
        } finally {
            setIsSavingName(false);
        }
    };

    const openEmailModal = () => {
        setEditEmail(user?.email || "");
        setEditEmailPassword("");
        setShowEmailModal(true);
    };

    const closeEmailModal = () => {
        setShowEmailModal(false);
        setEditEmailPassword("");
    };

    const handleSaveEmail = async () => {
        const trimmedEmail = editEmail.trim();

        if (!trimmedEmail) {
            showAlert("Missing email", "Please enter an email address.");
            return;
        }

        if (trimmedEmail === (user?.email || "")) {
            closeEmailModal();
            return;
        }

        if (!editEmailPassword) {
            showAlert("Password required", "Enter your current password to change your email.");
            return;
        }

        setIsSavingEmail(true);
        try {
            await requestEmailChange({ currentPassword: editEmailPassword, newEmail: trimmedEmail });
            showAlert(
                "Check your new email",
                "We sent a verification link to your new email address. Your email won't change until you confirm it there."
            );
            closeEmailModal();
        } catch (error) {
            if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
                showAlert("Incorrect password", "Your current password is wrong.");
            } else if (error.code === "auth/requires-recent-login") {
                showAlert("Please log in again", "For security, log out and back in, then retry.");
            } else if (error.code === "auth/email-already-in-use") {
                showAlert("Email taken", "That email is already registered to another account.");
            } else {
                showAlert("Error", `Couldn't update your email. (${error.code || error.message})`);
            }
        } finally {
            setIsSavingEmail(false);
        }
    };

    const performLogout = async () => {
        try {
            await logoutUser();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleLogout = () => {
        if (Platform.OS === "web") {
            if (window.confirm("Are you sure you want to log out?")) {
                performLogout();
            }
            return;
        }

        const { Alert } = require("react-native");
        Alert.alert(
            "Log out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Log out", style: "destructive", onPress: performLogout },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerRow}>
                <Text style={styles.screenTitle}>PROFILE</Text>
            </View>

            <View style={styles.avatarSection}>
                <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person-circle-outline" size={72} color="#333" />
                </View>
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.label}>Display Name</Text>
                <View style={styles.valueRow}>
                    <Text style={styles.value}>{user?.displayName || "Not set"}</Text>
                    <TouchableOpacity onPress={openNameModal}>
                        <Ionicons name="create-outline" size={22} color="#333" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Email</Text>
                <View style={styles.valueRow}>
                    <Text style={styles.value}>{maskEmail(user?.email)}</Text>
                    <TouchableOpacity onPress={openEmailModal}>
                        <Ionicons name="create-outline" size={22} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowPasswordModal(true)}
            >
                <Ionicons name="key-outline" size={18} color="#333" />
                <Text style={styles.actionButtonText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color="#fff" />
                <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>

            <Modal
                visible={showNameModal}
                transparent
                animationType="fade"
                onRequestClose={closeNameModal}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalPanel}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Display Name</Text>
                            <TouchableOpacity onPress={closeNameModal}>
                                <Ionicons name="close" size={22} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Display Name"
                            placeholderTextColor="#999"
                            value={editDisplayName}
                            onChangeText={setEditDisplayName}
                        />

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSaveName}
                            disabled={isSavingName}
                        >
                            <Text style={styles.saveButtonText}>
                                {isSavingName ? "Saving..." : "Save"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showEmailModal}
                transparent
                animationType="fade"
                onRequestClose={closeEmailModal}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalPanel}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Email</Text>
                            <TouchableOpacity onPress={closeEmailModal}>
                                <Ionicons name="close" size={22} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="New Email"
                            placeholderTextColor="#999"
                            value={editEmail}
                            onChangeText={setEditEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Current Password"
                            placeholderTextColor="#999"
                            value={editEmailPassword}
                            onChangeText={setEditEmailPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSaveEmail}
                            disabled={isSavingEmail}
                        >
                            <Text style={styles.saveButtonText}>
                                {isSavingEmail ? "Saving..." : "Save"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showPasswordModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalPanel}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                                <Ionicons name="close" size={22} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Current Password"
                            placeholderTextColor="#999"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            placeholderTextColor="#999"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            placeholderTextColor="#999"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleChangePassword}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.saveButtonText}>
                                {isSubmitting ? "Updating..." : "Update Password"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff"
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 24,
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#000"
    },
    avatarSection: {
        alignItems: "center",
        marginBottom: 24
    },
    avatarPlaceholder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "#e0e0e0",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    infoSection: {
        paddingHorizontal: 20,
        marginBottom: 24
    },
    label: {
        fontSize: 13,
        color: "#888",
        marginTop: 12,
    },
    valueRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    },
    value: {
        fontSize: 17,
        color: "#000",
        fontWeight: "600",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#e5e4e4",
        borderRadius: 10,
        paddingVertical: 14,
        marginHorizontal: 20,
        marginBottom: 12,
    },
    actionButtonText: {
        color: "#333",
        fontWeight: "600",
        fontSize: 15
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#d9534f",
        borderRadius: 10,
        paddingVertical: 14,
        marginHorizontal: 20,
    },
    logoutButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: 20,
    },
    modalPanel: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000"
    },
    input: {
        backgroundColor: "#eee",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
        fontSize: 14,
    },
    saveButton: {
        backgroundColor: "#4caf50",
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 4,
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15
    },
});