import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  MapPin,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  FileCheck,
  Users,
  Bell,
  Settings as SettingsIcon,
  Database,
  Activity,
  UserX,
  ScrollText,
  FileSearch
} from "lucide-react";
import { cn } from "../ui/utils";
import { motion } from "motion/react";
import Logo from "../shared/Logo";
import { useQuery } from "@tanstack/react-query";
import api from "../../../utils/api";

const navItems = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/dashboard",
    roles: ["Client", "Landowner", "LRO", "Notary", "SuperAdmin"],
  },
  {
    label: "Land Plots",
    icon: <Map className="w-5 h-5" />,
    path: "/dashboard/land-plots",
    roles: ["Client", "Landowner", "SuperAdmin"],
  },
  {
    label: "My Land Plots",
    icon: <MapPin className="w-5 h-5" />,
    path: "/dashboard/my-land-plots",
    roles: ["Client", "Landowner", "SuperAdmin"],
  },
  {
    label: "Track Applications",
    icon: <FileSearch className="w-5 h-5" />,
    path: "/dashboard/applications",
    roles: ["Client", "Landowner", "LRO", "Notary", "SuperAdmin"],
  },
  {
    label: "Registry Officer",
    icon: <ShieldCheck className="w-5 h-5" />,
    path: "/dashboard/lro",
    roles: ["LRO", "SuperAdmin"],
  },
  {
    label: "Notary Officer",
    icon: <FileCheck className="w-5 h-5" />,
    path: "/dashboard/notary",
    roles: ["Notary", "SuperAdmin"],
  },
  {
    label: "Officer Management",
    icon: <Users className="w-5 h-5" />,
    path: "/dashboard/admin",
    roles: ["SuperAdmin"],
  },
  {
    label: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    path: "/dashboard/notifications",
    roles: ["Client", "Landowner", "LRO", "Notary", "SuperAdmin"],
  },
  {
    label: "Public Notices",
    icon: <Users className="w-5 h-5" />,
    path: "/dashboard/notices",
    roles: ["Client", "Landowner", "LRO", "Notary", "SuperAdmin"],
  },
  {
    label: "Profile",
    icon: <UserIcon className="w-5 h-5" />,
    path: "/dashboard/profile",
    roles: ["Client", "Landowner", "LRO", "Notary", "SuperAdmin"],
  },
  {
    label: "Settings",
    icon: <SettingsIcon className="w-5 h-5" />,
    path: "/dashboard/settings",
    roles: ["SuperAdmin"],
  },
];

export function Sidebar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === "SuperAdmin";

  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const response = await api.get('/users');
      if (!response.data.success) throw new Error('Failed to fetch users');
      return response.data.data;
    },
    enabled: isSuperAdmin,
    staleTime: 60 * 1000,
  });

  const { data: activityLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      try {
        const response = await api.get('/logs');
        if (response.data && response.data.success) {
          const serverLogs = response.data.data;
          const localLogsJson = localStorage.getItem('terratrace_activity_logs');
          const localLogs = localLogsJson ? JSON.parse(localLogsJson) : [];
          const allLogs = [...serverLogs, ...localLogs];
          const uniqueLogs = Array.from(new Map(allLogs.map(item => [item.id || item._id, item])).values());
          return uniqueLogs;
        }
      } catch (err) {
        // Fallback to local storage if API call fails
      }
      const localLogsJson = localStorage.getItem('terratrace_activity_logs');
      return localLogsJson ? JSON.parse(localLogsJson) : [];
    },
    enabled: isSuperAdmin,
    staleTime: 5 * 1000,
  });

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the JWT token
    navigate("/");
    window.location.reload(); // Refresh to clear context state
  };

  const getRoleName = (role) => {
    const roleNames = {
      Client: "Client",
      Landowner: "Landowner",
      LRO: "Land Registry Officer",
      Notary: "Notary Officer",
      SuperAdmin: "Super Administrator",
    };
    return roleNames[role] || role;
  };

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-[280px] bg-[var(--terra-navy)] text-white flex flex-col"
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <Link to="/">
          <Logo variant="dark" />
        </Link>
      </div>

      {/* Role Header */}
      <div className="px-6 py-4 bg-white/5">
        <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
          Role
        </p>
        <p className="text-sm font-semibold mt-1">{getRoleName(user.role)}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {visibleNavItems.map((item, index) => {
          const isActive = location.pathname === item.path;

          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                  isActive
                    ? "bg-[var(--terra-emerald)] text-white shadow-lg shadow-emerald-500/20"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-[var(--terra-emerald)] rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{item.icon}</span>
                <span className="relative z-10 font-medium text-sm">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}

        {/* System Cards in Sidebar (for Admin only, or specifically on Settings page context) */}
        {user.role === "SuperAdmin" && (() => {
          const nodesCount = isLoadingUsers ? 4 : allUsers.filter(u => u.role === 'LRO' || u.role === 'Notary').length;
          const activeCount = isLoadingUsers ? 142 : allUsers.filter(u => u.status === 'active').length;
          const suspendedCount = isLoadingUsers ? 12 : allUsers.filter(u => u.status === 'suspended').length;
          const logsCount = isLoadingLogs 
            ? '2.4k'
            : (activityLogs.length > 999 ? (activityLogs.length / 1000).toFixed(1) + 'k' : activityLogs.length);

          return (
            <div className="pt-8 pb-4 px-4 space-y-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-2 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Live System Stats
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <Database className="w-3.5 h-3.5 text-purple-400 mb-1" />
                  <p className="text-xs font-bold">{nodesCount}</p>
                  <p className="text-[9px] text-white/40">Nodes</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                  <p className="text-xs font-bold">{activeCount}</p>
                  <p className="text-[9px] text-white/40">Active</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <UserX className="w-3.5 h-3.5 text-red-400 mb-1" />
                  <p className="text-xs font-bold">{suspendedCount}</p>
                  <p className="text-[9px] text-white/40">Suspended</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <ScrollText className="w-3.5 h-3.5 text-blue-400 mb-1" />
                  <p className="text-xs font-bold">{logsCount}</p>
                  <p className="text-[9px] text-white/40">Logs</p>
                </div>
              </div>
            </div>
          );
        })()}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </motion.aside>
  );
}
