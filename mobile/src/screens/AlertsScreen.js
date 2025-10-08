import React, { useEffect, useState, useContext, useRef, memo } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Alert,
    Dimensions,
    TouchableOpacity,
    Animated,
} from "react-native";
import { io } from "socket.io-client";
import * as Location from "expo-location";
import SOSButton from "../components/SOSButton";
import MapView, { Marker } from "react-native-maps";
import { ThemeContext } from "../contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const AlertCard = memo(
    ({ item, index, theme, getSeverityColor, removeAlert, navigation, user }) => {
        const fadeAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
            }).start();
        }, [fadeAnim, index]);

        return (
            <Animated.View style={[styles.alertCard(theme), { opacity: fadeAnim }]}>
                <View style={styles.alertHeader}>
                    <Text style={styles.alertTitle(theme)}>{item.title || "SOS Alert"}</Text>
                    <View
                        style={[
                            styles.severityBadge,
                            { backgroundColor: getSeverityColor(item.severity) },
                        ]}
                    >
                        <Text style={styles.severityText}>{item.severity}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeAlert(item._id)}>
                        <Text style={styles.closeButton}>✖</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.alertText(theme)}>{item.description || "No description"}</Text>
                <Text style={styles.alertSub(theme)}>ID: {item._id}</Text>
                <Text style={styles.alertSub(theme)}>
                    Location:{" "}
                    {item.lat && item.lon
                        ? `${Number(item.lat).toFixed(5)}, ${Number(item.lon).toFixed(5)}`
                        : "Unknown"}
                </Text>
                <Text style={styles.alertSub(theme)}>
                    Created At:{" "}
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown"}
                </Text>

                <TouchableOpacity
                    style={[styles.chatButton, { backgroundColor: "#007bff" }]}
                    onPress={() =>
                        navigation.navigate("Chat", {
                            sosId: item._id,
                            userId: user?._id ?? "guest",
                            userName: user?.name ?? "Guest",
                        })
                    }
                >
                    <Text style={{ color: "#fff" }}>💬 Chat</Text>
                </TouchableOpacity>

                {item.lat && item.lon && (
                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: Number(item.lat),
                            longitude: Number(item.lon),
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                    >
                        <Marker
                            coordinate={{
                                latitude: Number(item.lat),
                                longitude: Number(item.lon),
                            }}
                            title={item.title}
                            description={item.description}
                        />
                    </MapView>
                )}
            </Animated.View>
        );
    }
);

export default function AlertsScreen({ navigation }) {
    const [sosAlerts, setSosAlerts] = useState([]);
    const [filterSeverity, setFilterSeverity] = useState("All");
    const [sortNewest, setSortNewest] = useState(true);
    const { theme, isDark, toggleTheme } = useContext(ThemeContext);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Load user info from AsyncStorage
        const loadUser = async () => {
            try {
                const userData = await AsyncStorage.getItem("user");
                if (userData) setUser(JSON.parse(userData));
            } catch (err) {
                console.warn("Failed to load user info:", err);
            }
        };
        loadUser();
    }, []);

    useEffect(() => {
        const socket = io("http://192.168.1.36:4000");
        socket.on("connect", () => console.log("✅ Connected to backend"));
        socket.on("sos:new", (data) => {
            console.log("📩 New SOS received:", data);
            setSosAlerts((prev) => [data, ...prev].slice(0, 30));
        });
        socket.on("removeSOS", ({ _id }) => {
            setSosAlerts((prev) => prev.filter((s) => s._id !== _id));
        });
        return () => socket.disconnect();
    }, []);

    const sendSOS = async (severity = "Medium") => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission denied", "Location permission is required to send SOS");
                return;
            }
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
            const payload = {
                title: "SOS from mobile",
                description: "Need help",
                location: { coordinates: [location.coords.longitude, location.coords.latitude] },
                severity,
            };
            console.log("📤 Sending SOS payload:", payload);

            const res = await fetch("http://192.168.1.36:4000/sos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.ok) Alert.alert("✅ SOS sent!", `ID: ${data.sos._id}`);
        } catch (err) {
            Alert.alert("Error", err.message);
        }
    };

    const removeAlert = async (id) => {
        try {
            await fetch(`http://192.168.1.36:4000/sos/${id}`, { method: "DELETE" });
            setSosAlerts((prev) => prev.filter((alert) => alert._id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case "Critical":
                return "#e63946";
            case "High":
                return "#ff8800";
            case "Medium":
                return "#fbc02d";
            case "Low":
                return "#4caf50";
            default:
                return "#999";
        }
    };

    const filteredAlerts = sosAlerts
        .filter((item) => filterSeverity === "All" || item.severity === filterSeverity)
        .sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortNewest ? dateB - dateA : dateA - dateB;
        });

    return (
        <View style={styles.container(theme)}>
            <View style={styles.headerRow}>
                <Text style={styles.heading(theme)}>🚨 Real-Time SOS Alerts</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity style={styles.headerBtn(theme)} onPress={toggleTheme}>
                        <Text style={{ color: "#fff" }}>{isDark ? "☀️" : "🌙"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerBtn(theme)}
                        onPress={() => navigation.navigate("MapView")}
                    >
                        <Text style={{ color: "#fff" }}>🗺️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerBtn(theme)}
                        onPress={() => navigation.navigate("AdminPanel")}
                    >
                        <Text style={{ color: "#fff" }}>⚙️</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.controls}>
                <View style={styles.filterBar}>
                    {["All", "Critical", "High", "Medium", "Low"].map((option) => (
                        <TouchableOpacity
                            key={option}
                            onPress={() => setFilterSeverity(option)}
                            style={[
                                styles.filterButton(theme),
                                filterSeverity === option && styles.activeFilter(theme),
                            ]}
                        >
                            <Text
                                style={{
                                    color: filterSeverity === option ? "#fff" : theme.text,
                                    fontWeight: "600",
                                }}
                            >
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.sortButton(theme)}
                    onPress={() => setSortNewest(!sortNewest)}
                >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                        {sortNewest ? "Newest ↓" : "Oldest ↑"}
                    </Text>
                </TouchableOpacity>
            </View>

            {filteredAlerts.length === 0 ? (
                <Text style={{ textAlign: "center", marginTop: 20, color: theme.subtext }}>
                    No alerts yet
                </Text>
            ) : (
                <FlatList
                    data={filteredAlerts}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item, index }) => (
                        <AlertCard
                            item={item}
                            index={index}
                            theme={theme}
                            getSeverityColor={getSeverityColor}
                            removeAlert={removeAlert}
                            navigation={navigation}
                            user={user}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 120 }}
                />
            )}

            <View style={styles.sosButtonContainer}>
                <SOSButton onSend={(severity) => sendSOS(severity)} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: (theme) => ({
        flex: 1,
        padding: 16,
        backgroundColor: theme.background,
    }),
    heading: (theme) => ({
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 12,
        color: theme.text,
    }),
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerBtn: (theme) => ({
        backgroundColor: theme.primary,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    }),
    controls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    filterBar: { flexDirection: "row", flexWrap: "wrap", flex: 1 },
    filterButton: (theme) => ({
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: theme.card,
        marginRight: 6,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: theme.border,
    }),
    activeFilter: (theme) => ({ backgroundColor: theme.primary }),
    sortButton: (theme) => ({
        backgroundColor: theme.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 8,
    }),
    alertCard: (theme) => ({
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 3,
    }),
    alertHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    alertTitle: (theme) => ({
        fontSize: 16,
        fontWeight: "bold",
        color: theme.text,
        flex: 1,
    }),
    severityBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    severityText: { color: "#fff", fontWeight: "700", fontSize: 12 },
    closeButton: { fontSize: 18, color: "#888" },
    alertText: (theme) => ({ marginBottom: 4, color: theme.text }),
    alertSub: (theme) => ({ fontSize: 12, color: theme.subtext, marginBottom: 2 }),
    map: {
        width: width - 64,
        height: 140,
        marginTop: 10,
        borderRadius: 10,
    },
    sosButtonContainer: {
        position: "absolute",
        bottom: 30,
        alignSelf: "center",
    },
    chatButton: {
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 8,
    },
});
