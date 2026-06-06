import { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert, Users, UserPlus, Activity, Database, Search,
  ArrowUpRight, ChevronRight, Building, Gavel, X, Clock,
  CheckCircle2, Ban, Trash2, ScrollText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Badge } from "../app/components/ui/badge";
import { Input } from "../app/components/ui/input";
import { RegisterOfficerModal } from "../app/components/admin/RegisterOfficerModal";
import { motion } from "motion/react";
import { toast } from "sonner";
import api from "../utils/api";
import { cn } from "../app/components/ui/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "../app/components/ui/dialog";

import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAllUsers } from "../hooks/useAdminData";
import { useLandPlots } from "../hooks/useLandData";
import { useNotifications } from "../hooks/useNotificationsData";
import { useAuth } from "../context/AuthContext";

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [officerType, setOfficerType] = useState("lro");
  const [officerSearch, setOfficerSearch] = useState("");
  const [showAllLogs, setShowAllLogs] = useState(false);

  const queryClient = useQueryClient();

  // ─── Server state via TanStack Query ─────────────────────────────────────────
  const { data: allUsers = [], refetch: refetchUsers } = useAllUsers();
  const { data: allPlots = [] } = useLandPlots();
  const { data: notifications = [] } = useNotifications();

  const { data: activityLogs = [], refetch: refetchLogs } = useQuery({
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
          uniqueLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return uniqueLogs;
        }
      } catch (err) {
        console.warn("Failed to fetch logs from backend, falling back to localStorage:", err);
      }
      const localLogsJson = localStorage.getItem('terratrace_activity_logs');
      const localLogs = localLogsJson ? JSON.parse(localLogsJson) : [];
      localLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return localLogs;
    },
    staleTime: 5 * 1000,
  });

  // Reactive listener for log updates
  useEffect(() => {
    const handleNewLog = () => {
      refetchLogs();
    };
    window.addEventListener('new-activity-log', handleNewLog);
    return () => window.removeEventListener('new-activity-log', handleNewLog);
  }, [refetchLogs]);

  // ─── Derive filtered views from cached data ───────────────────────────────
  const officers = useMemo(() => allUsers.filter(u => u.role === "LRO" || u.role === "Notary"), [allUsers]);
  const statePlots = useMemo(() => allPlots.filter(p => p.landType === "00050"), [allPlots]);

  const lroCount    = officers.filter(o => o.role === "LRO").length;
  const notaryCount = officers.filter(o => o.role === "Notary").length;
  const totalUsers  = officers.length; 

  const stats = [
    { label: "Total LRO Officers",    value: lroCount,    icon: <Building className="w-5 h-5 text-blue-500" />,    change: "+2 this month" },
    { label: "Total Notary Officers", value: notaryCount, icon: <Gavel className="w-5 h-5 text-purple-500" />,     change: "+1 this month" },
    { label: "Total Users",           value: totalUsers,  icon: <Users className="w-5 h-5 text-emerald-500" />,    change: "+12%" },
    { label: "Log Activity",          value: 12, icon: <Activity className="w-5 h-5 text-blue-400" />, change: "Last 24h" },
  ];

  const filteredOfficers = useMemo(() => {
    const q = officerSearch.toLowerCase();
    return officers.filter(o => {
      const name = `${o.firstName || ""} ${o.lastName || ""}`.toLowerCase();
      const email = (o.email || "").toLowerCase();
      const matricule = (o.matricule || "").toLowerCase();
      const jurisdiction = (o.jurisdiction || "").toLowerCase();
      const role = (o.role || "").toLowerCase();

      return name.includes(q) || email.includes(q) || matricule.includes(q) || jurisdiction.includes(q) || role.includes(q);
    });
  }, [officerSearch, officers]);

  const openRegister = (type) => {
    setOfficerType(type);
    setIsRegisterOpen(true);
  };

  const handleNotifAction = async (id, action) => {
    try {
      if (action === 'read') {
        await api.patch(`/notifications/${id}/status`, { status: 'read' });
      } else if (action === 'delete') {
        await api.delete(`/notifications/${id}`);
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error("Failed to update notification");
    }
  };

  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);
  const [clearedNotifIds, setClearedNotifIds] = useState([]);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`cleared_admin_notifications_${user._id || user.id}`);
      setClearedNotifIds(saved ? JSON.parse(saved) : []);
    }
  }, [user]);

  const visibleNotifications = useMemo(() => {
    return notifications.filter(n => !clearedNotifIds.includes(n._id));
  }, [notifications, clearedNotifIds]);

  const executeClearAllNotif = () => {
    const idsToClear = visibleNotifications.map(n => n._id);
    const updated = [...new Set([...clearedNotifIds, ...idsToClear])];
    setClearedNotifIds(updated);
    if (user) {
      localStorage.setItem(`cleared_admin_notifications_${user._id || user.id}`, JSON.stringify(updated));
    }
    setClearAllConfirmOpen(false);
    toast.success("System notifications cleared from view (frontend only)");
  };

  const [clearedLogIds, setClearedLogIds] = useState([]);
  const [isClearLogsModalOpen, setIsClearLogsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const savedClearedLogs = localStorage.getItem(`cleared_logs_${user._id || user.id}`);
      setClearedLogIds(savedClearedLogs ? JSON.parse(savedClearedLogs) : []);
    }
  }, [user]);

  const visibleLogs = useMemo(() => {
    return activityLogs.filter(log => !clearedLogIds.includes(log._id || log.id));
  }, [activityLogs, clearedLogIds]);

  const handleClearAllLogs = () => {
    const idsToClear = visibleLogs.map(l => l._id || l.id);
    const updated = [...new Set([...clearedLogIds, ...idsToClear])];
    setClearedLogIds(updated);
    if (user) {
      localStorage.setItem(`cleared_logs_${user._id || user.id}`, JSON.stringify(updated));
    }
    setIsClearLogsModalOpen(false);
    toast.success("Activity logs cleared from frontend view!");
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Syne']">System Administration</h1>
          <p className="text-muted-foreground mt-1 text-lg">National Land Registry — Management Console</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => openRegister("lro")} className="bg-[var(--terra-navy)] hover:bg-blue-900 border-0 gap-2 h-11 px-6">
            <Building className="w-4 h-4" /> Add LRO
          </Button>
          <Button onClick={() => openRegister("notary")} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 border-0 gap-2 h-11 px-6">
            <Gavel className="w-4 h-4" /> Add Notary
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="hover:shadow-lg transition-all border-l-4 border-l-[var(--terra-emerald)]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-muted">{stat.icon}</div>
                  <Badge variant="secondary" className="text-[10px]">{stat.change}</Badge>
                </div>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* State Land Portfolio */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-['Syne']">State Land Portfolio</h2>
            <p className="text-muted-foreground text-sm">Public land plots currently owned by the Government of Cameroon</p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-400">{statePlots.length} Plots Managed</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {statePlots.map((plot) => (
            <motion.div key={plot._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="overflow-hidden group hover:shadow-xl transition-all border-border">
                <div className="relative h-40 overflow-hidden bg-muted">
                  <img 
                    src={plot.coverImage?.startsWith('http') ? plot.coverImage : `http://localhost:5001${plot.coverImage || '/assets/images/plots/default-plot.jpg'}`} 
                    alt={plot.landCode}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-[var(--terra-navy)] text-white border-0 text-[10px]">PUBLIC</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-xs font-mono font-bold text-muted-foreground truncate">{plot.landCode}</p>
                  <p className="font-bold text-sm mt-1 truncate">{plot.location}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">{plot.area}m²</span>
                    <Badge variant="outline" className="text-[9px] uppercase border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-700/50 dark:text-amber-400 dark:bg-amber-900/30">
                      {plot.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {statePlots.length === 0 && (
            <div className="col-span-full py-12 text-center bg-muted/30 rounded-2xl border-2 border-dashed">
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground font-medium">No state-owned plots found in the registry.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Officer Directory */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold font-['Syne']">Officer Directory</CardTitle>
              <CardDescription>Manage regional registry and notary officers</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search officers..."
                  className="pl-10 h-10 rounded-xl"
                  value={officerSearch}
                  onChange={(e) => setOfficerSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Officer</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Matricule</th>
                    <th className="px-4 py-3">Jurisdiction</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOfficers.map((officer) => (
                    <tr key={officer._id} className="hover:bg-accent/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--terra-navy)]/10 flex items-center justify-center font-bold text-[var(--terra-navy)] text-xs shrink-0">
                            {officer.firstName?.[0] || ""}{officer.lastName?.[0] || ""}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{officer.firstName || "Unknown"} {officer.lastName || ""}</p>
                            <p className="text-[10px] text-muted-foreground">{officer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[10px] uppercase ${officer.role === "Notary" ? "border-purple-300 text-purple-700 bg-purple-50 dark:border-purple-700/50 dark:text-purple-400 dark:bg-purple-900/30" : "border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-700/50 dark:text-blue-400 dark:bg-blue-900/30"}`}>
                          {officer.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{officer.matricule}</td>
                      <td className="px-4 py-3 text-xs font-medium">{officer.jurisdiction}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${officer.status === "active" ? "bg-emerald-500" : "bg-red-400"}`} />
                          <span className={`text-[10px] font-bold uppercase ${officer.status === "active" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {officer.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System Notifications & Logs */}
        <div className="space-y-6">
          <Card className="border-emerald-100 shadow-emerald-500/5 dark:border-emerald-900/40">
            <CardHeader className="pb-3 border-b border-emerald-50 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-xl font-bold font-['Syne'] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-600" />
                  System Notifications
                </CardTitle>
                <div className="flex items-center gap-2">
                  {visibleNotifications.filter(n => n.status === 'unread').length > 0 && (
                    <Badge className="bg-red-500 text-white animate-pulse">
                      {visibleNotifications.filter(n => n.status === 'unread').length} New
                    </Badge>
                  )}
                  {visibleNotifications.length > 0 && (
                    <Button 
                      variant="ghost" 
                      onClick={() => setClearAllConfirmOpen(true)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-[10px] uppercase tracking-wider font-bold h-7 px-2.5 rounded-lg"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50 max-h-[350px] overflow-y-auto custom-scrollbar">
                {visibleNotifications.length > 0 ? (
                  visibleNotifications.map((n) => (
                    <div key={n._id} className={cn(
                      "p-4 hover:bg-accent/30 transition-colors group relative",
                      n.status === 'unread' ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                    )}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 mt-1.5 rounded-full shrink-0",
                          n.status === 'unread' ? "bg-red-500 animate-pulse" : "bg-transparent"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground flex items-center gap-2">
                            {n.title}
                            {n.type === 'unblock_request' && <Badge variant="outline" className="text-[8px] bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50">UNBLOCK REQ</Badge>}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[9px] text-muted-foreground mt-1 uppercase font-medium tracking-wider">
                            {new Date(n.createdAt).toLocaleDateString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {n.status === 'unread' && (
                            <Button onClick={() => handleNotifAction(n._id, 'read')} variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button onClick={() => handleNotifAction(n._id, 'delete')} variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium">No system alerts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-muted">
              <CardTitle className="text-xl font-bold font-['Syne'] flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-[var(--terra-emerald)]" />
                Log Activity
              </CardTitle>
              {visibleLogs.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsClearLogsModalOpen(true)}
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20 text-xs font-bold h-9 px-3"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {visibleLogs.length > 0 ? (
                  <>
                    {(showAllLogs ? visibleLogs : visibleLogs.slice(0, 8)).map((log) => {
                      const logTime = log.timestamp 
                        ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : (log.time?.split(" ")[1] || "");
                      return (
                        <div key={log.id || log._id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-2">
                          <div className={cn(
                            "w-1 rounded-full shrink-0 h-12",
                            log.success || log.status === "success" ? "bg-emerald-500" : "bg-red-400"
                          )} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate text-foreground">{log.description || log.action}</p>
                            <p className="text-[10px] text-muted-foreground">{log.userName || log.user} · {log.userRole || log.role}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{log.ip} · {logTime}</p>
                          </div>
                        </div>
                      );
                    })}
                    {visibleLogs.length > 8 && (
                      <Button 
                        variant="outline" 
                        className="w-full text-xs font-bold uppercase tracking-widest gap-2"
                        onClick={() => setShowAllLogs(!showAllLogs)}
                      >
                        {showAllLogs ? "View Less" : "View More"} <ArrowUpRight className={`w-3 h-3 transition-transform ${showAllLogs ? "rotate-180" : ""}`} />
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium">No activity logs recorded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RegisterOfficerModal
        open={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          refetchUsers();
        }}
        officerType={officerType}
      />

      {/* CLEAR ALL NOTIFICATIONS CONFIRMATION DIALOG */}
      <Dialog open={clearAllConfirmOpen} onOpenChange={setClearAllConfirmOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
          <div className="bg-red-500 p-6 flex flex-col items-center text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold font-['Syne']">Clear Alerts Registry</DialogTitle>
            <DialogDescription className="text-white/80 mt-1">This will hide all system alerts from this view.</DialogDescription>
          </div>
          <div className="p-8">
            <p className="text-center text-gray-600 dark:text-gray-300 font-medium">
              Are you sure you want to clear all system alerts from your view?
            </p>
            <p className="text-center text-xs text-muted-foreground mt-2 px-4 dark:text-gray-400">
              This is a frontend-only action. System notifications and alerts will remain in the backend database and will be hidden from view on this device only.
            </p>
          </div>
          <DialogFooter className="p-6 bg-muted/30 border-t flex gap-3">
            <Button variant="ghost" onClick={() => setClearAllConfirmOpen(false)} className="flex-1 rounded-xl h-11">No, Keep Alerts</Button>
            <Button onClick={executeClearAllNotif} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 font-bold shadow-lg shadow-red-500/20">
              Yes, Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* CLEAR ALL LOGS CONFIRMATION MODAL */}
      <Dialog open={isClearLogsModalOpen} onOpenChange={setIsClearLogsModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-['Syne'] text-red-700 dark:text-red-500">Clear Activity Logs</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Are you sure you want to clear all currently listed activity logs from your view?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 text-xs text-red-700 dark:text-red-400 rounded-xl leading-relaxed">
                <strong>Warning:</strong> This action will only remove the logs from this frontend view. It will <strong>NOT</strong> delete any audit records or security logs from the backend database.
             </div>
          </div>
          <DialogFooter className="gap-2">
             <Button variant="ghost" onClick={() => setIsClearLogsModalOpen(false)} className="rounded-xl h-11 dark:text-white dark:hover:bg-white/10">Cancel</Button>
             <Button 
               onClick={handleClearAllLogs}
               className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold h-11 px-6"
             >
                Confirm Clear
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
