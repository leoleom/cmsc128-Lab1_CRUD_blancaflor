import { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Dimensions, Keyboard, Alert} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createTask } from "../backend/services/taskService";

const PRIORITY_OPTIONS = ["Urgent", "High", "Medium", "Low"];
const DATE_POPOVER_WIDTH = 320;

export default function AddTask() {
    const router = useRouter();
    const priorityBoxRef = useRef(null);
    const dateBoxRef = useRef(null);

    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState(new Date());
    const [tags, setTags] = useState("");
    const [priority, setPriority] = useState("Low");
    const [details, setDetails] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDetailsFocused, setIsDetailsFocused] = useState(false);

    const [showPriorityMenu, setShowPriorityMenu] = useState(false);
    const [priorityMenuPos, setPriorityMenuPos] = useState({ top: 0, left: 0, width: 0 });

    const [showDatePopover, setShowDatePopover] = useState(false);
    const [datePopoverPos, setDatePopoverPos] = useState({ top: 0, left: 0 });

    const [showTimePopover, setShowTimePopover] = useState(false);
    const [timePopoverPos, setTimePopoverPos] = useState({ top: 0, left: 0 });

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

    // same spot, different picker
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
            Alert.alert("Please enter a task title.");
            return;
        }

        setIsSaving(true);
        try {
            const createdTask = await createTask({ title, details, dueDate, priority, tags });
            Alert.alert("Task saved!");
            router.replace({ pathname: "/", params: { createdTaskId: createdTask.id } });
        } catch (error) {
            console.error("handleSave failed:", error?.message || String(error));
            Alert.alert("Couldn't save the task. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        router.push("/");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.form}>
                <Text style={styles.screenTitle}>ADD TASK:</Text>

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
                        style={[styles.button, styles.cancelButton]}
                        onPress={handleCancel}
                    >
                        <Text style={styles.buttonText}>Cancel</Text>
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

            {/* Priority anchored dropdown */}
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

            {/* Date popover */}
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
        padding: 5,
        marginTop: 20,
    },
    form: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#000000",
        marginBottom: 20,
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
    cancelButton: {
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
    centered: {
        justifyContent: "center",
        alignItems: "center",
    },
});