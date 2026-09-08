import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TaskCard from "../frontend/components/taskCard";
import { getTasksByDate, toggleTaskComplete } from "../backend/services/taskService";

export default function HomeScreen() {
  const [dueSoon, setDueSoon] = useState([]);
  const [finished, setFinished] = useState([]);
  const [loading, setLoading] = useState(false);

  const reloadTasks = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const tasks = await getTasksByDate(today);
      setDueSoon(tasks.filter(t => !t.isDone));
      setFinished(tasks.filter(t => t.isDone));
    } catch (error) {
      console.error("Failed to load tasks:", error);
      setDueSoon([]);
      setFinished([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadTasks();
  }, []);

  const handleToggleComplete = async (task) => {
    try {
      await toggleTaskComplete(task.id, task.isDone);
      await reloadTasks(); // refresh lists after update
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={50} color="#333" />
        <Text style={styles.greeting}>Hello, XXXX!</Text>
      </View>

      {/* Due Soon */}
      <Text style={styles.sectionTitle}>DUE SOON:</Text>
      <View style={styles.taskListContainer}>
        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : dueSoon.length === 0 ? (
          <Text style={styles.emptyText}>No tasks due today</Text>
        ) : (
          <FlatList
            data={dueSoon}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                onToggleComplete={() => handleToggleComplete(item)}
              />
            )}
            keyExtractor={item => item.id}
          />
        )}
      </View>

      {/* Finished Tasks */}
      <Text style={styles.sectionTitle}>FINISHED TASKS:</Text>
      <View style={styles.taskListContainer}>
        {finished.length === 0 ? (
          <Text style={styles.emptyText}>No finished tasks yet</Text>
        ) : (
          <FlatList
            data={finished}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                onToggleComplete={() => handleToggleComplete(item)}
              />
            )}
            keyExtractor={item => item.id}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  greeting: {
    position: "absolute",
    marginTop: 6,
    marginLeft: 65,
    fontSize: 30,
    fontWeight: "bold",
    color: "#000000",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginHorizontal: 16,
    marginTop: 12,
  },
  taskListContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  }
});
