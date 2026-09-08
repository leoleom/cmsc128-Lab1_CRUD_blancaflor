import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TaskCard from "../frontend/components/taskCard";
import { getTasksByDate, toggleTaskComplete } from "../backend/services/taskService";

export default function HomeScreen() {
  const [dueSoon, setDueSoon] = useState([]);
  const [finished, setFinished] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("dueSoon"); // "dueSoon" or "finished"

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
      await reloadTasks();
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={54} color="#333" />
        <Text style={styles.greeting}>Hello, XXXX!</Text>
      </View>

      {page === "dueSoon" ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>DUE SOON:</Text>

            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => console.log("Filter/Search pressed")}
              >
                <Ionicons name="options-outline" size={20} color="#333" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setPage(page === "dueSoon" ? "finished" : "dueSoon")}
              >
                <Ionicons
                  name={page === "dueSoon" ? "archive-outline" : "time-outline"}
                  size={20}
                  color="#333"
                />
              </TouchableOpacity>
            </View>
          </View>

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
        </>
      ) : (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>FINISHED TASKS:</Text>

            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => console.log("Filter/Search pressed")}
              >
                <Ionicons name="options-outline" size={20} color="#333" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setPage(page === "dueSoon" ? "finished" : "dueSoon")}
              >
                <Ionicons
                  name={page === "dueSoon" ? "archive-outline" : "time-outline"}
                  size={20}
                  color="#333"
                />
              </TouchableOpacity>
            </View>
          </View>

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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
  },
  topBar: {
    alignItems: "flex-end",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 25,
    gap: 10,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
  },
  taskListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  },
});