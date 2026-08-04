// BEHAVIOR: Provides user authentication context across the application, interfacing with authStore (Zustand).
import { createContext, useContext, useEffect } from "react";
// BEHAVIOR: Imports Zustand store for authentication state management (JWT token, user profile, hydration status)
import { useAuthStore } from "../store/authStore";
// BACKEND_CONNECTION: Custom axios client configured with default headers and base URL for API requests
import api from "../utils/api";

// BEHAVIOR: Initializes React Context for authentication
const AuthContext = createContext();

// BEHAVIOR: AuthProvider wrapper that exposes user details and auth utility methods to children
export const AuthProvider = ({ children }) => {
    // BEHAVIOR: Destructures authentication state and actions from Zustand store
    const { user, token, hasHydrated, setAuth, clearAuth, updateUser } = useAuthStore();

    // BACKEND_CONNECTION: GET /users/me - Syncs current session user profile from the database using JWT
    const fetchUser = async () => {
        try {
            // BEHAVIOR: Only query database if a JWT is present in local storage
            if (token) {
                // BACKEND_CONNECTION: Fetches authenticated user info
                const response = await api.get('/users/me');
                if (response.data.success) {
                    // BEHAVIOR: Updates global auth state in store with latest profile data
                    setAuth(token, response.data.data);
                }
            }
        } catch (err) {
            console.error("Auth sync failed:", err);
            // BEHAVIOR: Auto-clear authentication if server returns 401 Unauthorized (invalid/expired JWT)
            if (err.response?.status === 401) {
                clearAuth();
            }
        }
    };

    // BEHAVIOR: Syncs authentication status on mount or token changes, and listens for global auth sync events
    useEffect(() => {
        if (token) {
            fetchUser();
        }
        // BEHAVIOR: Listens for custom 'auth-update' events to trigger manual sync from other tabs/processes
        window.addEventListener('auth-update', fetchUser);
        return () => window.removeEventListener('auth-update', fetchUser);
    }, [token]);

    return (
        // BEHAVIOR: Exposes auth context value properties to the subtree
        <AuthContext.Provider value={{ 
            user, 
            token,
            // BEHAVIOR: loading is true until Zustand has finished rehydrating state from localStorage
            // AppLayout's auth guard waits for this before deciding to redirect
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

// BEHAVIOR: Hook for functional components to access Auth context state and triggers
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
