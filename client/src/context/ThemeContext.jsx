import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false); // Force light theme only

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    try {
      localStorage.setItem("theme", "light");
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    // Keep as no-op to prevent broken clicks, remaining strictly light-theme
  };

  return (
    <ThemeContext.Provider value={{ darkMode: false, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);