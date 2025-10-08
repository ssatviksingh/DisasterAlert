
import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveTheme = async (isDark) => {
    try {
        await AsyncStorage.setItem("isDarkMode", JSON.stringify(isDark));
    } catch (e) {
        console.warn("Failed to save theme:", e);
    }
};

export const loadTheme = async () => {
    try {
        const val = await AsyncStorage.getItem("isDarkMode");
        return val ? JSON.parse(val) : false;
    } catch {
        return false;
    }
};
