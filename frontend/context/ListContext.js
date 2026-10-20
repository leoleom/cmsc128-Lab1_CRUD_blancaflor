import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getMyTeams } from "../../backend/services/teamService";

const ListContext = createContext({
    activeTeamId: null,
    teams: [],
    setActiveTeamId: () => {},
    refreshTeams: async () => {},
});

export function ListProvider({ children }) {
    const { user } = useAuth();
    const uid = user?.uid;
    const [teams, setTeams] = useState([]);
    const [activeTeamId, setActiveTeamId] = useState(null);

    const refreshTeams = useCallback(async () => {
        if (!uid) {
            setTeams([]);
            setActiveTeamId(null);
            return;
        }
        try {
            const mine = await getMyTeams();
            setTeams(mine);
            // if the selected team is gone, or a different user logged in, fall back to Personal
            setActiveTeamId((cur) => (cur && mine.some((t) => t.id === cur) ? cur : null));
        } catch (error) {
            console.error("Failed to load teams:", error);
        }
    }, [uid]);

    useEffect(() => {
        refreshTeams();
    }, [refreshTeams]);

    return (
        <ListContext.Provider value={{ activeTeamId, teams, setActiveTeamId, refreshTeams }}>
            {children}
        </ListContext.Provider>
    );
}

export function useList() {
    return useContext(ListContext);
}