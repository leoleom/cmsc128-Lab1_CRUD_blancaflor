import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { getTasksByDate, getAllTaskDates, toggleTaskComplete } from "../backend/services/taskService";
import TaskCard from "../frontend/components/taskCard";

export default function CalendarScreen() {
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );
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
            await toggleTaskComplete(task.id, task.isDone);
            await loadTasks();
        } catch (error) {
            console.error("Failed to toggle task:", error);
        }
    };

    useEffect(() => {
        const loadMarkedDates = async () => {
            try {
                const dates = await getAllTaskDates();
                const marks = {};
                dates.forEach((date) => {
                    marks[date] = { marked: true, dotColor: "#e67e22" };
                });
                setMarkedDates(marks);
            } catch (error) {
                console.error("Failed to load marked dates:", error);
            }
        };

        loadMarkedDates();
    }, []);

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
