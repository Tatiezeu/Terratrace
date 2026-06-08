import { createContext, useContext, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const { user, token, hasHydrated, setAuth, clearAuth, updateUser } = useAuthStore();

    const fetchUser = async () => {
        try {
            if (token) {
                const response = await api.get('/users/me');
                if (response.data.success) {
                    setAuth(token, response.data.data);
                }
            }
        } catch (err) {
            console.error("Auth sync failed:", err);
            if (err.response?.status === 401) {
                clearAuth();
            }
        }
    };

    useEffect(() => {
        if (token) {
            fetchUser();
        }
        window.addEventListener('auth-update', fetchUser);
        return () => window.removeEventListener('auth-update', fetchUser);
    }, [token]);

    return (
        <AuthContext.Provider value={{ 
            user, 
            token,
            // loading is true until Zustand has finished rehydrating from localStorage.
            // AppLayout's auth guard waits for this before deciding to redirect.
            loading: !hasHydrated,
            setUser: (u) => setAuth(token, u), 
            refreshUser: fetchUser, 
            updateUser,
            clearAuth,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
