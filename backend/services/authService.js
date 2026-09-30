import {createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, 
updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword,} from "firebase/auth";
import { auth } from "../firebaseConfig";

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