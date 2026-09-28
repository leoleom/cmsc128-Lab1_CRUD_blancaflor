import { createContext, useContext, useEffect, useState } from "react";
import { subscribeToAuthChanges } from "../../backend/services/authService";

const AuthContext = createContext({ user: null, isCheckingAuth: true });

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
            setUser(firebaseUser);
            setIsCheckingAuth(false);
        });
        return unsubscribe;
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