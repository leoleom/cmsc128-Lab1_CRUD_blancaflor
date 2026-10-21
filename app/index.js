import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, Platform } from "react-native"; import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import TaskCard from "../frontend/components/taskCard";
import { deleteTask, getAllTasks, getTaskById, toggleTaskComplete } from "../backend/services/taskService";
import { useAuth } from "../frontend/context/AuthContext";
import { useList } from "../frontend/context/ListContext";

const UNDO_DURATION = 5000;

function showAlert(title, message) {
  // Alert.alert does nothing on web, so use the browser alert there
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(tag => tag.trim()).filter(Boolean);
  return typeof tags === "string"
    ? tags.split(",").map(tag => tag.trim()).filter(Boolean)
    : [];
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { activeTeamId, setActiveTeamId, teams, refreshTeams } = useList();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("dueSoon"); // "dueSoon" or "finished"
  const [sortBy, setSortBy] = useState("createdAt");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const deletionTimerRef = useRef(null);
  const handledDeleteIdRef = useRef(null);
  const { pendingDeleteId, createdTaskId } = useLocalSearchParams();

  const router = useRouter();

  const reloadTasks = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await getAllTasks(activeTeamId));
    } catch (error) {
      console.error("Failed to load tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [activeTeamId]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadData = async () => {
        await refreshTeams();

        if (!cancelled) {
          await reloadTasks();
        }
      };

      loadData();

      return () => {
        cancelled = true;
      };
    }, [refreshTeams, reloadTasks, createdTaskId])
  );

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
            setPendingDeletion(null);
            await reloadTasks();
            showAlert(
              "Task not deleted",
              "This task was not deleted. Only its creator or the team owner can delete a team task. If that's you, please try again."
            );
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

  const activeListName = teams.find((team) => team.id === activeTeamId)?.name || "Personal";

  const selectList = (teamId) => {
    setActiveTeamId(teamId);
    clearFilters(); // tags from the previous list would hide tasks in the new one
    setShowListMenu(false);
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
        <Text style={styles.greeting} numberOfLines={1}>
          Hello, {user?.displayName || user?.email || "there"}!
        </Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/profile")}>
          <Ionicons name="settings-outline" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.listSelector}
        onPress={() => setShowListMenu(true)}
      >
        <Ionicons name={activeTeamId ? "people" : "person"} size={18} color="#333" />
        <Text style={styles.listSelectorText} numberOfLines={1}>{activeListName}</Text>
        <Ionicons name="chevron-down" size={18} color="#333" />
      </TouchableOpacity>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>
          {page === "dueSoon" ? "DUE SOON:" : "FINISHED TASKS:"}
        </Text>

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

      <Modal visible={showListMenu} transparent animationType="fade" onRequestClose={() => setShowListMenu(false)}>
        <TouchableOpacity
          style={styles.listMenuBackdrop}
          activeOpacity={1}
          onPress={() => setShowListMenu(false)}
        >
          <View style={styles.listMenuPanel}>
            <Text style={styles.listMenuTitle}>Switch Team</Text>

            <ScrollView>
              {[{ id: null, name: "Personal" }, ...teams].map((list) => {
                const isActive = activeTeamId === list.id;
                return (
                  <TouchableOpacity
                    key={list.id ?? "personal"}
                    style={[styles.listMenuItem, isActive && styles.listMenuItemActive]}
                    onPress={() => selectList(list.id)}
                  >
                    <Ionicons
                      name={list.id ? "people-outline" : "person-outline"}
                      size={20}
                      color={isActive ? "#fff" : "#333"}
                    />
                    <Text
                      style={isActive ? styles.listMenuItemTextActive : styles.listMenuItemText}
                      numberOfLines={1}
                    >
                      {list.name}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={20} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.manageTeamsButton}
              onPress={() => {
                setShowListMenu(false);
                router.push("/teams");
              }}
            >
              <Text style={styles.manageTeamsText}>Manage teams</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 25,
    gap: 10,
  },
  greeting: {
    flex: 1,
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
  },
  listSelector: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "#E5E5EA",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 15,
    maxWidth: "80%",
  },
  listSelectorText: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  listMenuBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    padding: 20,
  },
  listMenuPanel: {
    width: "100%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  listMenuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
  },
  listMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
    backgroundColor: "#f2f2f2",
  },
  listMenuItemActive: {
    backgroundColor: "#e67e22",
  },
  listMenuItemText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  listMenuItemTextActive: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff",
  },
  manageTeamsButton: {
    alignItems: "center",
    paddingTop: 14,
  },
  manageTeamsText: {
    color: "#e67e22",
    fontWeight: "bold",
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