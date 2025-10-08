import React, { useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../contexts/ThemeContext";


export default function AdminPanelScreen() {
    const { theme } = useContext(ThemeContext);

    // 🔒 PIN Security
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [enteredPin, setEnteredPin] = useState("");
    const ADMIN_PIN = "2468"; // change this to your secret PIN

    const [message, setMessage] = useState("");
    const [lon, setLon] = useState("");
    const [lat, setLat] = useState("");
    const [radius, setRadius] = useState("5000");
    const [logs, setLogs] = useState([]);

    const api = "http://192.168.1.36:4000"; // your backend URL

    useEffect(() => {
        // Check persisted PIN status
        (async () => {
            try {
                const saved = await AsyncStorage.getItem("adminUnlocked");
                if (saved === "true") setIsAuthorized(true);
            } catch (err) {
                console.error("Error loading PIN state:", err);
            }
        })();
    }, []);

    const addLog = (txt) =>
        setLogs((prev) => [
            { ts: new Date().toLocaleTimeString(), txt },
            ...prev.slice(0, 20),
        ]);

    async function sendBroadcast() {
        if (!message.trim()) return Alert.alert("Message required");
        try {
            const res = await fetch(`${api}/notify/broadcast`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });
            const data = await res.json();
            if (data.ok) {
                addLog(`Broadcast: ${message} → ${data.notified} users`);
                Alert.alert("✅ Broadcast sent", `${data.notified} users notified`);
            } else throw new Error(data.error);
        } catch (err) {
            Alert.alert("Error", err.message);
        }
    }

    async function sendNearby() {
        if (!lon || !lat) return Alert.alert("Enter both lon & lat");
        try {
            const res = await fetch(`${api}/notify/nearby`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    coordinates: [Number(lon), Number(lat)],
                    radiusMeters: Number(radius),
                    message: message || "Nearby alert test",
                }),
            });
            const data = await res.json();
            if (data.ok) {
                addLog(`Nearby: ${message} → ${data.notified} users`);
                Alert.alert("✅ Nearby alert sent", `${data.notified} users`);
            } else throw new Error(data.error);
        } catch (err) {
            Alert.alert("Error", err.message);
        }
    }

    async function handlePinSubmit() {
        if (enteredPin === ADMIN_PIN) {
            setIsAuthorized(true);
            await AsyncStorage.setItem("adminUnlocked", "true");
            setEnteredPin("");
        } else {
            Alert.alert("❌ Incorrect PIN", "Try again");
            setEnteredPin("");
        }
    }

    async function handleLock() {
        setIsAuthorized(false);
        await AsyncStorage.removeItem("adminUnlocked");
        Alert.alert("🔒 Locked", "Admin access has been locked.");
    }

    return (
        <View style={{ flex: 1 }}>
            {/* 🔒 PIN Lock Modal */}
            {!isAuthorized && (
                <Modal transparent={true} animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>🔐 Admin Access</Text>
                            <TextInput
                                style={styles.pinInput}
                                placeholder="Enter 4-digit PIN"
                                placeholderTextColor="#aaa"
                                value={enteredPin}
                                onChangeText={setEnteredPin}
                                keyboardType="numeric"
                                secureTextEntry
                                maxLength={4}
                            />
                            <TouchableOpacity style={styles.pinButton} onPress={handlePinSubmit}>
                                <Text style={styles.pinButtonText}>Unlock</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Actual Admin Panel */}
            {isAuthorized && (
                <ScrollView
                    style={[styles.container, { backgroundColor: theme.background }]}
                >
                    <View style={styles.header}>
                        <Text style={[styles.heading, { color: theme.text }]}>
                            ⚙️ Admin Control Panel
                        </Text>
                        <TouchableOpacity onPress={handleLock} style={styles.lockBtn}>
                            <Text style={{ color: "#fff", fontWeight: "700" }}>Lock 🔒</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: theme.text }]}>Message</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                        placeholder="Enter notification message"
                        placeholderTextColor={theme.subtext}
                        value={message}
                        onChangeText={setMessage}
                    />

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={sendBroadcast}
                    >
                        <Text style={styles.buttonText}>Send Broadcast to All</Text>
                    </TouchableOpacity>

                    <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 10 }} />

                    <Text style={[styles.label, { color: theme.text }]}>Nearby Alert</Text>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                        <TextInput
                            style={[styles.inputSmall, { color: theme.text, borderColor: theme.border }]}
                            placeholder="Longitude"
                            placeholderTextColor={theme.subtext}
                            value={lon}
                            onChangeText={setLon}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={[styles.inputSmall, { color: theme.text, borderColor: theme.border }]}
                            placeholder="Latitude"
                            placeholderTextColor={theme.subtext}
                            value={lat}
                            onChangeText={setLat}
                            keyboardType="numeric"
                        />
                    </View>

                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                        placeholder="Radius (meters)"
                        placeholderTextColor={theme.subtext}
                        value={radius}
                        onChangeText={setRadius}
                        keyboardType="numeric"
                    />

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={sendNearby}
                    >
                        <Text style={styles.buttonText}>Send Nearby Alert</Text>
                    </TouchableOpacity>

                    <Text style={[styles.heading, { marginTop: 20, color: theme.text }]}>
                        🧾 Logs
                    </Text>
                    {logs.length === 0 ? (
                        <Text style={{ color: theme.subtext, marginTop: 8 }}>No logs yet</Text>
                    ) : (
                        logs.map((l, i) => (
                            <Text key={i} style={{ color: theme.subtext, fontSize: 12 }}>
                                [{l.ts}] {l.txt}
                            </Text>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    heading: { fontSize: 20, fontWeight: "bold" },
    lockBtn: {
        backgroundColor: "#e63946",
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 14,
    },
    label: { fontWeight: "600", marginTop: 12 },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginTop: 4,
    },
    inputSmall: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginTop: 4,
    },
    button: {
        marginTop: 14,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontWeight: "700" },

    // 🔐 Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    modalContent: {
        width: "80%",
        backgroundColor: "#fff",
        padding: 24,
        borderRadius: 12,
        alignItems: "center",
    },
    modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
    pinInput: {
        width: "80%",
        borderWidth: 1,
        borderRadius: 8,
        borderColor: "#ccc",
        textAlign: "center",
        padding: 10,
        fontSize: 18,
        letterSpacing: 4,
        marginBottom: 12,
    },
    pinButton: {
        backgroundColor: "#007bff",
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    pinButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
