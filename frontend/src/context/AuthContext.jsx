import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
      } catch (_error) {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    init();

    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    clearSession();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:logout"));
    }
  };

  const refreshMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (_error) {
      clearSession();
    }
  };

  const value = useMemo(() => ({ user, loading, register, login, logout, refreshMe }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
