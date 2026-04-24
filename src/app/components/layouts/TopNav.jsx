import { useState, useEffect } from "react";
import { Moon, Sun, Bell, Check, Trash2, Reply, Wifi } from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function TopNav({ user, onRoleChange }) {
  const [time, setTime] = useState(new Date());
  const { theme, setTheme } = useTheme();
  
  // Mock live notifications for the bell
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Plot Approval", message: "Investigation for CM-234 is complete.", time: "2m ago", unread: true },
    { id: 2, title: "New Message", message: "Notary Jean-Pierre sent documents.", time: "1h ago", unread: true },
    { id: 3, title: "Payment Due", message: "Service fee for Plot 7890 pending.", time: "5h ago", unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    toast.success("All notifications marked as read", { description: "You're all caught up!" });
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("Cleared all notifications");
  };

  const handleAction = (id, action) => {
    if (action === 'read') {
      setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
      toast.success("Marked as read");
    } else if (action === 'delete') {
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success("Notification removed");
    }
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-20 bg-white/80 dark:bg-[#001529]/90 backdrop-blur-md border-b border-border px-8 flex items-center justify-between sticky top-0 z-50 transition-colors"
    >
      <div className="flex items-center gap-6">
        {/* Live Clock */}
        <div className="hidden md:flex flex-col">
          <span className="text-xl font-bold font-['Syne'] text-[var(--terra-navy)] dark:text-white">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none">
            {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* System Online Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">System Online</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Bell with Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2.5 rounded-xl hover:bg-accent transition-colors group">
              <Bell className="w-5 h-5 text-foreground group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-[8px] text-white font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-2xl overflow-hidden border-none shadow-2xl mr-4">
            <div className="bg-[var(--terra-navy)] p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold font-['Syne']">Notifications</h3>
                <p className="text-[10px] text-white/60 uppercase tracking-widest">{unreadCount} Unread Alerts</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={markAllAsRead} className="h-8 w-8 text-white hover:bg-white/10" title="Mark all read">
                  <Check className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={clearAll} className="h-8 w-8 text-white hover:bg-white/10" title="Clear all">
                   <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="max-h-[360px] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 divide-y divide-border/50">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 flex gap-3 hover:bg-accent/30 transition-colors relative group/item ${n.unread ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""}`}
                  >
                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.unread ? "bg-emerald-500" : "bg-transparent"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-[9px] text-muted-foreground mt-1 uppercase font-medium tracking-wider">{n.time}</p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <Link to="/dashboard/notifications" className="p-1 hover:bg-blue-50 dark:hover:bg-blue-950 rounded text-blue-500" title="Reply">
                        <Reply className="w-3.5 h-3.5" />
                      </Link>
                      {n.unread && (
                        <button onClick={() => handleAction(n.id, 'read')} className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded text-emerald-500" title="Mark as read">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleAction(n.id, 'delete')} className="p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded text-red-500" title="Remove">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-medium">All caught up!</p>
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <Link to="/dashboard/notifications" className="block w-full py-3 text-center text-xs font-bold text-[var(--terra-emerald)] hover:bg-accent border-t border-border/50 bg-white dark:bg-slate-800">
                View All Messages →
              </Link>
            )}
          </PopoverContent>
        </Popover>

        {/* Theme Switcher */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-xl hover:bg-accent transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-foreground" />
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <Avatar className="w-10 h-10 ring-2 ring-[var(--terra-emerald)] ring-offset-2 ring-offset-background">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-[var(--terra-navy)] text-white font-semibold">
              {user.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--terra-navy)] dark:text-white leading-tight">
              {user.name}
            </span>
            <span className="text-[10px] text-[var(--terra-emerald)] font-black uppercase tracking-widest">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
