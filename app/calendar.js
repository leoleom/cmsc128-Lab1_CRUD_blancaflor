import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { getTasksByDate, getTaskDatesForMonth, toggleTaskComplete } from "../backend/services/taskService";
import TaskCard from "../frontend/components/taskCard";
import { showAlert } from "../frontend/utils/alerts";

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function CalendarScreen() {
    const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));
    const [visibleMonth, setVisibleMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
    });
    const [tasks, setTasks] = useState([]);
    const [markedDates, setMarkedDates] = useState({});
    const [loading, setLoading] = useState(false);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const fetched = await getTasksByDate(selectedDate);
            setTasks(fetched);
        } catch (error) {
            console.error("Failed to load tasks:", error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [selectedDate]);

    const handleToggleComplete = async (task) => {
        try {
            // save the change, then flip only this task on screen instead of reloading
            await toggleTaskComplete(task.id, task.isDone);
            setTasks((currentTasks) =>
                currentTasks.map((item) =>
                    item.id === task.id ? { ...item, isDone: !task.isDone } : item
                )
            );
        } catch (error) {
            console.error("Failed to toggle task:", error);
            showAlert("Couldn't update task", "The task was not changed. Please try again.");
        }
    };

    useEffect(() => {
        let isCurrent = true;
        const loadMarkedDates = async () => {
            try {
                const dates = await getTaskDatesForMonth(visibleMonth.year, visibleMonth.month);
                const marks = {};
                dates.forEach((date) => {
                    marks[date] = { marked: true, dotColor: "#e67e22" };
                });
                if (isCurrent) setMarkedDates(marks);
            } catch (error) {
                console.error("Failed to load marked dates:", error);
            }
        };

        loadMarkedDates();
        return () => {
            isCurrent = false;
        };
    }, [visibleMonth]);

    const calendarMarkedDates = {
        ...markedDates,
        [selectedDate]: {
            ...(markedDates[selectedDate] || {}),
            selected: true,
            selectedColor: "#e67e22",
            marked: false,
        },
    };

    const monthNameHeader = (date) => {
        const header = date.toString("MMMM yyyy"); // format with XDate
        return (
            <Text style={styles.monthHeader}>
                {header}
            </Text>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Calendar
                current={selectedDate}
                onDayPress={(day) => setSelectedDate(day.dateString)}
                onMonthChange={({ year, month }) => setVisibleMonth({ year, month })}
                markedDates={calendarMarkedDates}
                renderHeader={monthNameHeader}
                renderArrow={(direction) => (
                    <Ionicons
                        name={direction === "left" ? "chevron-back" : "chevron-forward"}
                        size={20}
                        color="#e67e22"
                    />
                )}
                theme={{
                    todayTextColor: "#e67e22",
                    arrowColor: "#e67e22",
                    selectedDayBackgroundColor: "#e67e22",
                }}
            />

            <View style={styles.taskListContainer}>
                <Text style={styles.sectionTitle}>Tasks for {selectedDate}</Text>

                {loading ? (
                    <Text style={styles.emptyText}>Loading...</Text>
                ) : tasks.length === 0 ? (
                    <Text style={styles.emptyText}>No tasks for this day</Text>
                ) : (
                    <FlatList
                        data={tasks}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TaskCard
                                task={item}
                                onToggleComplete={() => handleToggleComplete(item)}
                            />
                        )}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    taskListContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
        marginTop: 20,
    },
    monthHeader: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#333",
        padding: 20,
    },
});
