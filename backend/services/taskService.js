import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// returns the logged-in user's id, or null if nobody is logged in
function getCurrentUid() {
    return auth.currentUser ? auth.currentUser.uid : null;
}

// personal (teamId null) or a team's list
function scopeFilters(uid, teamId) {
    return teamId
        ? [where("teamId", "==", teamId)]
        : [where("userId", "==", uid), where("teamId", "==", null)];
}

// getter
export async function getTaskById(taskId) {
    try {
        const uid = getCurrentUid();
        if (!uid) return null;

        const snapshot = await getDoc(doc(db, "tasks", taskId));
        if (!snapshot.exists()) return null;
        const data = snapshot.data();

        if (data.teamId) {
            const team = await getDoc(doc(db, "teams", data.teamId));
            if (!team.exists() || !team.data().memberIds?.includes(uid)) return null;
        } else if (data.userId !== uid) {
            return null;
        }
        return { id: snapshot.id, ...data };
    } catch (error) {
        // rules reject non-members: fail safely instead of crashing
        if (error.code === "permission-denied") return null;
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

// create (teamId is optional: null means a personal task)
export async function createTask({ title, details, dueDate, priority, tags, teamId = null }) {
    try {
        const uid = getCurrentUid();
        if (!uid) throw new Error("You must be logged in to create a task.");

        const tasksRef = collection(db, "tasks");

        const newTask = {
            userId: uid,
            teamId: teamId ?? null,
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

export async function getTasksByDate(dateString, teamId = null) {
    try {
        const uid = getCurrentUid();
        if (!uid) return [];

        const [year, month, day] = dateString.split("-").map(Number);
        const startOfDay = new Date(year, month - 1, day);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

        const q = query(
            collection(db, "tasks"),
            ...scopeFilters(uid, teamId),
            where("dueDate", ">=", Timestamp.fromDate(startOfDay)),
            where("dueDate", "<=", Timestamp.fromDate(endOfDay))
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("getTasksByDate failed:", error);
        throw error;
    }
}

export async function getAllTasks(teamId = null) {
    try {
        const uid = getCurrentUid();
        if (!uid) return [];

        const q = query(collection(db, "tasks"), ...scopeFilters(uid, teamId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("getAllTasks failed:", error);
        throw error;
    }
}

export async function getAllTaskDates(teamId = null) {
    try {
        const uid = getCurrentUid();
        if (!uid) return [];

        const q = query(collection(db, "tasks"), ...scopeFilters(uid, teamId));
        const snapshot = await getDocs(q);

        return snapshot.docs
            .map((d) => {
                const dueDate = d.data().dueDate;
                if (!dueDate) return null;
                return dueDate.toDate().toISOString().split("T")[0];
            })
            .filter(Boolean);
    } catch (error) {
        console.error("getAllTaskDates failed:", error);
        throw error;
    }
}
