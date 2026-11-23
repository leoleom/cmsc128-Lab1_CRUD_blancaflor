import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PasswordInput({
    value,
    onChangeText,
    placeholder,
    accessibilityLabel = "Password",
    containerStyle,
    inputStyle,
    buttonStyle,
    onFocus,
    onBlur,
}) {
    const [isVisible, setIsVisible] = useState(false);
    const flattenedInputStyle = StyleSheet.flatten(inputStyle) || {};
    const visibleTextStyle = {
        color: flattenedInputStyle.color || "#000",
        fontFamily: flattenedInputStyle.fontFamily,
        fontSize: flattenedInputStyle.fontSize,
        fontStyle: flattenedInputStyle.fontStyle,
        fontWeight: flattenedInputStyle.fontWeight,
        letterSpacing: flattenedInputStyle.letterSpacing,
        lineHeight: flattenedInputStyle.lineHeight,
        textAlign: flattenedInputStyle.textAlign,
    };
    const visibleTextContainerStyle = {
        paddingLeft: flattenedInputStyle.paddingLeft || flattenedInputStyle.paddingHorizontal || 0,
        paddingRight: flattenedInputStyle.paddingRight || flattenedInputStyle.paddingHorizontal || 0,
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <TextInput
                style={[inputStyle, isVisible && value ? styles.transparentInputText : null]}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChangeText}
                onFocus={onFocus}
                onBlur={onBlur}
                secureTextEntry
                underlineColorAndroid="transparent"
                accessibilityLabel={accessibilityLabel}
            />
            {isVisible && value ? (
                <View
                    style={[styles.visibleTextContainer, visibleTextContainerStyle]}
                    pointerEvents="none"
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                >
                    <Text numberOfLines={1} style={[styles.visibleText, visibleTextStyle]}>{value}</Text>
                </View>
            ) : null}
            <TouchableOpacity
                style={[styles.visibilityButton, buttonStyle]}
                onPress={() => setIsVisible((visible) => !visible)}
                accessibilityRole="button"
                accessibilityLabel={isVisible ? "Hide password" : "Show password"}
            >
                <Ionicons
                    name={isVisible ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#555"
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "relative",
    },
    transparentInputText: {
        color: "transparent",
    },
    visibleTextContainer: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        justifyContent: "center",
        overflow: "hidden",
    },
    visibleText: {
        flexShrink: 1,
    },
    visibilityButton: {
        position: "absolute",
        top: 0,
        right: 2,
        bottom: 0,
        width: 40,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
    },
});
