import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "sonner";

export default function AppLayout() {
  const navigate = useNavigate();
  const { user: rawUser, loading, updateUser } = useAuth();

  const user = useMemo(() => {
    if (!rawUser) {
      return {
        role: "loading...",
        name: "User",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
      };
    }
    
    let avatarUrl = "";
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

  useEffect(() => {
    if (!loading && !rawUser) {
        navigate('/login');
    }

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

  const handleRoleChange = (newRole) => {
    updateUser({ role: newRole });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav user={user} onRoleChange={handleRoleChange} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
