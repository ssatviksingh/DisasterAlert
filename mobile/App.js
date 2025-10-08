// App.js
import React, { useEffect, useRef, useState } from "react";
import { Alert, Platform, ActivityIndicator, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

import AlertsScreen from "./src/screens/AlertsScreen";
import SOSScreen from "./src/screens/SOSScreen";
import MapViewScreen from "./src/screens/MapViewScreen";
import AdminPanelScreen from "./src/screens/AdminPanelScreen";
import ChatScreen from "./src/screens/ChatScreen";
import AuthScreen from "./src/screens/AuthScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

import { lightTheme, darkTheme } from "./src/theme/theme";
import { loadTheme, saveTheme } from "./src/utils/storage";
import { ThemeContext } from "./src/contexts/ThemeContext";

const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Auth");
  const theme = isDark ? darkTheme : lightTheme;
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  // Load theme preference
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadTheme();
        setIsDark(!!saved);
      } catch { }
    })();
  }, []);

  const toggleTheme = async () => {
    setIsDark((prev) => {
      saveTheme(!prev);
      return !prev;
    });
  };

  // Verify token on app start
  useEffect(() => {
    const verifyLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setInitialRoute("Auth");
          setLoading(false);
          return;
        }

        const res = await fetch("http://192.168.1.36:4000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.ok) {
          console.log("✅ Token valid for:", data.user.email);
          await AsyncStorage.setItem("user", JSON.stringify(data.user));
          setInitialRoute("Alerts");
        } else {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          setInitialRoute("Auth");
        }
      } catch (err) {
        console.error("Token check failed:", err);
        setInitialRoute("Auth");
      } finally {
        setLoading(false);
      }
    };
    verifyLogin();
  }, []);

  // Setup Expo Notifications safely
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        console.log("Expo Push Token:", token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification response:", response);
      }
    );

    return () => {
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.text, marginTop: 10 }}>Checking session...</Text>
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Alerts" component={AlertsScreen} />
          <Stack.Screen name="SOS" component={SOSScreen} />
          <Stack.Screen name="MapView" component={MapViewScreen} />
          <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeContext.Provider>
  );
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert("Permission required for push notifications");
      return null;
    }
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra?.eas?.projectId,
      })
    ).data;
  } else {
    Alert.alert("Use a physical device for notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
