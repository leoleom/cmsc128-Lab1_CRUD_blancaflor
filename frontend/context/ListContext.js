import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getMyTeams } from "../../backend/services/teamService";

const ListContext = createContext({
    activeTeamId: null,
    teams: [],
    teamsLoaded: false,
    setActiveTeamId: () => {},
    refreshTeams: async () => {},
});

export function ListProvider({ children }) {
    const { user } = useAuth();
    const uid = user?.uid;
    const [teams, setTeams] = useState([]);
    const [activeTeamId, setActiveTeamId] = useState(null);
    const [teamsLoaded, setTeamsLoaded] = useState(false);

    const refreshTeams = useCallback(async () => {
        if (!uid) {
            setTeams([]);
            setActiveTeamId(null);
            setTeamsLoaded(true);
            return;
        }
        try {
            const mine = await getMyTeams();
            setTeams(mine);
            // if the selected team is gone, or a different user logged in, fall back to Personal
            setActiveTeamId((cur) => (cur && mine.some((t) => t.id === cur) ? cur : null));
        } catch (error) {
            console.error("Failed to load teams:", error);
        } finally {
            setTeamsLoaded(true);
        }
    }, [uid]);

    useEffect(() => {
        setTeamsLoaded(false);
        refreshTeams();
    }, [refreshTeams]);

    return (
        <ListContext.Provider value={{ activeTeamId, teams, teamsLoaded, setActiveTeamId, refreshTeams }}>
            {children}
        </ListContext.Provider>
    );
}

export function useList() {
    return useContext(ListContext);
}