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
  ScrollText
} from "lucide-react";
import { cn } from "../ui/utils";
import { motion } from "motion/react";
import Logo from "../shared/Logo";

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
    roles: ["Landowner", "SuperAdmin"],
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
        {user.role === "SuperAdmin" && (
          <div className="pt-8 pb-4 px-4 space-y-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-2">Live System Stats</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <Database className="w-3.5 h-3.5 text-purple-400 mb-1" />
                <p className="text-xs font-bold">4</p>
                <p className="text-[9px] text-white/40">Nodes</p>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <Activity className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                <p className="text-xs font-bold">142</p>
                <p className="text-[9px] text-white/40">Active</p>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <UserX className="w-3.5 h-3.5 text-red-400 mb-1" />
                <p className="text-xs font-bold">12</p>
                <p className="text-[9px] text-white/40">Suspended</p>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <ScrollText className="w-3.5 h-3.5 text-blue-400 mb-1" />
                <p className="text-xs font-bold">2.4k</p>
                <p className="text-[9px] text-white/40">Logs</p>
              </div>
            </div>
          </div>
        )}
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
