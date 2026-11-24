import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { logoutUser, subscribeToAuthChanges, verifyPendingEmailChange } from "../../backend/services/authService";
import { syncUserRecord } from "../../backend/services/userService";
import { showAlert, showAlertAndWait } from "../utils/alerts";

const AuthContext = createContext({ user: null, isCheckingAuth: true });

function showEmailChangeAlert(sessionExpired = false) {
    const title = sessionExpired ? "Session expired" : "Email verified";
    const message = sessionExpired
        ? "If you completed the email verification, log in again using your new email address."
        : "You will be logged out now. Log in again with your new email address.";
    return showAlertAndWait(title, message);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const syncFailureUserId = useRef(null);

    useEffect(() => {
        let isMounted = true;
        let isCheckingEmailChange = false;
        let hasShownEmailCheckError = false;
        let emailCheckInterval;

        const checkVerifiedEmailChange = async () => {
            if (isCheckingEmailChange) return false;
            isCheckingEmailChange = true;
            try {
                const result = await verifyPendingEmailChange();
                hasShownEmailCheckError = false;
                if (result === "session-expired") {
                    await showEmailChangeAlert(true);
                    await logoutUser();
                    return true;
                }
                if (result !== "verified") return false;

                await showEmailChangeAlert();
                await logoutUser();
                return true;
            } catch (error) {
                if (error.code !== "auth/user-token-expired" && !hasShownEmailCheckError) {
                    showAlert(
                        "Couldn't check email verification",
                        "We'll try again automatically. Check your connection if the problem continues."
                    );
                    hasShownEmailCheckError = true;
                }
                return false;
            } finally {
                isCheckingEmailChange = false;
            }
        };

        const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
            const updateAuthState = async () => {
                const didSignOut = firebaseUser
                    ? await checkVerifiedEmailChange()
                    : false;
                if (!isMounted) return;
                setUser(didSignOut ? null : firebaseUser);
                setIsCheckingAuth(false);
            };
            void updateAuthState();
        });

        const stopEmailChangeChecks = () => {
            if (emailCheckInterval) {
                clearInterval(emailCheckInterval);
                emailCheckInterval = undefined;
            }
        };

        const startEmailChangeChecks = () => {
            stopEmailChangeChecks();
            void checkVerifiedEmailChange();
            emailCheckInterval = setInterval(() => {
                void checkVerifiedEmailChange();
            }, 30000);
        };

        if (AppState.currentState === "active") {
            startEmailChangeChecks();
        }

        const appStateSubscription = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                startEmailChangeChecks();
            } else {
                stopEmailChangeChecks();
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
            appStateSubscription.remove();
            stopEmailChangeChecks();
        };
    }, []);

    // keep the users record up to date for whoever is logged in
    useEffect(() => {
        // nothing to save while logged out
        if (!user) {
            return;
        }

        // save the email and name each time someone logs in or the app reopens
        let isCurrent = true;
        syncUserRecord(user).then(() => {
            if (isCurrent && syncFailureUserId.current === user.uid) {
                syncFailureUserId.current = null;
            }
        }).catch(() => {
            if (isCurrent && syncFailureUserId.current !== user.uid) {
                syncFailureUserId.current = user.uid;
                showAlert(
                    "Profile sync issue",
                    "Your account is signed in, but some team details may not update until your connection is restored."
                );
            }
        });
        return () => {
            isCurrent = false;
        };
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, isCheckingAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}