import React, { useState, useContext } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../contexts/ThemeContext";

export default function AuthScreen({ navigation }) {
    const { theme } = useContext(ThemeContext);
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ name: "", email: "", password: "" });

    const handleChange = (key, value) => setForm({ ...form, [key]: value });

    async function handleAuth() {
        const url = `http://192.168.1.36:4000/auth/${isLogin ? "login" : "register"}`;

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!data.ok) return Alert.alert("Error", data.error);

            await AsyncStorage.setItem("user", JSON.stringify(data.user));
            await AsyncStorage.setItem("token", data.token);

            Alert.alert("✅ Success", `Welcome ${data.user.name}`);
            navigation.replace("Alerts");
        } catch (err) {
            Alert.alert("Error", err.message);
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.text }]}>
                {isLogin ? "Login" : "Register"}
            </Text>

            {!isLogin && (
                <TextInput
                    placeholder="Name"
                    value={form.name}
                    onChangeText={(t) => handleChange("name", t)}
                    style={styles.input}
                />
            )}

            <TextInput
                placeholder="Email"
                value={form.email}
                onChangeText={(t) => handleChange("email", t)}
                style={styles.input}
                autoCapitalize="none"
            />

            <TextInput
                placeholder="Password"
                value={form.password}
                onChangeText={(t) => handleChange("password", t)}
                style={styles.input}
                secureTextEntry
            />

            <TouchableOpacity onPress={handleAuth} style={styles.btn}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                    {isLogin ? "Login" : "Register"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <Text style={{ color: "#007bff", marginTop: 15 }}>
                    {isLogin ? "No account? Register" : "Have an account? Login"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 24 },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
    },
    btn: {
        backgroundColor: "#007bff",
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: "center",
    },
});
