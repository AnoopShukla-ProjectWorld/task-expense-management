import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
    } catch (e) {
      console.warn("localStorage is not available:", e);
    }
    return true; // Default to dark mode for premium SaaS look
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      try {
        localStorage.setItem("theme", "dark");
      } catch (e) {}
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      try {
        localStorage.setItem("theme", "light");
      } catch (e) {}
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);