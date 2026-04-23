import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { useState } from "react";

export default function AppLayout() {
  // Mock user - in production this would come from auth context
  const [user, setUser] = useState({
    role: "admin",
    name: "Marie Kouadio",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marie",
  });

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
