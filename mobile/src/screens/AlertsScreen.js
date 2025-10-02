import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Alert, Dimensions } from "react-native";
import { io } from "socket.io-client";
import * as Location from "expo-location";
import SOSButton from "../components/SOSButton";
import MapView, { Marker } from "react-native-maps";

const { width } = Dimensions.get("window");

export default function AlertsScreen() {
    const [sosAlerts, setSosAlerts] = useState([]);

    useEffect(() => {
        const socket = io("http://192.168.0.102:4000"); // replace with your backend IP

        socket.on("connect", () => console.log("Connected to backend via Socket.IO"));

        socket.on("newSOS", (data) => {
            console.log("New SOS received:", data);
            setSosAlerts((prev) => [data, ...prev]);
        });

        return () => socket.disconnect();
    }, []);

    // sendSOS now accepts a severity parameter
    const sendSOS = async (severity = "Medium") => {
        console.log("Sending SOS with severity:", severity);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission denied", "Location permission is required to send SOS");
                return;
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });

            const payload = {
                title: "SOS from mobile",
                description: "Need help",
                location: {
                    coordinates: [location.coords.longitude, location.coords.latitude],
                },
                severity, // use selected severity
            };

            const res = await fetch("http://192.168.0.102:4000/sos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.ok) Alert.alert("SOS sent!", `ID: ${data.sos._id}`);
        } catch (err) {
            Alert.alert("Error", err.message);
        }
    };

    const getAlertColor = (severity) => {
        switch (severity) {
            case "Critical": return "#ff4d4d"; // bright red
            case "High": return "#ff944d";     // orange
            case "Medium": return "#fff3cd";   // yellow
            case "Low": return "#d4edda";      // green
            default: return "#f8d7da";         // fallback red
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Real-Time SOS Alerts</Text>

            {sosAlerts.length === 0 ? (
                <Text>No alerts yet</Text>
            ) : (
                <FlatList
                    data={sosAlerts}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <View style={[styles.alertBox, { backgroundColor: getAlertColor(item.severity) }]}>
                            <Text style={styles.title}>{item.title || "SOS Alert"}</Text>
                            <Text>{item.description || "No description"}</Text>
                            <Text>ID: {item._id}</Text>
                            <Text>
                                Location:{" "}
                                {item.location
                                    ? `${item.location.coordinates[1].toFixed(5)}, ${item.location.coordinates[0].toFixed(5)}`
                                    : "Unknown"}
                            </Text>
                            <Text>
                                Created At: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown"}
                            </Text>

                            {item.location && (
                                <MapView
                                    style={styles.map}
                                    initialRegion={{
                                        latitude: item.location.coordinates[1],
                                        longitude: item.location.coordinates[0],
                                        latitudeDelta: 0.01,
                                        longitudeDelta: 0.01,
                                    }}
                                >
                                    <Marker
                                        coordinate={{
                                            latitude: item.location.coordinates[1],
                                            longitude: item.location.coordinates[0],
                                        }}
                                    />
                                </MapView>
                            )}
                        </View>
                    )}
                />
            )}

            <View style={styles.sosButtonContainer}>
                <SOSButton onSend={(severity) => sendSOS(severity)} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#fff" },
    heading: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
    alertBox: {
        padding: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
    },
    title: { fontWeight: "bold", color: "#721c24" }, // dark red for title
    sosButtonContainer: {
        position: "absolute",
        bottom: 40,
        alignSelf: "center",
    },
    map: {
        width: width - 60,
        height: 120,
        marginTop: 10,
        borderRadius: 8,
    },
});
