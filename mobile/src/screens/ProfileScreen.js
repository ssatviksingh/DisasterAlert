import React, { useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../contexts/ThemeContext";

export default function ProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { theme, isDark } = useContext(ThemeContext);

    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem("user");
                if (stored) setUser(JSON.parse(stored));
            } catch (err) {
                console.error("Error loading user:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function logout() {
        try {
            await AsyncStorage.removeItem("user");
            await AsyncStorage.removeItem("token");
            Alert.alert("✅ Logged out successfully");
            navigation.replace("Auth");
        } catch (err) {
            Alert.alert("Logout failed", err.message);
        }
    }

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={[styles.info, { color: theme.text }]}>No user data found.</Text>
                <TouchableOpacity onPress={() => navigation.replace("Auth")} style={styles.retryBtn}>
                    <Text style={{ color: "#fff", fontWeight: "600" }}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
            <Text style={[styles.info, { color: theme.subtext }]}>{user.email}</Text>
            {user.role && <Text style={[styles.info, { color: theme.subtext }]}>Role: {user.role}</Text>}

            <TouchableOpacity onPress={logout} style={[styles.logoutBtn, { backgroundColor: theme.primary }]}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    name: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
    info: { fontSize: 16, marginBottom: 4 },
    logoutBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 20,
    },
    retryBtn: {
        backgroundColor: "#007bff",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 20,
    },
});
