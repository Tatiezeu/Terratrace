// BEHAVIOR: Renders the core dashboard shell including Sidebar, Top Navigation layout, and dynamic Page outlet with auth guards.
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { useState, useEffect, useMemo } from "react";
// BEHAVIOR: Auth hook to check current user roles, profile state, and actions
import { useAuth } from "../../../context/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { GlobalLoadingBar } from "../shared/GlobalLoadingBar";
import { logActivity } from "../../../utils/logger";
import { useServerState } from "../../../context/ServerStateContext";
import ChatbotInterface from "../../../pages/ChatbotPage";

export default function AppLayout() {
  const navigate = useNavigate();
  const { user: rawUser, loading, updateUser, clearAuth } = useAuth();
  const queryClient = useQueryClient();
  const { clearCache } = useServerState();

  // BEHAVIOR: Processes raw user object into layout-safe visual representation with custom avatar URLs
  const user = useMemo(() => {
    if (!rawUser) {
      return {
        role: "loading...",
        name: "User",
        // COLOR_THEME: Default avatar fallback style using Dicebear SVG seeds
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
      };
    }
    
    let avatarUrl = "";
    // BACKEND_CONNECTION: Checks if profilePic points to default backend asset
    if (rawUser.profilePic === 'default-profile.png') {
      avatarUrl = 'http://localhost:5001/assets/default-profile.png';
    } else if (rawUser.profilePic) {
      const isAbsolute = rawUser.profilePic.startsWith('http') || rawUser.profilePic.startsWith('data:');
      avatarUrl = isAbsolute ? rawUser.profilePic : `http://localhost:5001/${rawUser.profilePic.startsWith('/') ? rawUser.profilePic.substring(1) : rawUser.profilePic}`;
      
      // Inject Cloudinary face crop transformations for a sleek navbar presentation
      if (avatarUrl.includes("cloudinary.com") && avatarUrl.includes("/image/upload/")) {
        avatarUrl = avatarUrl.replace("/image/upload/", "/image/upload/c_thumb,g_face,w_200,h_200/");
      }
    } else {
      avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawUser.firstName}`;
    }

    const isAbsolute = rawUser.profilePic && (rawUser.profilePic.startsWith('http') || rawUser.profilePic.startsWith('data:'));
    return {
      role: rawUser.role,
      name: `${rawUser.firstName} ${rawUser.lastName}`,
      avatar: isAbsolute ? avatarUrl : (rawUser.profilePic ? `${avatarUrl}?t=${Date.now()}` : avatarUrl),
    };
  }, [rawUser]);

  // BEHAVIOR: Guarantees user is redirected to Login if auth state hydrates and no user details are found
  useEffect(() => {
    if (!loading && !rawUser) {
        navigate('/login');
    }

    // BEHAVIOR: Triggers toast greeting on initial session start
    if (rawUser) {
      const welcomeKey = `welcome_shown_${rawUser._id || rawUser.id}`;
      if (!sessionStorage.getItem(welcomeKey)) {
        setTimeout(() => {
          toast.success(`Welcome back, ${rawUser.firstName || "User"}!`, {
            description: "You have successfully logged into the TerraTrace Portal.",
          });
        }, 800);
        sessionStorage.setItem(welcomeKey, "true");
      }
    }
  }, [rawUser, loading, navigate]);

  // BEHAVIOR: Switches active user role locally (e.g. multi-role support for devs/admins)
  const handleRoleChange = (newRole) => {
    updateUser({ role: newRole });
  };

  /**
   * handleLogout — Clears ALL session data:
   * 1. Zustand auth store + localStorage token
   * 2. React Query cache (no stale land/user data after logout)
   * 3. Zustand persist blob
   */
  const handleLogout = () => {
    // Log logout before purging session data
    if (rawUser) {
      logActivity('Auth', `User '${rawUser.firstName} ${rawUser.lastName}' logged out`);
    }
    // Clear custom ServerStateContext cache
    clearCache();
    // Clear React Query cache first to wipe sensitive data
    queryClient.clear();
    // Clear auth state (Zustand + localStorage)
    clearAuth();
    // Belt-and-suspenders: remove Zustand persist blob
    localStorage.removeItem('terratrace-auth-storage');
    navigate('/login');
  };

  return (
    <>
      {/* Global loading bar — activates for any in-flight query or mutation */}
      <GlobalLoadingBar />
      {/* COLOR_THEME: Uses standard bg-background class variable for core backdrop */}
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav user={user} onRoleChange={handleRoleChange} onLogout={handleLogout} />
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
      {/* Interactive Land Advisor Chatbot overlay */}
      <ChatbotInterface />
    </>
  );
}
