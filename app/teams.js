import { useCallback, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../frontend/context/AuthContext";
import { createTeam, getMyTeams, getTeamMembers, addMemberByEmail } from "../backend/services/teamService";

function showAlert(title, message) {
    // Alert.alert does nothing on web, so use the browser alert there
    if (Platform.OS === "web") {
        window.alert(message ? `${title}\n\n${message}` : title);
    } else {
        Alert.alert(title, message);
    }
}

export default function Teams() {
    const { user } = useAuth();

    const [teams, setTeams] = useState([]);
    const [membersByTeam, setMembersByTeam] = useState({});
    const [loading, setLoading] = useState(true);

    const [newTeamName, setNewTeamName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const [emailInputs, setEmailInputs] = useState({});
    const [addingTeamId, setAddingTeamId] = useState(null);

    const loadTeams = useCallback(async () => {
        try {
            // Get my teams, then get the members of each one
            const fetched = await getMyTeams();
            const members = {};
            for (let i = 0; i < fetched.length; i++) {
                members[fetched[i].id] = await getTeamMembers(fetched[i].memberIds);
            }
            setTeams(fetched);
            setMembersByTeam(members);
        } catch (error) {
            console.error("Failed to load teams:", error);
            setTeams([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Reload every time this screen is opened
    useFocusEffect(useCallback(() => {
        loadTeams();
    }, [loadTeams]));

    const handleCreateTeam = async () => {
        // A team needs a name
        if (!newTeamName.trim()) {
            showAlert("Missing name", "Please enter a team name.");
            return;
        }

        setIsCreating(true);
        try {
            await createTeam(newTeamName);
            setNewTeamName("");
            await loadTeams();
        } catch (error) {
            showAlert("Error", "Couldn't create the team. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleAddMember = async (team) => {
        // The email must not be empty
        const email = (emailInputs[team.id] || "").trim();
        if (!email) {
            showAlert("Missing email", "Please enter the email of the person to add.");
            return;
        }

        setAddingTeamId(team.id);
        try {
            await addMemberByEmail(team.id, email);
            setEmailInputs((current) => ({ ...current, [team.id]: "" }));
            await loadTeams();
            showAlert("Member added", "They can now see this team.");
        } catch (error) {
            // Show a clear message for each known problem
            if (error.code === "team/user-not-found") {
                showAlert("Not found", "No account has that email. They need to sign up and log in at least once.");
            } else if (error.code === "team/already-member") {
                showAlert("Already added", "That person is already in this team.");
            } else if (error.code === "team/not-owner") {
                showAlert("Not allowed", "Only the team owner can add members.");
            } else {
                console.error("addMemberByEmail failed:", error);
                showAlert("Error", "Couldn't add that person. Please try again.");
            }
        } finally {
            setAddingTeamId(null);
        }
    };

    const renderTeam = (team) => {
        const isOwner = team.ownerId === user?.uid;
        const members = membersByTeam[team.id] || [];

        return (
            <View key={team.id} style={styles.teamCard}>
                <View style={styles.teamHeaderRow}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.roleBadge}>{isOwner ? "Owner" : "Member"}</Text>
                </View>

                <Text style={styles.membersLabel}>Members</Text>
                {members.map((member) => (
                    <Text key={member.id} style={styles.memberName}>
                        {member.displayName}{member.id === team.ownerId ? " (owner)" : ""}
                    </Text>
                ))}

                {isOwner && (
                    <View style={styles.addMemberRow}>
                        <TextInput
                            style={[styles.input, styles.addMemberInput]}
                            placeholder="Add member by email"
                            placeholderTextColor="#999"
                            value={emailInputs[team.id] || ""}
                            onChangeText={(text) => setEmailInputs((current) => ({ ...current, [team.id]: text }))}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => handleAddMember(team)}
                            disabled={addingTeamId === team.id}
                        >
                            <Text style={styles.addButtonText}>
                                {addingTeamId === team.id ? "..." : "Add"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.screenTitle}>TEAMS</Text>

                <View style={styles.createRow}>
                    <TextInput
                        style={[styles.input, styles.createInput]}
                        placeholder="New team name"
                        placeholderTextColor="#999"
                        value={newTeamName}
                        onChangeText={setNewTeamName}
                    />
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleCreateTeam}
                        disabled={isCreating}
                    >
                        <Text style={styles.createButtonText}>
                            {isCreating ? "..." : "Create"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <Text style={styles.emptyText}>Loading...</Text>
                ) : teams.length === 0 ? (
                    <Text style={styles.emptyText}>You're not in any teams yet.</Text>
                ) : (
                    teams.map(renderTeam)
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    content: {
        padding: 20,
        paddingBottom: 140,
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 20,
    },
    createRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
    },
    input: {
        backgroundColor: "#eee",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
    },
    createInput: {
        flex: 1,
    },
    createButton: {
        backgroundColor: "#4caf50",
        borderRadius: 10,
        paddingHorizontal: 18,
        justifyContent: "center",
    },
    createButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15,
    },
    teamCard: {
        backgroundColor: "#f2f2f2",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 16,
        marginBottom: 14,
    },
    teamHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    teamName: {
        flex: 1,
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
    },
    roleBadge: {
        fontSize: 12,
        fontWeight: "600",
        color: "#e67e22",
    },
    membersLabel: {
        fontSize: 13,
        color: "#888",
        marginBottom: 4,
    },
    memberName: {
        fontSize: 15,
        color: "#222",
        marginBottom: 2,
    },
    addMemberRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 12,
    },
    addMemberInput: {
        flex: 1,
    },
    addButton: {
        backgroundColor: "#e67e22",
        borderRadius: 10,
        paddingHorizontal: 18,
        justifyContent: "center",
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15,
    },
    emptyText: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
        marginTop: 20,
    },
});