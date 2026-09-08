import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

// getter
export async function getTaskById(taskId) {
    try {
        const taskRef = doc(db, "tasks", taskId);
        const snapshot = await getDoc(taskRef);
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
        console.error("getTaskById failed:", error);
        throw error;
    }
}

// update
export async function updateTask(taskId, { title, details, dueDate, priority, tags }) {
    try {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
            title: title.trim(),
            details: details.trim(),
            dueDate: Timestamp.fromDate(dueDate),
            priority: priority.toLowerCase(),
            tags: tags
                ? tags.split(",").map((t) => t.trim()).filter(Boolean)
                : [],
        });
    } catch (error) {
        console.error("updateTask failed:", error);
        throw error;
    }
}

// delete
export async function deleteTask(taskId) {
    try {
        const taskRef = doc(db, "tasks", taskId);
        await deleteDoc(taskRef);
    } catch (error) {
        console.error("deleteTask failed:", error);
        throw error;
    }
}

// create 
export async function createTask({ title, details, dueDate, priority, tags }) {
    try {
        const tasksRef = collection(db, "tasks");

        const newTask = {
            title: title.trim(),
            details: details.trim(),
            dueDate: Timestamp.fromDate(dueDate),
            priority: priority.toLowerCase(), 
            tags: tags
                ? tags.split(",").map((t) => t.trim()).filter(Boolean)
                : [],
            isDone: false,
        };

        const docRef = await addDoc(tasksRef, newTask);
        return { id: docRef.id, ...newTask };
    } catch (error) {
        console.error("createTask failed:", error);
        throw error;
    }
}

