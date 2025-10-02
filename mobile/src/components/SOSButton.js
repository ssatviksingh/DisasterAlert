import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Modal } from "react-native";

export default function SOSButton({ onSend }) {
    const [modalVisible, setModalVisible] = useState(false);

    const sendWithSeverity = (severity) => {
        onSend(severity); // pass severity to parent
        setModalVisible(false);
    };

    return (
        <View>
            <TouchableOpacity
                style={styles.button}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.buttonText}>SOS</Text>
            </TouchableOpacity>

            <Modal
                transparent
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Select Severity</Text>
                        {["Critical", "High", "Medium", "Low"].map((level) => (
                            <TouchableOpacity
                                key={level}
                                style={[styles.severityButton, { backgroundColor: getColor(level) }]}
                                onPress={() => sendWithSeverity(level)}
                            >
                                <Text style={styles.severityText}>{level}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getColor = (level) => {
    switch (level) {
        case "Critical": return "#ff4d4d";
        case "High": return "#ff944d";
        case "Medium": return "#fff3cd";
        case "Low": return "#d4edda";
        default: return "#f8d7da";
    }
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: "red",
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 50,
    },
    buttonText: { color: "white", fontWeight: "bold", fontSize: 18 },
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: 250,
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
    severityButton: {
        width: "100%",
        padding: 10,
        marginVertical: 5,
        borderRadius: 8,
        alignItems: "center",
    },
    severityText: { fontWeight: "bold" },
});
