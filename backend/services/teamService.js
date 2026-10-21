import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, writeBatch, arrayUnion, arrayRemove, Timestamp } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// returns the logged-in user's id
function getCurrentUid() {
    return auth.currentUser ? auth.currentUser.uid : null;
}

// make an error with a code so the screen can show a clear message
function makeError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

export async function createTeam(name) {
    // only a logged-in user can create a team
    const uid = getCurrentUid();
    if (!uid) {
        throw makeError("team/not-logged-in", "You must be logged in to create a team.");
    }

    // the creator becomes the owner and the first member
    const newTeam = {
        name: name.trim(),
        ownerId: uid,
        memberIds: [uid],
        createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "teams"), newTeam);
    return { id: docRef.id, ...newTeam };
}

export async function getMyTeams() {
    // nobody logged in means no teams
    const uid = getCurrentUid();
    if (!uid) {
        return [];
    }

    // ask only for teams whose member list contains me
    const q = query(collection(db, "teams"), where("memberIds", "array-contains", uid));
    const snapshot = await getDocs(q);

    // turn each result into a plain object that includes its id
    const teams = [];
    for (let i = 0; i < snapshot.docs.length; i++) {
        teams.push({ id: snapshot.docs[i].id, ...snapshot.docs[i].data() });
    }

    // oldest team first
    teams.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
    return teams;
}

export async function getTeamMembers(memberIds) {
    // look up each member's name and email in the users collection
    const members = [];
    for (let i = 0; i < memberIds.length; i++) {
        const snapshot = await getDoc(doc(db, "users", memberIds[i]));
        const data = snapshot.exists() ? snapshot.data() : {};
        members.push({
            id: memberIds[i],
            displayName: data.displayName || data.email || "Unknown user",
            email: data.email || "",
        });
    }
    return members;
}

export async function addMemberByEmail(teamId, email) {
    // only a logged-in user can add members
    const uid = getCurrentUid();
    if (!uid) {
        throw makeError("team/not-logged-in", "You must be logged in.");
    }

    // find the account with this email in the users collection
    const cleanEmail = email.trim().toLowerCase();
    const q = query(collection(db, "users"), where("email", "==", cleanEmail));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        throw makeError("team/user-not-found", "No account found with that email.");
    }
    const newMemberId = snapshot.docs[0].id;

    // load the team and run the checks
    const teamRef = doc(db, "teams", teamId);
    const teamSnapshot = await getDoc(teamRef);
    if (!teamSnapshot.exists()) {
        throw makeError("team/not-found", "This team no longer exists.");
    }
    const team = teamSnapshot.data();
    if (team.ownerId !== uid) {
        throw makeError("team/not-owner", "Only the team owner can add members.");
    }
    if (team.memberIds.includes(newMemberId)) {
        throw makeError("team/already-member", "That person is already in this team.");
    }

    // add them to the member list (arrayUnion never creates duplicates)
    await updateDoc(teamRef, { memberIds: arrayUnion(newMemberId) });
    return newMemberId;
}

export async function removeMember(teamId, memberId) {
    const uid = getCurrentUid();
    
    if (!uid) throw makeError("team/not-logged-in", "You must be logged in.");
    if (memberId === uid) throw makeError("team/cannot-remove-owner", "The owner can't be removed.");
    
    await updateDoc(doc(db, "teams", teamId), { memberIds: arrayRemove(memberId) });
}

export async function deleteTeam(teamId) {
    // only a logged-in user can delete a team
    const uid = getCurrentUid();
    if (!uid) {
        throw makeError("team/not-logged-in", "You must be logged in.");
    }

    // load the team and make sure this user owns it
    const teamRef = doc(db, "teams", teamId);
    const teamSnapshot = await getDoc(teamRef);
    if (!teamSnapshot.exists()) {
        throw makeError("team/not-found", "This team no longer exists.");
    }
    if (teamSnapshot.data().ownerId !== uid) {
        throw makeError("team/not-owner", "Only the team owner can delete the team.");
    }

    // find every task that belongs to this team
    const tasksSnapshot = await getDocs(query(collection(db, "tasks"), where("teamId", "==", teamId)));

    // delete the tasks in groups, because one batch can hold at most 500 changes
    const BATCH_SIZE = 400;
    for (let start = 0; start < tasksSnapshot.docs.length; start += BATCH_SIZE) {
        const batch = writeBatch(db);
        const end = Math.min(start + BATCH_SIZE, tasksSnapshot.docs.length);
        for (let i = start; i < end; i++) {
            batch.delete(tasksSnapshot.docs[i].ref);
        }
        await batch.commit();
    }

    // delete the team itself last
    await deleteDoc(teamRef);
}