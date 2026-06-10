import React, { createContext, useState, useEffect } from "react";
import { THEMES, getStatusConfig } from "./theme";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState("dark");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setThemeState(savedTheme);
  }, []);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const currentThemeObj = THEMES[theme];
  const statusConfig = getStatusConfig(theme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: currentThemeObj, statusConfig, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
