import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

export default function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.sideButton} onPress={() => router.push("/")}>
                {pathname === "/" && <View style={styles.highlightCircle} />}
                <Ionicons name="home" size={24} color={"#333"} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/addTask")}>
                <Ionicons name="add" size={50} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideButton} onPress={() => router.push("/calendar")}>
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
        left: 20,
        right: 20,
        height: 64,
        backgroundColor: "#ddd",
        borderRadius: 32,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
    },
    sideButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    addButton: {
        width: 90,
        height: 90,
        borderRadius: 50,
        backgroundColor: "#e67e22",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 0,
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