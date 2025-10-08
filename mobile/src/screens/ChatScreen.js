import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
} from "react-native";
import { io } from "socket.io-client";

export default function ChatScreen({ route }) {
    const { sosId, userId, userName } = route.params;
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    const socket = io("http://192.168.1.36:4000");

    useEffect(() => {
        socket.emit("joinChat", sosId);

        socket.on(`chat:${sosId}`, (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        fetchMessages();

        return () => socket.disconnect();
    }, []);

    async function fetchMessages() {
        const res = await fetch(`http://192.168.1.36:4000/chat/${sosId}`);
        const data = await res.json();
        if (data.ok) setMessages(data.messages);
    }

    async function sendMessage() {
        if (!message.trim()) return;
        const msgData = { sosId, userId, message };
        const res = await fetch("http://192.168.1.36:4000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msgData),
        });
        const data = await res.json();
        if (data.ok) {
            setMessages((prev) => [...prev, data.message]);
            setMessage("");
        }
    }

    const renderItem = ({ item }) => (
        <View
            style={[
                styles.messageBubble,
                item.userId?.name === userName
                    ? styles.myMessage
                    : styles.otherMessage,
            ]}
        >
            <Text style={styles.senderName}>{item.userId?.name || "Unknown"}</Text>
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.timestamp}>
                {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.chatArea}
            />
            <View style={styles.inputRow}>
                <TextInput
                    value={message}
                    onChangeText={setMessage}
                    style={styles.input}
                    placeholder="Type message..."
                />
                <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
                    <Text style={{ color: "#fff" }}>Send</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f9fa" },
    chatArea: { padding: 10 },
    messageBubble: {
        maxWidth: "80%",
        padding: 10,
        borderRadius: 8,
        marginVertical: 4,
    },
    myMessage: {
        alignSelf: "flex-end",
        backgroundColor: "#007bff",
    },
    otherMessage: {
        alignSelf: "flex-start",
        backgroundColor: "#e5e5ea",
    },
    senderName: { fontWeight: "600", color: "#333" },
    messageText: { color: "#fff" },
    timestamp: { fontSize: 10, color: "#ddd", textAlign: "right" },
    inputRow: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        alignItems: "center",
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        borderColor: "#ccc",
        paddingHorizontal: 10,
        marginRight: 8,
    },
    sendBtn: {
        backgroundColor: "#007bff",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
});
