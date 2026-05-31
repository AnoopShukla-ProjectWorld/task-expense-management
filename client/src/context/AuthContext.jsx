import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getMeApi, loginApi, logoutApi } from "../services/authService";
import queryClient from "../app/queryClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Safe localStorage helper wrappers to prevent private/incognito SecurityErrors
  const safeGetItem = (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };

  const safeSetItem = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  };

  const safeRemoveItem = (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  };

  // RESTORE SESSION — getMeApi returns { success, message, data: { user } }
  const fetchUser = async () => {
    try {
      const response = await getMeApi();
      if (response && response.data && response.data.user) {
        const u = response.data.user;
        setUser({
          ...u,
          fullName: u.full_name || u.fullName || "",
        });
        safeSetItem("session_active", "true");
      } else {
        setUser(null);
        safeRemoveItem("session_active");
      }
    } catch (error) {
      setUser(null);
      safeRemoveItem("session_active");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if the localStorage active session flag exists.
    // Since localStorage is isolated between normal and Incognito profiles, 
    // a fresh Incognito window/tab will never have this flag, causing it to instantly redirect to /login.
    const isSessionActive = safeGetItem("session_active") === "true";
    if (isSessionActive) {
      // Dynamic verification on the backend to validate active cookies/tokens
      fetchUser();
    } else {
      // Force instant redirect to /login
      setUser(null);
      setLoading(false);
    }

    const handleSessionExpired = () => {
      const wasActive = safeGetItem("session_active") === "true";
      setUser(null);
      setLoading(false);
      safeRemoveItem("session_active");
      if (wasActive) {
        toast.error("Your session has expired. Please log in again.");
      }
    };

    window.addEventListener("auth-session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth-session-expired", handleSessionExpired);
    };
  }, []);

  // LOGIN — loginApi returns { success, message, data: { user } }
  const login = async (credentials) => {
    try {
      const response = await loginApi(credentials);
      const loggedInUser = response.data.user; // response = { data: { user } }

      const normalizedUser = {
        ...loggedInUser,
        fullName: loggedInUser.full_name || loggedInUser.fullName || "",
      };

      setUser(normalizedUser);
      safeSetItem("session_active", "true");
      toast.success("Login successful");

      return { success: true, user: normalizedUser };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      return { success: false };
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error(error);
    } finally {
      setUser(null);
      safeRemoveItem("session_active");
      try {
        queryClient.clear();
      } catch (e) {}
      toast.success("Logged out successfully");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);