import { useRouter } from "expo-router";
import { createTask } from "../backend/services/taskService";
import { useList } from "../frontend/context/ListContext";
import TaskForm from "../frontend/components/taskForm";
import { showAlert } from "../frontend/utils/alerts";

export default function AddTask() {
    const router = useRouter();
    const { activeTeamId } = useList();

    const handleSave = async (values) => {
        try {
            // save the task into the list that is open on Home, then go back there
            const createdTask = await createTask({ ...values, teamId: activeTeamId });
            showAlert("Task saved!");
            router.replace({ pathname: "/", params: { createdTaskId: createdTask.id } });
        } catch (error) {
            console.error("handleSave failed:", error?.message || String(error));
            showAlert("Couldn't save the task. Please try again.");
        }
    };

    return (
        <TaskForm
            screenTitle="ADD TASK:"
            onSave={handleSave}
            secondaryButton={{ label: "Cancel", onPress: () => router.push("/") }}
        />
    );
}