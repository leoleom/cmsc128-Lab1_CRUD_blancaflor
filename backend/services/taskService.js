import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// returns the logged-in user's id, or null if nobody is logged in
function getCurrentUid() {
    return auth.currentUser ? auth.currentUser.uid : null;
}

// getter
export async function getTaskById(taskId) {
    try {
        const uid = getCurrentUid();
        if (!uid) return null;

        const taskRef = doc(db, "tasks", taskId);
        const snapshot = await getDoc(taskRef);
        if (!snapshot.exists()) return null;

        const data = snapshot.data();
        if (data.userId !== uid) return null;

        return { id: snapshot.id, ...data };
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
        const uid = getCurrentUid();
        if (!uid) throw new Error("You must be logged in to create a task.");

        const tasksRef = collection(db, "tasks");

        const newTask = {
            userId: uid,
            title: title.trim(),
            details: details.trim(),
            dueDate: Timestamp.fromDate(dueDate),
            priority: priority.toLowerCase(),
            tags: tags
                ? tags.split(",").map((t) => t.trim()).filter(Boolean)
                : [],
            isDone: false,
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(tasksRef, newTask);
        return { id: docRef.id, ...newTask };
    } catch (error) {
        console.error("createTask failed:", error);
        throw error;
    }
}

export async function toggleTaskComplete(taskId, currentValue) {
    try {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, { isDone: !currentValue });
    } catch (error) {
        console.error("toggleTaskComplete failed:", error);
        throw error;
    }
}

export async function getTasksByDate(dateString) {
    try {
        const uid = getCurrentUid();
        if (!uid) return [];

        const [year, month, day] = dateString.split("-").map(Number);
        const startOfDay = new Date(year, month - 1, day);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

        const tasksRef = collection(db, "tasks");
        const q = query(
            tasksRef,
            where("userId", "==", uid),
            where("dueDate", ">=", Timestamp.fromDate(startOfDay)),
            where("dueDate", "<=", Timestamp.fromDate(endOfDay))
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("getTasksByDate failed:", error);
        throw error;
    }
}

export async function getAllTasks() {
    try {
        const uid = getCurrentUid();
        if (!uid) return [];

        const tasksRef = collection(db, "tasks");
        const q = query(tasksRef, where("userId", "==", uid));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("getAllTasks failed:", error);
        throw error;
    }
}

export async function getAllTaskDates() {
    try {
        const uid = getCurrentUid();
        if (!uid) return [];

        const tasksRef = collection(db, "tasks");
        const q = query(tasksRef, where("userId", "==", uid));
        const snapshot = await getDocs(q);

        return snapshot.docs
            .map((doc) => {
                const dueDate = doc.data().dueDate;
                if (!dueDate) return null;
                // conversion
                return dueDate.toDate().toISOString().split("T")[0];
            })
            .filter(Boolean);
    } catch (error) {
        console.error("getAllTaskDates failed:", error);
        throw error;
    }
}