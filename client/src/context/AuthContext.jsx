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
        setUser(response.data.user);
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
    // ALWAYS verify session with the backend on every app init.
    //
    // WHY we removed the localStorage "session_active" gate:
    // Chrome shares localStorage across ALL tabs of the SAME Incognito window.
    // So if the user ever logged in during an incognito session, "session_active"
    // persists for all subsequent incognito tabs — making localStorage useless
    // as a security boundary.
    //
    // The HTTP-only cookie IS the true security boundary:
    //   - Normal browser ↔ Incognito: completely isolated cookie jars ✅
    //   - Same normal-browser tabs: shared cookies (session preserved) ✅
    //   - Page refresh: cookies persist (no logout) ✅
    //   - Fresh incognito window (no prior login): no cookie → 401 → redirect ✅
    //   - Fresh incognito window (was previously logged in this session): cookie
    //     validates on backend → session restored (correct behavior) ✅
    fetchUser();

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

      setUser(loggedInUser);
      safeSetItem("session_active", "true");
      toast.success("Login successful");

      return { success: true, user: loggedInUser };
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