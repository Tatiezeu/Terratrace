import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "sonner";

export default function AppLayout() {
  const navigate = useNavigate();
  const { user: rawUser, loading } = useAuth();
  
  const [user, setUser] = useState({
    role: "loading...",
    name: "User",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
  });

  useEffect(() => {
    if (!loading && !rawUser) {
        navigate('/login');
    }

    if (rawUser) {
      const avatarUrl = rawUser.profilePic 
        ? (rawUser.profilePic.startsWith('http') ? rawUser.profilePic : `http://localhost:5001${rawUser.profilePic}`)
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawUser.firstName}`;

      setUser({
        role: rawUser.role,
        name: `${rawUser.firstName} ${rawUser.lastName}`,
        avatar: `${avatarUrl}?t=${Date.now()}`,
      });

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
    setUser((prev) => ({ ...prev, role: newRole }));
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
