import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { io } from "socket.io-client";
import { ThemeContext } from "../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function MapViewScreen({ navigation }) {
    const [alerts, setAlerts] = useState([]);
    const { theme } = useContext(ThemeContext);

    useEffect(() => {
        const socket = io("http://192.168.1.36:4000");
        socket.on("connect", () => console.log("🗺️ Map connected"));
        socket.on("sos:new", (data) => setAlerts((p) => [data, ...p]));
        return () => socket.disconnect();
    }, []);

    return (
        <View style={[styles.container(theme)]}>
            <MapView
                style={styles.map}
                initialRegion={{ latitude: 37.4219983, longitude: -122.084, latitudeDelta: 0.2, longitudeDelta: 0.2 }}
            >
                {alerts.map(
                    (a) =>
                        a.lat &&
                        a.lon && (
                            <Marker
                                key={a._id}
                                coordinate={{ latitude: a.lat, longitude: a.lon }}
                                title={a.title}
                                description={a.severity}
                            />
                        )
                )}
            </MapView>
            <TouchableOpacity style={styles.backBtn(theme)} onPress={() => navigation.goBack()}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>⬅ Back</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    map: { width, height },
    backBtn: (theme) => ({
        position: "absolute",
        top: 50,
        left: 20,
        backgroundColor: theme.primary,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    }),
});
