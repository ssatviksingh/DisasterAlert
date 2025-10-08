import React, { useEffect, useState } from "react";
import { View, Text, Alert, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import SOSButton from "../components/SOSButton";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

const { width } = Dimensions.get("window");

export default function SOSScreen({ route }) {
    const { sosId } = route.params || {}; // get sosId if coming from notification
    const [sosDetails, setSosDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sosId) {
            fetchSOSDetails(sosId);
        }
    }, [sosId]);

    const fetchSOSDetails = async (id) => {
        try {
            setLoading(true);
            const res = await fetch(`http://192.168.1.36:4000/sos/${id}`);
            const data = await res.json();
            if (data.ok) {
                setSosDetails(data.sos);
            } else {
                Alert.alert("Error", data.error || "Failed to load SOS");
            }
        } catch (err) {
            Alert.alert("Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    const sendSOS = async () => {
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
                location: { coordinates: [location.coords.longitude, location.coords.latitude] }, // [lon, lat]
            };

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

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="red" />
                <Text>Loading SOS details...</Text>
            </View>
        );
    }

    if (sosId && sosDetails) {
        const lat = sosDetails.lat ?? sosDetails.location?.coordinates?.[1];
        const lon = sosDetails.lon ?? sosDetails.location?.coordinates?.[0];

        return (
            <View style={styles.container}>
                <Text style={styles.title}>🚨 SOS Details</Text>
                <Text>Title: {sosDetails.title}</Text>
                <Text>Description: {sosDetails.description}</Text>
                <Text>Severity: {sosDetails.severity}</Text>
                <Text>Status: {sosDetails.status}</Text>
                <Text>Time: {new Date(sosDetails.createdAt).toLocaleString()}</Text>

                {lat && lon && (
                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: Number(lat),
                            longitude: Number(lon),
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                    >
                        <Marker
                            coordinate={{
                                latitude: Number(lat),
                                longitude: Number(lon),
                            }}
                            title={sosDetails.title}
                            description={sosDetails.description}
                        />
                    </MapView>
                )}
            </View>
        );
    }

    return (
        <View style={styles.center}>
            <SOSButton onSend={sendSOS} />
            <Text style={{ marginTop: 20 }}>Long-press the button to send SOS</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
    map: {
        width: width - 32,
        height: 200,
        marginTop: 16,
        borderRadius: 12,
    },
});
