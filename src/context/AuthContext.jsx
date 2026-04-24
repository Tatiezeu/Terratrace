import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const response = await api.get('/users/me');
            if (response.data.success) {
                setUser(response.data.data);
            }
        } catch (err) {
            console.error("Auth initialization failed:", err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
        window.addEventListener('auth-update', fetchUser);
        return () => window.removeEventListener('auth-update', fetchUser);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, setUser, refreshUser: fetchUser }}>
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
