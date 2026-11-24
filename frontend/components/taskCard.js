import { useState, useEffect } from "react";
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { formatDueDate, formatDateTime } from "../utils/formatDate";
import { normalizeTags } from "../utils/tags";
import { useAuth } from "../context/AuthContext";
import { getUserDisplayName } from "../../backend/services/userService";


const PRIORITY_COLORS = {
    urgent: "#C95656",
    high: "#E3764B",
    medium: "#dcc13b",
    low: "#5B9AE1",
};

export default function TaskCard({ task, onToggleComplete }) {
    const router = useRouter();
    const { user } = useAuth();
    const { id, userId, teamId, title, details, dueDate, createdAt, isDone, priority, tags } = task;
    const taskTags = normalizeTags(tags);
    const [showDetails, setShowDetails] = useState(false);
    const [ownerName, setOwnerName] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // Only look up the owner for team tasks, and only when the window is open
        if (!showDetails || !teamId || !userId) return;

        // Your own tasks say "You", so no lookup is needed
        if (userId === user?.uid) {
            setOwnerName("You");
            return;
        }

        // Otherwise read the owner's name from the users collection
        let cancelled = false;
        getUserDisplayName(userId).then((name) => {
            if (!cancelled) setOwnerName(name);
        }).catch(() => {
            if (!cancelled) setOwnerName("Name unavailable");
        });

        // Ignore the result if the window closes before it arrives
        return () => {
            cancelled = true;
        };
    }, [showDetails, teamId, userId, user?.uid]);

    const priorityKey = priority?.toLowerCase() || "low";
    const priorityColor = PRIORITY_COLORS[priorityKey] || PRIORITY_COLORS.low;
    const priorityLabel = priorityKey.charAt(0).toUpperCase() + priorityKey.slice(1);

    const handleEdit = () => {
        router.push({ pathname: "/editTask", params: { taskId: id } });
    };

    const handleToggleComplete = async () => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            await onToggleComplete(id);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <View
            style={[
                styles.card,
                !isDone && { backgroundColor: priorityColor },
                isDone && styles.cardDone,
            ]}
        >
            <View style={[styles.mainSurface, isDone && styles.mainSurfaceDone]} />
            <View style={styles.priorityPanel}>
                <TouchableOpacity
                    style={[styles.checkbox, isUpdating && styles.disabledCheckbox]}
                    onPress={handleToggleComplete}
                    disabled={isUpdating}
                    accessibilityRole="button"
                    accessibilityLabel={isUpdating ? "Updating task" : isDone ? "Mark task incomplete" : "Mark task complete"}
                >
                    {isUpdating ? (
                        <ActivityIndicator size="small" color="#333" />
                    ) : isDone ? (
                        <Ionicons name="checkmark" size={20} color="#000000" />
                    ) : null}
                </TouchableOpacity>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View style={styles.textContainer}>
                        <Text
                            style={[styles.title, isDone && styles.titleDone]}
                            numberOfLines={1}
                        >
                            {title || "Untitled task"}
                        </Text>
                        <View style={styles.metaRow}>
                            <Text style={styles.subtitle} numberOfLines={1}>
                                {formatDueDate(dueDate)}
                            </Text>
                            <View style={[styles.priorityBadge, { borderColor: priorityColor }]}>
                                <Text style={[styles.priorityLabel, { color: priorityColor }]}>
                                    {priorityLabel}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => setShowDetails(true)} style={styles.iconButton}>
                            <Ionicons
                                name="information-circle-outline"
                                size={25}
                                color="#000000"
                                style={styles.infoIcon}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleEdit} style={styles.iconButton}>
                            <Ionicons name="create-outline" size={25} color="#000000" />
                        </TouchableOpacity>
                    </View>
                </View>
                {taskTags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {taskTags.map((tag, index) => (
                            <View key={`${tag}-${index}`} style={styles.tag}>
                                <Text style={styles.tagText}>#{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <Modal
                visible={showDetails}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDetails(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.detailsPanel}>
                        <View style={styles.detailsHeader}>
                            <Text style={styles.detailsTitle}>{title || "Untitled task"}</Text>
                            <TouchableOpacity onPress={() => setShowDetails(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <Text style={styles.detailsLabel}>Description</Text>
                            <Text style={styles.detailsText}>
                                {details?.trim() || "No details added for this task."}
                            </Text>
                            <View style={styles.metadata}>
                                <Text style={styles.detailsLabel}>Task information</Text>
                                {teamId ? (
                                    <Text style={styles.metadataText}>
                                        <Text style={styles.metadataLabel}>Owner: </Text>
                                        {ownerName || "Loading..."}
                                    </Text>
                                ) : null}
                                <Text style={styles.metadataText}>
                                    <Text style={styles.metadataLabel}>Tags: </Text>
                                    {taskTags.length > 0 ? taskTags.map((tag) => `#${tag}`).join(", ") : "None"}
                                </Text>
                                <Text style={styles.metadataText}>
                                    <Text style={styles.metadataLabel}>Priority: </Text>
                                    {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "Low"}
                                </Text>
                                <Text style={styles.metadataText}>
                                    <Text style={styles.metadataLabel}>Due date: </Text>
                                    {formatDateTime(dueDate)}
                                </Text>
                                <Text style={styles.metadataText}>
                                    <Text style={styles.metadataLabel}>Date created: </Text>
                                    {formatDateTime(createdAt)}
                                </Text>
                                <Text style={styles.metadataText}>
                                    <Text style={styles.metadataLabel}>Status: </Text>
                                    {isDone ? "Completed" : "Not completed"}
                                </Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}


const styles = StyleSheet.create({
    card: {
        position: "relative",
        backgroundColor: "#f4f4f4",
        borderRadius: 16,
        padding: 20,
        paddingLeft: 88,
        paddingRight: 16,
        marginBottom: 12,
        borderColor: "#707070",
        borderWidth: 1.5,
    },
    cardDone: {
        backgroundColor: "#f7f7f7",
    },
    mainSurface: {
        position: "absolute",
        left: 76,
        top: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#f4f4f4",
        borderTopRightRadius: 14.5,
        borderBottomRightRadius: 14.5,
    },
    mainSurfaceDone: {
        backgroundColor: "#f7f7f7",
    },
    priorityPanel: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 76,
        borderTopLeftRadius: 14.5,
        borderBottomLeftRadius: 14.5,
        borderRightWidth: 1.5,
        borderRightColor: "#555",
        justifyContent: "center",
        alignItems: "center",
    },
    checkbox: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#d9d9d9",
        justifyContent: "center",
        alignItems: "center",
        borderColor: "#000000",
        borderWidth: 1,
    },
    disabledCheckbox: {
        opacity: 0.6,
    },
    cardContent: {
        flex: 1,
        minWidth: 0,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    textContainer: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#222",
    },
    titleDone: {
        color: "#888",
        textDecorationLine: "line-through",
    },
    subtitle: {
        fontSize: 10,
        color: "#444",
        flexShrink: 1,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "nowrap",
        gap: 4,
        marginTop: 3,
    },
    priorityBadge: {
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
        flexShrink: 0,
    },
    priorityLabel: {
        fontSize: 9,
        fontWeight: "600",
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 8,
    },
    tag: {
        backgroundColor: "#dedddd",
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    tagText: {
        fontSize: 11,
        color: "#333",
    },
    actions: {
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        justifyContent: "flex-end",
        width: 76,
        flexShrink: 0,
    },
    iconButton: {
        width: 36,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 4,
    },
    infoIcon: {
        transform: [{ translateY: 1 }],
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: 20,
    },
    detailsPanel: {
        width: "100%",
        maxHeight: "75%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 24,
    },
    detailsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        marginBottom: 18,
    },
    detailsTitle: {
        flex: 1,
        fontSize: 22,
        fontWeight: "bold",
        color: "#000",
    },
    detailsLabel: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#666",
        marginBottom: 8,
    },
    detailsText: {
        fontSize: 16,
        lineHeight: 24,
        color: "#333",
    },
    metadata: {
        borderTopWidth: 1,
        borderTopColor: "#e5e5e5",
        marginTop: 20,
        paddingTop: 16,
    },
    metadataText: {
        color: "#333",
        fontSize: 14,
        lineHeight: 24,
    },
    metadataLabel: {
        fontWeight: "bold",
    },
});