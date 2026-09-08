import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

export default function TaskCard({ task, onToggleComplete, onEdit, onArchive }) {
    const { id, title, dueDate, isDone, priority } = task;

    const backgroundColor = isDone
        ? DONE_COLOR
        : PRIORITY_COLORS[priority] || PRIORITY_COLORS.low;

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
            </View>

            <View style={styles.actions}>
                <TouchableOpacity onPress={() => onArchive(id)} style={styles.iconButton}>
                    <Ionicons name="file-tray-outline" size={20} color="#000000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onEdit(task)} style={styles.iconButton}>
                    <Ionicons name="create-outline" size={20} color="#000000" />
                </TouchableOpacity>
            </View>
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
    actions: {
        position: "absolute",   
        top: 10,                
        right: 10,              
        flexDirection: "row",
        gap: 8,
    },
    iconButton: {
        padding: 4,
    },
});
