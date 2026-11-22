import { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Dimensions, Keyboard, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { showAlert } from "../utils/alerts";

const PRIORITY_OPTIONS = ["Urgent", "High", "Medium", "Low"];
const DATE_POPOVER_WIDTH = 320;

function openPopoverBelow(boxRef, keepOnScreen, setPosition, setVisible) {
    // find where the box is on screen, then place the popup just below it
    boxRef.current.measureInWindow((x, y, width, height) => {
        let left = x;
        let popoverWidth = width;

        // the date and time popups are wide, so keep them inside the screen
        if (keepOnScreen) {
            const screenWidth = Dimensions.get("window").width;
            const sideInset = Math.min(16, screenWidth / 2);
            popoverWidth = Math.min(DATE_POPOVER_WIDTH, screenWidth - sideInset * 2);
            left = Math.max(
                Math.min(x, screenWidth - popoverWidth - sideInset),
                sideInset
            );
        }

        setPosition({ top: y + height + 4, left, width: popoverWidth });
        setVisible(true);
    });
}

function PickerPopover({ visible, position, mode, value, onChange, onClose }) {
    // one popup used for both the date picker and the time picker
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.popover, { top: position.top, left: position.left, width: position.width }]}>
                    <DateTimePicker
                        value={value}
                        mode={mode}
                        display="spinner"
                        onValueChange={onChange}
                        accentColor="#e67e22"
                        themeVariant="light"
                    />
                    <TouchableOpacity style={styles.popoverDoneButton} onPress={onClose}>
                        <Text style={styles.popoverDoneText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

export default function TaskForm({ screenTitle, initialValues, onSave, onClose, secondaryButton, footerNote }) {
    const priorityBoxRef = useRef(null);
    const dateBoxRef = useRef(null);
    const timeBoxRef = useRef(null);

    // start from the values the screen gives us (empty for a new task)
    const [title, setTitle] = useState(initialValues?.title ?? "");
    const [dueDate, setDueDate] = useState(() => initialValues?.dueDate ?? new Date());
    const [tags, setTags] = useState(initialValues?.tags ?? "");
    const [priority, setPriority] = useState(initialValues?.priority ?? "Low");
    const [details, setDetails] = useState(initialValues?.details ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [isDetailsFocused, setIsDetailsFocused] = useState(false);

    const [showPriorityMenu, setShowPriorityMenu] = useState(false);
    const [priorityMenuPos, setPriorityMenuPos] = useState({ top: 0, left: 0, width: 0 });

    const [showDatePopover, setShowDatePopover] = useState(false);
    const [datePopoverPos, setDatePopoverPos] = useState({ top: 0, left: 0, width: DATE_POPOVER_WIDTH });

    const [showTimePopover, setShowTimePopover] = useState(false);
    const [timePopoverPos, setTimePopoverPos] = useState({ top: 0, left: 0, width: DATE_POPOVER_WIDTH });

    const formattedDate = dueDate.toLocaleDateString();
    const formattedTime = dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const handleDateChange = (event, selectedDate) => {
        // keep the chosen time, replace only the year, month, and day
        if (selectedDate) {
            const updated = new Date(dueDate);
            updated.setFullYear(selectedDate.getFullYear());
            updated.setMonth(selectedDate.getMonth());
            updated.setDate(selectedDate.getDate());
            setDueDate(updated);
        }
    };

    const handleTimeChange = (event, selectedTime) => {
        // keep the chosen day, replace only the hour and minute
        if (selectedTime) {
            const updated = new Date(dueDate);
            updated.setHours(selectedTime.getHours());
            updated.setMinutes(selectedTime.getMinutes());
            setDueDate(updated);
        }
    };

    const handleSave = async () => {
        // a task needs a title
        if (!title.trim()) {
            showAlert("Missing title", "Please enter a task title.");
            return;
        }

        // hand the values to the screen; it decides how to save them
        setIsSaving(true);
        try {
            await onSave({ title, details, dueDate, priority, tags });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.form}>
                    <View style={styles.headerRow}>
                        <Text style={styles.screenTitle}>{screenTitle}</Text>
                        {onClose && (
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Ionicons name="close" size={20} color="#333" />
                            </TouchableOpacity>
                        )}
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
                            onPress={() => openPopoverBelow(dateBoxRef, true, setDatePopoverPos, setShowDatePopover)}
                        >
                            <Text style={styles.inputText}>{formattedDate}</Text>
                            <Ionicons name="calendar-outline" size={18} color="#555" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            ref={timeBoxRef}
                            style={[styles.input, styles.halfInput, styles.rowBetween]}
                            onPress={() => openPopoverBelow(timeBoxRef, true, setTimePopoverPos, setShowTimePopover)}
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
                            onPress={() => openPopoverBelow(priorityBoxRef, false, setPriorityMenuPos, setShowPriorityMenu)}
                        >
                            <Text style={styles.inputText}>{priority || "Priority"}</Text>
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
                            <TouchableOpacity style={styles.detailsDoneButton} onPress={() => Keyboard.dismiss()}>
                                <Text style={styles.detailsDoneText}>Done</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.buttonRow}>
                        {secondaryButton && (
                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton]}
                                onPress={secondaryButton.onPress}
                                disabled={secondaryButton.disabled}
                            >
                                <Text style={styles.buttonText}>{secondaryButton.label}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            <Text style={styles.buttonText}>{isSaving ? "Saving..." : "Save"}</Text>
                        </TouchableOpacity>
                    </View>

                    {footerNote ? <Text style={styles.footerNote}>{footerNote}</Text> : null}
                </View>
            </ScrollView>

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
                            { top: priorityMenuPos.top, left: priorityMenuPos.left, width: priorityMenuPos.width },
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

            <PickerPopover
                visible={showDatePopover}
                position={datePopoverPos}
                mode="date"
                value={dueDate}
                onChange={handleDateChange}
                onClose={() => setShowDatePopover(false)}
            />

            <PickerPopover
                visible={showTimePopover}
                position={timePopoverPos}
                mode="time"
                value={dueDate}
                onChange={handleTimeChange}
                onClose={() => setShowTimePopover(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    form: {
        flexGrow: 1,
        width: "100%",
        maxWidth: 720,
        alignSelf: "center",
        padding: 20,
        paddingTop: 24,
        justifyContent: "center",
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#000000",
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
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 12,
    },
    halfInput: {
        flex: 1,
        minWidth: 140,
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
    secondaryButton: {
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
    footerNote: {
        marginTop: 12,
        fontSize: 12,
        color: "#888",
        textAlign: "center",
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