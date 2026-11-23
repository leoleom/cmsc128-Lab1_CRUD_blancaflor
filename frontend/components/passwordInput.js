import { useEffect, useRef, useState } from "react";
import { Animated, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
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
    const [isFocused, setIsFocused] = useState(false);
    const [selection, setSelection] = useState(() => ({
        start: value?.length || 0,
        end: value?.length || 0,
    }));
    const caretOpacity = useRef(new Animated.Value(1)).current;
    const flattenedInputStyle = StyleSheet.flatten(inputStyle) || {};
    const textColor = flattenedInputStyle.color || "#000";
    const fontSize = flattenedInputStyle.fontSize || 14;
    const visibleTextStyle = {
        color: textColor,
        fontFamily: flattenedInputStyle.fontFamily,
        fontSize,
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
    const cursorPosition = Math.max(0, Math.min(selection.end, value?.length || 0));
    const cursorHeight = flattenedInputStyle.lineHeight || fontSize + 2;

    useEffect(() => {
        if (!isVisible || !isFocused || !value) {
            caretOpacity.setValue(1);
            return undefined;
        }

        const blink = Animated.loop(
            Animated.sequence([
                Animated.timing(caretOpacity, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(caretOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        );
        blink.start();
        return () => blink.stop();
    }, [caretOpacity, isFocused, isVisible, value]);

    return (
        <View style={[styles.container, containerStyle]}>
            <TextInput
                style={[
                    inputStyle,
                    { color: isVisible && value ? "transparent" : textColor },
                ]}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChangeText}
                onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
                onFocus={(event) => {
                    setIsFocused(true);
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    setIsFocused(false);
                    onBlur?.(event);
                }}
                secureTextEntry
                caretHidden={isVisible && Boolean(value)}
                selectionColor={textColor}
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
                    <View style={styles.visibleTextRow}>
                        <Text numberOfLines={1} style={[styles.visibleText, visibleTextStyle]}>{value.slice(0, cursorPosition)}</Text>
                        {isFocused && (
                            <Animated.View
                                style={[
                                    styles.visibleCaret,
                                    {
                                        backgroundColor: textColor,
                                        height: cursorHeight,
                                        opacity: caretOpacity,
                                    },
                                ]}
                            />
                        )}
                        <Text numberOfLines={1} style={[styles.visibleText, visibleTextStyle]}>{value.slice(cursorPosition)}</Text>
                    </View>
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
    visibleTextContainer: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        justifyContent: "center",
        overflow: "hidden",
    },
    visibleTextRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "nowrap",
    },
    visibleText: {
        flexShrink: 0,
    },
    visibleCaret: {
        width: 1.5,
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
