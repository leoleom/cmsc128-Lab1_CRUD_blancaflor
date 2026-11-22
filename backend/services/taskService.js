import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// returns the logged-in user's id, or null if nobody is logged in
function getCurrentUid() {
    return auth.currentUser ? auth.currentUser.uid : null;
}

// turns the tags text ("a, b") into a clean list
function parseTags(tags) {
    return tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
}

// personal (teamId null) or a team's list
function scopeFilters(uid, teamId) {
    return teamId
        ? [where("teamId", "==", teamId)]
        : [where("userId", "==", uid), where("teamId", "==", null)];
}

export async function getTaskById(taskId) {
    // nobody logged in means no task
    const uid = getCurrentUid();
    if (!uid) return null;

    try {
        // load the task
        const snapshot = await getDoc(doc(db, "tasks", taskId));
        if (!snapshot.exists()) return null;
        const data = snapshot.data();
        let canDelete = data.userId === uid;

        // team task: only members may see it; personal task: only its owner
        if (data.teamId) {
            const team = await getDoc(doc(db, "teams", data.teamId));
            if (!team.exists()) return null;
            const teamData = team.data();
            if (!teamData.memberIds?.includes(uid)) return null;
            canDelete = canDelete || teamData.ownerId === uid;
        } else if (!canDelete) {
            return null;
        }
        return { id: snapshot.id, ...data, canDelete };
    } catch (error) {
        // refuse people who aren't allowed
        if (error.code === "permission-denied") return null;
        throw error;
    }
}

export async function updateTask(taskId, { title, details, dueDate, priority, tags }) {
    // save the edited fields onto the existing task
    await updateDoc(doc(db, "tasks", taskId), {
        title: title.trim(),
        details: details.trim(),
        dueDate: Timestamp.fromDate(dueDate),
        priority: priority.toLowerCase(),
        tags: parseTags(tags),
    });
}

export async function deleteTask(taskId) {
    await deleteDoc(doc(db, "tasks", taskId));
}

// teamId is optional: null means a personal task
export async function createTask({ title, details, dueDate, priority, tags, teamId = null }) {
    // only a logged-in user can create a task
    const uid = getCurrentUid();
    if (!uid) throw new Error("You must be logged in to create a task.");

    // build the task, stamped with its owner
    const newTask = {
        userId: uid,
        teamId: teamId ?? null,
        title: title.trim(),
        details: details.trim(),
        dueDate: Timestamp.fromDate(dueDate),
        priority: priority.toLowerCase(),
        tags: parseTags(tags),
        isDone: false,
        createdAt: Timestamp.now(),
    };

    // save it and hand back the new task with its id
    const docRef = await addDoc(collection(db, "tasks"), newTask);
    return { id: docRef.id, ...newTask };
}

export async function toggleTaskComplete(taskId, currentValue) {
    await updateDoc(doc(db, "tasks", taskId), { isDone: !currentValue });
}

export async function getTasksByDate(dateString, teamId = null) {
    // nobody logged in means no tasks
    const uid = getCurrentUid();
    if (!uid) return [];

    // work out the start and end of the chosen day
    const [year, month, day] = dateString.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // ask for this list's tasks that are due within that day
    const q = query(
        collection(db, "tasks"),
        ...scopeFilters(uid, teamId),
        where("dueDate", ">=", Timestamp.fromDate(startOfDay)),
        where("dueDate", "<=", Timestamp.fromDate(endOfDay))
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllTasks(teamId = null) {
    // nobody logged in means no tasks
    const uid = getCurrentUid();
    if (!uid) return [];

    // ask for everything in this list
    const snapshot = await getDocs(query(collection(db, "tasks"), ...scopeFilters(uid, teamId)));

    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllTaskDates(teamId = null) {
    // nobody logged in means no dates
    const uid = getCurrentUid();
    if (!uid) return [];

    // read this list's tasks, then keep only their due dates as YYYY-MM-DD
    const snapshot = await getDocs(query(collection(db, "tasks"), ...scopeFilters(uid, teamId)));

    return snapshot.docs
        .map((d) => {
            const dueDate = d.data().dueDate;
            if (!dueDate) return null;
            return dueDate.toDate().toISOString().split("T")[0];
        })
        .filter(Boolean);
}