import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Dimensions, Keyboard, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getTaskById, updateTask } from "../backend/services/taskService";

const PRIORITY_OPTIONS = ["Urgent", "High", "Medium", "Low"];
const DATE_POPOVER_WIDTH = 320;

function capitalize(word) {
    if (!word) return "";
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export default function EditTask() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const priorityBoxRef = useRef(null);
    const dateBoxRef = useRef(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState(new Date());
    const [tags, setTags] = useState("");
    const [priority, setPriority] = useState("");
    const [details, setDetails] = useState("");
    const [isDetailsFocused, setIsDetailsFocused] = useState(false);

    const [showPriorityMenu, setShowPriorityMenu] = useState(false);
    const [priorityMenuPos, setPriorityMenuPos] = useState({ top: 0, left: 0, width: 0 });

    const [showDatePopover, setShowDatePopover] = useState(false);
    const [datePopoverPos, setDatePopoverPos] = useState({ top: 0, left: 0 });

    const [showTimePopover, setShowTimePopover] = useState(false);
    const [timePopoverPos, setTimePopoverPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const loadTask = async () => {
            try {
                const task = await getTaskById(id);
                if (!task) {
                    Alert.alert("Not found", "This task no longer exists.");
                    router.back();
                    return;
                }
                setTitle(task.title || "");
                setDetails(task.details || "");
                setPriority(capitalize(task.priority));
                setTags((task.tags || []).join(", "));
                if (task.dueDate) {
                    setDueDate(task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate));
                }
            } catch (error) {
                Alert.alert("Error", "Couldn't load this task.");
                router.back();
            } finally {
                setIsLoading(false);
            }
        };

        if (id) loadTask();
    }, [id]);

    const formattedDate = dueDate.toLocaleDateString();
    const formattedTime = dueDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    const openPriorityMenu = () => {
        priorityBoxRef.current.measureInWindow((x, y, width, height) => {
            setPriorityMenuPos({ top: y + height + 4, left: x, width });
            setShowPriorityMenu(true);
        });
    };

    const openDatePicker = () => {
        dateBoxRef.current.measureInWindow((x, y, width, height) => {
            const screenWidth = Dimensions.get("window").width;
            const clampedLeft = Math.min(x, screenWidth - DATE_POPOVER_WIDTH - 16);
            setDatePopoverPos({ top: y + height + 4, left: Math.max(clampedLeft, 16) });
            setShowDatePopover(true);
        });
    };

    const openTimePicker = () => {
        dateBoxRef.current.measureInWindow((x, y, width, height) => {
            const screenWidth = Dimensions.get("window").width;
            const clampedLeft = Math.min(x, screenWidth - DATE_POPOVER_WIDTH - 16);
            setTimePopoverPos({ top: y + height + 4, left: Math.max(clampedLeft, 16) });
            setShowTimePopover(true);
        });
    };

    const handleDateChange = (event, selectedDate) => {
        if (selectedDate) {
            const updated = new Date(dueDate);
            updated.setFullYear(selectedDate.getFullYear());
            updated.setMonth(selectedDate.getMonth());
            updated.setDate(selectedDate.getDate());
            setDueDate(updated);
        }
    };

    const handleTimeChange = (event, selectedTime) => {
        if (selectedTime) {
            const updated = new Date(dueDate);
            updated.setHours(selectedTime.getHours());
            updated.setMinutes(selectedTime.getMinutes());
            setDueDate(updated);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Missing title", "Please enter a task title.");
            return;
        }

        setIsSaving(true);
        try {
            await updateTask(id, { title, details, dueDate, priority, tags });
            router.push("/");
        } catch (error) {
            Alert.alert("Error", "Couldn't save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete task",
            "Are you sure you want to delete this task? This can't be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            router.replace({ pathname: "/", params: { pendingDeleteId: id } });
                        } catch (error) {
                            Alert.alert("Error", "Couldn't delete this task. Please try again.");
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const handleClose = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.form}>
                <View style={styles.headerRow}>
                    <View style={styles.headerSpacer} />
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Ionicons name="close" size={20} color="#333" />
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Task Title"
                    placeholderTextColor="#999"
                    value={title}
                    onChangeText={setTitle}
                />

                <View style={styles.row}>
                    <TouchableOpacity
                        ref={dateBoxRef}
                        style={[styles.input, styles.halfInput, styles.rowBetween]}
                        onPress={openDatePicker}
                    >
                        <Text style={styles.inputText}>{formattedDate}</Text>
                        <Ionicons name="calendar-outline" size={18} color="#555" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.input, styles.halfInput, styles.rowBetween]}
                        onPress={openTimePicker}
                    >
                        <Text style={styles.inputText}>{formattedTime}</Text>
                        <Ionicons name="time-outline" size={18} color="#555" />
                    </TouchableOpacity>
                </View>

                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="Tags"
                        placeholderTextColor="#999"
                        value={tags}
                        onChangeText={setTags}
                    />

                    <TouchableOpacity
                        ref={priorityBoxRef}
                        style={[styles.input, styles.halfInput, styles.rowBetween]}
                        onPress={openPriorityMenu}
                    >
                        <Text style={styles.inputText}>
                            {priority || "Priority"}
                        </Text>
                        <Ionicons name="chevron-down-outline" size={16} color="#555" />
                    </TouchableOpacity>
                </View>

                <View style={styles.textAreaWrapper}>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Task Details"
                        placeholderTextColor="#999"
                        value={details}
                        onChangeText={setDetails}
                        onFocus={() => setIsDetailsFocused(true)}
                        onBlur={() => setIsDetailsFocused(false)}
                        multiline
                        textAlignVertical="top"
                    />
                    {isDetailsFocused && (
                        <TouchableOpacity
                            style={styles.detailsDoneButton}
                            onPress={() => Keyboard.dismiss()}
                        >
                            <Text style={styles.detailsDoneText}>Done</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, styles.deleteButton]}
                        onPress={handleDelete}
                        disabled={isDeleting}
                    >
                        <Text style={styles.buttonText}>
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.saveButton]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        <Text style={styles.buttonText}>
                            {isSaving ? "Saving..." : "Save"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={showPriorityMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPriorityMenu(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowPriorityMenu(false)}
                >
                    <View
                        style={[
                            styles.anchoredMenu,
                            {
                                top: priorityMenuPos.top,
                                left: priorityMenuPos.left,
                                width: priorityMenuPos.width,
                            },
                        ]}
                    >
                        <FlatList
                            data={PRIORITY_OPTIONS}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => {
                                        setPriority(item);
                                        setShowPriorityMenu(false);
                                    }}
                                >
                                    <Text style={styles.menuItemText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={showDatePopover}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePopover(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDatePopover(false)}
                >
                    <View
                        style={[
                            styles.popover,
                            { top: datePopoverPos.top, left: datePopoverPos.left },
                        ]}
                    >
                        <DateTimePicker
                            value={dueDate}
                            mode="date"
                            display="spinner"
                            onValueChange={handleDateChange}
                            accentColor="#e67e22"
                            themeVariant="light"
                        />
                        <TouchableOpacity
                            style={styles.popoverDoneButton}
                            onPress={() => setShowDatePopover(false)}
                        >
                            <Text style={styles.popoverDoneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Time popover */}
            <Modal
                visible={showTimePopover}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTimePopover(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowTimePopover(false)}
                >
                    <View
                        style={[
                            styles.popover,
                            { top: timePopoverPos.top, left: timePopoverPos.left },
                        ]}
                    >
                        <DateTimePicker
                            value={dueDate}
                            mode="time"
                            display="spinner"
                            onValueChange={handleTimeChange}
                            accentColor="#e67e22"
                            themeVariant="light"
                        />
                        <TouchableOpacity
                            style={styles.popoverDoneButton}
                            onPress={() => setShowTimePopover(false)}
                        >
                            <Text style={styles.popoverDoneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f2f2f2",
    },
    centered: {
        justifyContent: "center",
        alignItems: "center",
    },
    form: {
        flex: 1,
        padding: 20,
        paddingTop: 20,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    headerSpacer: {
        flex: 1,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: "#ddd",
        justifyContent: "center",
        alignItems: "center",
    },
    input: {
        backgroundColor: "#eee",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 14,
    },
    inputText: {
        color: "#333",
        fontSize: 14,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    textAreaWrapper: {
        position: "relative",
        marginBottom: 20,
    },
    textArea: {
        backgroundColor: "#eee",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 14,
        height: 200,
    },
    detailsDoneButton: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "#fff",
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: "#ccc",
    },
    detailsDoneText: {
        color: "#e67e22",
        fontWeight: "600",
        fontSize: 13,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    deleteButton: {
        backgroundColor: "#d9534f",
    },
    saveButton: {
        backgroundColor: "#4caf50",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "transparent",
    },
    anchoredMenu: {
        position: "absolute",
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        paddingVertical: 4,
        elevation: 4,
        boxShadowColor: "#000",
        boxShadowOpacity: 0.15,
        boxShadowRadius: 4,
        boxShadowOffset: { width: 0, height: 2 },
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuItemText: {
        fontSize: 15,
        color: "#333",
    },
    popover: {
        position: "absolute",
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 8,
        elevation: 4,
        boxShadowColor: "#000",
        boxShadowOpacity: 0.15,
        boxShadowRadius: 4,
        boxShadowOffset: { width: 0, height: 2 },
    },
    popoverDoneButton: {
        alignSelf: "flex-end",
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    popoverDoneText: {
        color: "#e67e22",
        fontWeight: "600",
        fontSize: 15,
    },
});