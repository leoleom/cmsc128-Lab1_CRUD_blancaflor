import { Alert, Platform } from "react-native";

export function showAlert(title, message) {
    // on web, use the browser's alert box, because Alert.alert does nothing there
    if (Platform.OS === "web") {
        window.alert(message ? `${title}\n\n${message}` : title);
        return;
    }

    // on phones, use the normal alert box
    Alert.alert(title, message);
}

export function confirmAction(title, message, confirmText, onConfirm) {
    // on web, ask with the browser's confirm box and only go on if they press OK
    if (Platform.OS === "web") {
        if (window.confirm(`${title}\n\n${message}`)) {
            onConfirm();
        }
        return;
    }

    // on phones, show Cancel and a red confirm button
    Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: confirmText, style: "destructive", onPress: onConfirm },
    ]);
}

export function showAlertAndWait(title, message) {
    // on web, the browser alert pauses the code until it is closed
    if (Platform.OS === "web") {
        window.alert(message ? `${title}\n\n${message}` : title);
        return Promise.resolve();
    }

    // on phones, finish only after OK is tapped, and don't allow dismissing it any other way
    return new Promise((resolve) => {
        Alert.alert(title, message, [{ text: "OK", onPress: resolve }], { cancelable: false });
    });
}