import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { useAuth } from "./AuthContext";
import { getMyTeams } from "../../backend/services/teamService";
import { showAlert } from "../utils/alerts";

const EDITING_TASK_ID_KEY = "todone.editingTaskId";
const ACTIVE_TEAM_ID_KEY = "todone.activeTeamId";

function getStoredEditingTaskId() {
    if (Platform.OS !== "web" || typeof window === "undefined") return null;
    try {
        return window.sessionStorage.getItem(EDITING_TASK_ID_KEY);
    } catch {
        return null;
    }
}

function getStoredActiveTeamId() {
    if (Platform.OS !== "web" || typeof window === "undefined") return null;
    try {
        return window.sessionStorage.getItem(ACTIVE_TEAM_ID_KEY);
    } catch {
        return null;
    }
}

export function storeEditingTaskId(taskId) {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    if (taskId) {
        window.sessionStorage.setItem(EDITING_TASK_ID_KEY, taskId);
    } else {
        window.sessionStorage.removeItem(EDITING_TASK_ID_KEY);
    }
}

function storeActiveTeamId(teamId) {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
        if (teamId) {
            window.sessionStorage.setItem(ACTIVE_TEAM_ID_KEY, teamId);
        } else {
            window.sessionStorage.removeItem(ACTIVE_TEAM_ID_KEY);
        }
    } catch {
        showAlert("Couldn't save selected list", "Your team selection may reset if you refresh the browser.");
    }
}

const ListContext = createContext({
    activeTeamId: null,
    teams: [],
    teamsLoaded: false,
    teamsError: false,
    editingTaskId: null,
    pendingDeletionTask: null,
    setActiveTeamId: () => {},
    setEditingTaskId: () => {},
    setPendingDeletionTask: () => {},
    refreshTeams: async () => {},
});

export function ListProvider({ children }) {
    const { user, isCheckingAuth } = useAuth();
    const uid = user?.uid;
    const [teams, setTeams] = useState([]);
    const [activeTeamId, setActiveTeamId] = useState(getStoredActiveTeamId);
    const [teamsLoaded, setTeamsLoaded] = useState(false);
    const [teamsError, setTeamsError] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(getStoredEditingTaskId);
    const [pendingDeletionTask, setPendingDeletionTask] = useState(null);

    useEffect(() => {
        storeActiveTeamId(activeTeamId);
    }, [activeTeamId]);

    const refreshTeams = useCallback(async () => {
        if (!uid) {
            if (isCheckingAuth) return;
            setTeams([]);
            setActiveTeamId(null);
            setTeamsError(false);
            setPendingDeletionTask(null);
            setTeamsLoaded(true);
            return;
        }
        setTeamsError(false);
        try {
            const mine = await getMyTeams();
            setTeams(mine);
            // if the selected team is gone, or a different user logged in, fall back to Personal
            setActiveTeamId((cur) => (cur && mine.some((t) => t.id === cur) ? cur : null));
        } catch {
            setTeamsError(true);
        } finally {
            setTeamsLoaded(true);
        }
    }, [uid, isCheckingAuth]);

    useEffect(() => {
        setTeamsLoaded(false);
        refreshTeams();
    }, [refreshTeams]);

    return (
        <ListContext.Provider
            value={{
                activeTeamId,
                teams,
                teamsLoaded,
                teamsError,
                editingTaskId,
                pendingDeletionTask,
                setActiveTeamId,
                setEditingTaskId,
                setPendingDeletionTask,
                refreshTeams,
            }}
        >
            {children}
        </ListContext.Provider>
    );
}

export function useList() {
    return useContext(ListContext);
}