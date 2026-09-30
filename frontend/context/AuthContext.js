import { createContext, useContext, useEffect, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import { logoutUser, subscribeToAuthChanges, verifyPendingEmailChange } from "../../backend/services/authService";

const AuthContext = createContext({ user: null, isCheckingAuth: true });

function showEmailChangeAlert(sessionExpired = false) {
    const title = sessionExpired ? "Session expired" : "Email verified";
    const message = sessionExpired
        ? "If you completed the email verification, log in again using your new email address."
        : "You will be logged out now. Log in again with your new email address.";
    if (Platform.OS === "web") {
        window.alert(`${title}\n\n${message}`);
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        Alert.alert(title, message, [
            { text: "OK", onPress: resolve },
        ], { cancelable: false });
    });
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let isCheckingEmailChange = false;
        let emailCheckInterval;

        const checkVerifiedEmailChange = async () => {
            if (isCheckingEmailChange) return false;
            isCheckingEmailChange = true;
            try {
                const result = await verifyPendingEmailChange();
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
                if (error.code !== "auth/user-token-expired") {
                    console.error("Checking verified email change failed:", error);
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

    return (
        <AuthContext.Provider value={{ user, isCheckingAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}