import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getMeApi, loginApi, logoutApi } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // RESTORE SESSION — getMeApi returns { success, message, data: { user } }
  const fetchUser = async () => {
    try {
      const response = await getMeApi();
      setUser(response.data.user); // response = { data: { user } }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // LOGIN — loginApi returns { success, message, data: { user } }
  const login = async (credentials) => {
    try {
      const response = await loginApi(credentials);
      const loggedInUser = response.data.user; // response = { data: { user } }

      setUser(loggedInUser);
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