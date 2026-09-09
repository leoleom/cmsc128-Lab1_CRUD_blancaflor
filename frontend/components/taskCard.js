import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const PRIORITY_COLORS = {
    urgent: "#C95656",
    high: "#E3764B",
    medium: "#dcc13b",
    low: "#5B9AE1",
};

const DONE_COLOR = "#f7f7f7";

function formatDueDate(dueDate) {
    if (!dueDate) return "";
    // Firestore Timestamp to JS Date
    const date = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yr = String(date.getFullYear());
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return `${mm}/${dd}/${yr}   |   ${hh}:${min}`;
}

function formatDateTime(value) {
    if (!value) return "Not available";
    const date = value.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return date.toLocaleString();
}

function normalizeTags(tags) {
    if (Array.isArray(tags)) return tags.map((tag) => tag.trim()).filter(Boolean);
    return typeof tags === "string"
        ? tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];
}

export default function TaskCard({ task, onToggleComplete, onArchive }) {
    const router = useRouter();
    const { id, title, details, dueDate, createdAt, isDone, priority, tags } = task;
    const taskTags = normalizeTags(tags);
    const [showDetails, setShowDetails] = useState(false);

    const backgroundColor = isDone
        ? DONE_COLOR
        : PRIORITY_COLORS[priority] || PRIORITY_COLORS.low;

    const handleEdit = () => {
        router.push({ pathname: "/editTask", params: { id } });
    };

    return (
        <View style={[styles.card, { backgroundColor }]}>
            <TouchableOpacity
                style={styles.checkbox}
                onPress={() => onToggleComplete(id)}
            >
                {isDone && <Ionicons name="checkmark" size={20} color="#000000" />}
            </TouchableOpacity>

            <View style={styles.textContainer}>
                <Text
                    style={[styles.title, isDone && styles.titleDone]}
                    numberOfLines={1}
                >
                    {title || "Untitled task"}
                </Text>
                <Text style={styles.subtitle}>{formatDueDate(dueDate)}</Text>
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
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderColor: "#000000",
        borderWidth: 1,
    },
    checkbox: {
        width: 30,
        height: 30,
        borderRadius: 16,
        backgroundColor: "#d9d9d9",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        borderColor: "#000000",
        borderWidth: 1,
    },
    textContainer: {
        flex: 1,
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
        fontSize: 12,
        color: "#444",
        marginTop: 2,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 8,
        paddingRight: 28,
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
        position: "absolute",
        top: 10,
        right: 10,
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        justifyContent: "flex-end",
        width: 76,
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