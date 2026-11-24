import { View, TouchableOpacity, StyleSheet } from "react-native"; 
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

export default function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();
    const isAddTaskPage = pathname === "/addTask";

    return (
        <View style={styles.container}>
            <TouchableOpacity style={[styles.sideButton, styles.homeButton]} onPress={() => router.push("/")}>
                {pathname === "/" && <View style={styles.highlightCircle} />}
                <Ionicons name="home" size={24} color={"#333"} />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.addButton, isAddTaskPage && styles.addButtonActive]}
                onPress={() => router.push("/addTask")}
            >
                <Ionicons name="add" size={42} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sideButton, styles.calendarButton]} onPress={() => router.push("/calendar")}>
                {pathname === "/calendar" && <View style={styles.highlightCircle} />}
                <Ionicons name="calendar" size={24} color={"#333"} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 40,
        left: 56,
        right: 56,
        height: 60,
        backgroundColor: "rgba(221, 221, 221, 0.9)",
        borderRadius: 30,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
    },
    sideButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    homeButton: {
        transform: [{ translateX: 8 }],
    },
    calendarButton: {
        transform: [{ translateX: -8 }],
    },
    addButton: {
        width: 76,
        height: 76,
        borderRadius: 50,
        backgroundColor: "#e67e22",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 0,
    },
    addButtonActive: {
        backgroundColor: "#9e9e9e",
    },
    highlightCircle: {
        position: "absolute",   // sits behind the icon
        opacity: 0.7,
        width: 60,
        height: 44,
        borderRadius: 30,
        backgroundColor: "#fbfbfb", // orange highlight
    },
});