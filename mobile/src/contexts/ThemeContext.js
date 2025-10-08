// src/contexts/ThemeContext.js
import { createContext } from "react";

export const ThemeContext = createContext({
    theme: {
        background: "#fff",
        card: "#fff",
        text: "#000",
        subtext: "#666",
        primary: "#007bff",
        border: "#ddd",
    },
    isDark: false,
    toggleTheme: () => { },
});
