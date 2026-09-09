import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import TaskCard from "../frontend/components/taskCard";
import { deleteTask, getAllTasks, getTaskById, toggleTaskComplete } from "../backend/services/taskService";

const UNDO_DURATION = 5000;

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(tag => tag.trim()).filter(Boolean);
  return typeof tags === "string"
    ? tags.split(",").map(tag => tag.trim()).filter(Boolean)
    : [];
}

export default function HomeScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("dueSoon"); // "dueSoon" or "finished"
  const [sortBy, setSortBy] = useState("createdAt");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const deletionTimerRef = useRef(null);
  const handledDeleteIdRef = useRef(null);
  const { pendingDeleteId, createdTaskId } = useLocalSearchParams();

  const reloadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const tasks = await getAllTasks();
      setTasks(tasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    reloadTasks();
  }, [reloadTasks, createdTaskId]));

  useEffect(() => {
    if (!pendingDeleteId || handledDeleteIdRef.current === pendingDeleteId) return;

    handledDeleteIdRef.current = pendingDeleteId;
    let cancelled = false;

    const prepareDeletion = async () => {
      try {
        const task = await getTaskById(pendingDeleteId);
        if (cancelled || !task) return;

        setPendingDeletion(task);
        setTasks(currentTasks => currentTasks.filter(item => item.id !== task.id));
        deletionTimerRef.current = setTimeout(async () => {
          try {
            await deleteTask(task.id);
            setPendingDeletion(null);
            await reloadTasks();
          } catch (error) {
            console.error("Failed to finalize task deletion:", error);
            setPendingDeletion(task);
          }
        }, UNDO_DURATION);
      } catch (error) {
        console.error("Failed to prepare task deletion:", error);
      }
    };

    prepareDeletion();

    return () => {
      cancelled = true;
    };
  }, [pendingDeleteId, reloadTasks]);

  useEffect(() => () => {
    if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current);
  }, []);

  const handleUndoDelete = () => {
    if (!pendingDeletion) return;
    if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current);
    setTasks(currentTasks => [
      pendingDeletion,
      ...currentTasks.filter(task => task.id !== pendingDeletion.id),
    ]);
    setPendingDeletion(null);
  };

  const handleToggleComplete = async (task) => {
    try {
      await toggleTaskComplete(task.id, task.isDone);
      await reloadTasks();
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const priorities = ["urgent", "high", "medium", "low"];
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const tags = useMemo(
    () => [...new Set(tasks.flatMap(task => normalizeTags(task.tags)))].sort(),
    [tasks]
  );
  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      const taskTags = normalizeTags(task.tags);
      const matchesTag =
        selectedTags.length === 0 ||
        selectedTags.some(selectedTag => taskTags.includes(selectedTag));
      const matchesPriority = !selectedPriority || task.priority === selectedPriority;
      return matchesTag && matchesPriority;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "priority") {
        return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
      }
      if (sortBy === "tag") {
        return normalizeTags(a.tags).join(", ").localeCompare(normalizeTags(b.tags).join(", "));
      }
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const aDate = aValue?.toDate ? aValue.toDate().getTime() : new Date(aValue || 0).getTime();
      const bDate = bValue?.toDate ? bValue.toDate().getTime() : new Date(bValue || 0).getTime();
      return sortBy === "createdAt" ? bDate - aDate : aDate - bDate;
    });
  }, [tasks, selectedTags, selectedPriority, sortBy]);

  const displayedTasks = visibleTasks.filter(task =>
    task.id !== pendingDeletion?.id &&
    (page === "dueSoon" ? !task.isDone : task.isDone)
  );
  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedPriority("");
  };

  const toggleTag = (tag) => {
    setSelectedTags(currentTags =>
      currentTags.includes(tag)
        ? currentTags.filter(currentTag => currentTag !== tag)
        : [...currentTags, tag]
    );
  };

  const renderTaskList = () => (
    <View style={styles.taskListContainer}>
      {loading ? (
        <Text style={styles.emptyText}>Loading...</Text>
      ) : displayedTasks.length === 0 ? (
        <Text style={styles.emptyText}>
          {page === "dueSoon" ? "No tasks due today" : "No finished tasks yet"}
        </Text>
      ) : (
        <FlatList
          data={displayedTasks}
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
  );

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
                onPress={() => setShowFilters(true)}
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

          {renderTaskList()}
        </>
      ) : (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>FINISHED TASKS:</Text>

            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowFilters(true)}
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

          {renderTaskList()}
        </>
      )}

      {pendingDeletion && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>Task deleted</Text>
          <TouchableOpacity onPress={handleUndoDelete}>
            <Text style={styles.undoText}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showFilters} transparent animationType="fade" onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.filterPanel}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter and Sort</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.filterLabel}>Sort by</Text>
              <View style={styles.chipRow}>
                {[
                  ["createdAt", "Date Added"],
                  ["dueDate", "Due Date"],
                  ["priority", "Priority"],
                  ["tag", "Tag"],
                ].map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.chip, sortBy === value && styles.selectedChip]}
                    onPress={() => setSortBy(value)}
                  >
                    <Text style={sortBy === value ? styles.selectedChipText : styles.chipText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.filterLabel}>Filter by priority</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !selectedPriority && styles.selectedChip]}
                  onPress={() => setSelectedPriority("")}
                >
                  <Text style={!selectedPriority ? styles.selectedChipText : styles.chipText}>All</Text>
                </TouchableOpacity>
                {priorities.map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[styles.chip, selectedPriority === priority && styles.selectedChip]}
                    onPress={() => setSelectedPriority(priority)}
                  >
                    <Text style={selectedPriority === priority ? styles.selectedChipText : styles.chipText}>
                      {priority[0].toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.filterLabel}>Filter by tag</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, selectedTags.length === 0 && styles.selectedChip]}
                  onPress={() => setSelectedTags([])}
                >
                  <Text style={selectedTags.length === 0 ? styles.selectedChipText : styles.chipText}>All</Text>
                </TouchableOpacity>
                {tags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.chip, selectedTags.includes(tag) && styles.selectedChip]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={selectedTags.includes(tag) ? styles.selectedChipText : styles.chipText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  snackbar: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 120,
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: "#4c4a4a",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  snackbarText: {
    color: "#fff",
    fontSize: 14,
  },
  undoText: {
    color: "#C95656",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    padding: 20,
  },
  filterPanel: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  filterTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    color: "#333",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  selectedChip: {
    backgroundColor: "#e67e22",
    borderColor: "#e67e22",
  },
  chipText: {
    color: "#333",
  },
  selectedChipText: {
    color: "#fff",
    fontWeight: "bold",
  },
  clearButton: {
    alignItems: "center",
    paddingTop: 18,
  },
  clearButtonText: {
    color: "#e67e22",
    fontWeight: "bold",
  },
});