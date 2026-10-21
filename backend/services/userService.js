import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function syncUserRecord(user) {
    // nothing to save if nobody is logged in
    if (!user || !user.email) {
        return;
    }

    // save the email in lowercase
    const data = { email: user.email.toLowerCase() };

    // only save the name when there is one
    if (user.displayName) {
        data.displayName = user.displayName;
    }

    // merge means we only touch these fields and leave anything else alone
    await setDoc(doc(db, "users", user.uid), data, { merge: true });
}

export async function getUserDisplayName(uid) {
    try {
        // read person's record from the users collection
        const snapshot = await getDoc(doc(db, "users", uid));
        if (!snapshot.exists()) {
            return "Unknown user";
        }

        // prefer the display name, fall back to the email
        const data = snapshot.data();
        return data.displayName || data.email || "Unknown user";
    } catch (error) {
        return "Unknown user";
    }
}