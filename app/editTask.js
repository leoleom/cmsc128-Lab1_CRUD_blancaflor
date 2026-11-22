import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getTaskById, updateTask } from "../backend/services/taskService";
import { getTeamById } from "../backend/services/teamService";
import { useAuth } from "../frontend/context/AuthContext";
import TaskForm from "../frontend/components/taskForm";
import { showAlert, confirmAction } from "../frontend/utils/alerts";

function capitalize(word) {
    if (!word) return "";
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export default function EditTask() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { user } = useAuth();

    const [initialValues, setInitialValues] = useState(null);
    const [canDelete, setCanDelete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const loadTask = async () => {
            try {
                // load the task, or leave if it is missing or not yours
                const task = await getTaskById(id);
                if (!task) {
                    showAlert("Not found", "This task no longer exists.");
                    router.back();
                    return;
                }

                // give the form the values it should start with
                setInitialValues({
                    title: task.title || "",
                    details: task.details || "",
                    priority: capitalize(task.priority),
                    tags: (task.tags || []).join(", "),
                    dueDate: task.dueDate
                        ? (task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate))
                        : new Date(),
                });

                // the creator or the team owner may delete the task
                let allowed = task.userId === user?.uid;
                if (!allowed && task.teamId) {
                    const team = await getTeamById(task.teamId);
                    allowed = team?.ownerId === user?.uid;
                }
                setCanDelete(allowed);
            } catch (error) {
                showAlert("Error", "Couldn't load this task.");
                router.back();
            } finally {
                setIsLoading(false);
            }
        };

        if (id) loadTask();
    }, [id]);

    const handleSave = async (values) => {
        try {
            // save the edits, then go back to Home
            await updateTask(id, values);
            router.push("/");
        } catch (error) {
            showAlert("Error", "Couldn't save changes. Please try again.");
        }
    };

    const handleDelete = () => {
        // ask first; Home then waits 5 seconds so the delete can be undone
        confirmAction(
            "Delete task",
            "Are you sure you want to delete this task? This can't be undone.",
            "Delete",
            () => {
                setIsDeleting(true);
                try {
                    router.replace({ pathname: "/", params: { pendingDeleteId: id } });
                } catch (error) {
                    showAlert("Error", "Couldn't delete this task. Please try again.");
                    setIsDeleting(false);
                }
            }
        );
    };

    // wait for the task to load before showing the form, so it never flashes empty
    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#e67e22" />
            </View>
        );
    }

    if (!initialValues) return null;

    return (
        <TaskForm
            screenTitle="EDIT TASK:"
            initialValues={initialValues}
            onSave={handleSave}
            onClose={() => router.back()}
            secondaryButton={
                canDelete
                    ? { label: isDeleting ? "Deleting..." : "Delete", onPress: handleDelete, disabled: isDeleting }
                    : null
            }
            footerNote={canDelete ? null : "Only the person who created this task or the team owner can delete it."}
        />
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
});