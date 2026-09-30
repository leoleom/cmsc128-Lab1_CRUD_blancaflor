import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, 
updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword, verifyBeforeUpdateEmail,
sendPasswordResetEmail, reload } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebaseConfig";

const PENDING_EMAIL_CHANGE_KEY = "pendingEmailChange";
const EMAIL_CHANGE_RELOGIN_PROMPTED_KEY = "emailChangeReloginPrompted";

export async function registerUser({ email, password, displayName }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  return credential.user;
}

export async function loginUser({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("logoutUser failed:", error);
    throw error;
  }
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function changeUserPassword({ currentPassword, newPassword }) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not logged in.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function updateDisplayName(displayName) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not logged in.");
  }

  await updateProfile(user, { displayName });
}

export async function requestEmailChange({ currentPassword, newEmail }) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not logged in.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  const previousPendingEmail = await AsyncStorage.getItem(PENDING_EMAIL_CHANGE_KEY);
  await AsyncStorage.setItem(PENDING_EMAIL_CHANGE_KEY, newEmail.trim().toLowerCase());
  await AsyncStorage.removeItem(EMAIL_CHANGE_RELOGIN_PROMPTED_KEY);
  try {
    await verifyBeforeUpdateEmail(user, newEmail);
  } catch (error) {
    if (previousPendingEmail) {
      await AsyncStorage.setItem(PENDING_EMAIL_CHANGE_KEY, previousPendingEmail);
    } else {
      await AsyncStorage.removeItem(PENDING_EMAIL_CHANGE_KEY);
    }
    throw error;
  }
}

export async function verifyPendingEmailChange() {
  const user = auth.currentUser;
  if (!user) return false;

  const pendingEmail = await AsyncStorage.getItem(PENDING_EMAIL_CHANGE_KEY);
  if (!pendingEmail) return false;

  try {
    await reload(user);
  } catch (error) {
    if (error.code !== "auth/user-token-expired") throw error;
    await AsyncStorage.setItem(EMAIL_CHANGE_RELOGIN_PROMPTED_KEY, "true");
    return "session-expired";
  }

  if (user.email?.toLowerCase() !== pendingEmail) {
    await AsyncStorage.removeItem(EMAIL_CHANGE_RELOGIN_PROMPTED_KEY);
    return false;
  }

  const wasReloginAlreadyPrompted = await AsyncStorage.getItem(EMAIL_CHANGE_RELOGIN_PROMPTED_KEY);
  await AsyncStorage.removeItem(PENDING_EMAIL_CHANGE_KEY);
  await AsyncStorage.removeItem(EMAIL_CHANGE_RELOGIN_PROMPTED_KEY);
  return wasReloginAlreadyPrompted ? false : "verified";
}

export async function requestPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}


