import { useCallback, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../frontend/context/AuthContext";
import { useList } from "../frontend/context/ListContext";
import { createTeam, getMyTeams, getTeamMembers, addMemberByEmail, removeMember } from "../backend/services/teamService";

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
    const router = useRouter();
    const { setActiveTeamId, refreshTeams } = useList();

    const [teams, setTeams] = useState([]);
    const [membersByTeam, setMembersByTeam] = useState({});
    const [loading, setLoading] = useState(true);

    const [newTeamName, setNewTeamName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const [emailInputs, setEmailInputs] = useState({});
    const [addingTeamId, setAddingTeamId] = useState(null);

    // only one team is expanded at a time
    const [expandedTeamId, setExpandedTeamId] = useState(null);

    // which team has its add-member field / remove buttons showing
    const [addOpenTeamId, setAddOpenTeamId] = useState(null);
    const [removeModeTeamId, setRemoveModeTeamId] = useState(null);

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
            await refreshTeams(); // keeps the Home chips in sync
        } catch (error) {
            console.error("Failed to load teams:", error);
            setTeams([]);
        } finally {
            setLoading(false);
        }
    }, [refreshTeams]);

    // Reload every time this screen is opened
    useFocusEffect(useCallback(() => {
        loadTeams();
    }, [loadTeams]));

    const toggleExpanded = (teamId) => {
        // collapsing or switching teams also hides the add field and remove buttons
        setAddOpenTeamId(null);
        setRemoveModeTeamId(null);
        setExpandedTeamId((current) => (current === teamId ? null : teamId));
    };

    const toggleAddField = (teamId) => {
        setRemoveModeTeamId(null);
        setAddOpenTeamId((current) => (current === teamId ? null : teamId));
    };

    const toggleRemoveMode = (teamId) => {
        setAddOpenTeamId(null);
        setRemoveModeTeamId((current) => (current === teamId ? null : teamId));
    };

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
            setAddOpenTeamId(null);
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

    const handleRemoveMember = async (team, memberId) => {
        try {
            await removeMember(team.id, memberId);
            await loadTeams();
        } catch (error) {
            console.error("removeMember failed:", error);
            showAlert("Error", "Couldn't remove that person. Please try again.");
        }
    };

    const openTeamList = (teamId) => {
        setActiveTeamId(teamId);
        router.replace("/");
    };

    const renderTeam = (team) => {
        const isOwner = team.ownerId === user?.uid;
        const isExpanded = expandedTeamId === team.id;
        const isAddOpen = addOpenTeamId === team.id;
        const isRemoveMode = removeModeTeamId === team.id;
        const members = membersByTeam[team.id] || [];

        let toggleLabel = isOwner ? "Edit" : "Members";
        if (isExpanded) {
            toggleLabel = isOwner ? "Done" : "Hide";
        }

        return (
            <View key={team.id} style={styles.teamCard}>
                <View style={styles.teamHeaderRow}>
                    <View style={styles.teamTitleBlock}>
                        <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>
                        <Text style={styles.roleBadge}>{isOwner ? "Owner" : "Member"}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={() => toggleExpanded(team.id)}
                    >
                        <Text style={styles.toggleButtonText}>{toggleLabel}</Text>
                    </TouchableOpacity>
                </View>

                {isExpanded && (
                    <View style={styles.expandedSection}>
                        <Text style={styles.membersLabel}>Members</Text>
                        {members.map((member) => (
                            <View key={member.id} style={styles.memberRow}>
                                <Text style={styles.memberName}>
                                    {member.displayName}{member.id === team.ownerId ? " (owner)" : ""}
                                </Text>
                                {member.email ? (
                                    <Text style={styles.memberEmail}>{member.email}</Text>
                                ) : null}

                                {isRemoveMode && member.id !== team.ownerId && (
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => handleRemoveMember(team, member.id)}
                                    >
                                        <Text style={styles.removeText}>Remove</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        {isOwner && !isAddOpen && (
                            <View style={styles.actionRow}>
                                {!isRemoveMode && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.addActionButton]}
                                        onPress={() => toggleAddField(team.id)}
                                    >
                                        <Text style={styles.actionButtonText}>Add member</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        isRemoveMode ? styles.doneActionButton : styles.removeActionButton,
                                    ]}
                                    onPress={() => toggleRemoveMode(team.id)}
                                >
                                    <Text style={isRemoveMode ? styles.doneActionButtonText : styles.actionButtonText}>
                                        {isRemoveMode ? "Done" : "Remove members"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {isOwner && isAddOpen && (
                            <View style={styles.addMemberRow}>
                                <TextInput
                                    style={[styles.input, styles.addMemberInput]}
                                    placeholder="Member's email"
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

                        {isOwner && isAddOpen && (
                            <TouchableOpacity
                                style={styles.cancelAddButton}
                                onPress={() => toggleAddField(team.id)}
                            >
                                <Text style={styles.cancelAddButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.openButton} onPress={() => openTeamList(team.id)}>
                            <Text style={styles.addButtonText}>Open this team's list</Text>
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
        gap: 12,
    },
    teamTitleBlock: {
        flex: 1,
    },
    teamName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
    },
    roleBadge: {
        fontSize: 12,
        fontWeight: "600",
        color: "#e67e22",
        marginTop: 2,
    },
    toggleButton: {
        backgroundColor: "#e67e22",
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    toggleButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    expandedSection: {
        borderTopWidth: 1,
        borderTopColor: "#ddd",
        marginTop: 14,
        paddingTop: 12,
    },
    membersLabel: {
        fontSize: 13,
        color: "#888",
        marginBottom: 8,
    },
    memberRow: {
        paddingBottom: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e2e2",
    },
    memberName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#222",
    },
    memberEmail: {
        fontSize: 13,
        color: "#666",
        marginTop: 2,
    },
    removeButton: {
        alignSelf: "flex-start",
        borderWidth: 1,
        borderColor: "#c0392b",
        borderRadius: 8,
        paddingVertical: 5,
        paddingHorizontal: 12,
        marginTop: 8,
    },
    removeText: {
        color: "#c0392b",
        fontWeight: "600",
        fontSize: 13,
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 4,
    },
    actionButton: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: "center",
    },
    addActionButton: {
        backgroundColor: "#4caf50",
    },
    removeActionButton: {
        backgroundColor: "#d9534f",
    },
    actionButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    doneActionButton: {
        backgroundColor: "#333",
    },
    doneActionButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
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
        backgroundColor: "#4caf50",
        borderRadius: 10,
        paddingHorizontal: 18,
        justifyContent: "center",
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15,
    },
     cancelAddButton: {
        backgroundColor: "#333",
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: "center",
        marginTop: 10,
    },
    cancelAddButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    openButton: {
        backgroundColor: "#e67e22",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 14,
    },
    emptyText: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
        marginTop: 20,
    },
});