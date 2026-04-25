import { useState, useMemo } from "react";
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
import { useEffect } from "react";
import api from "../utils/api";
import { cn } from "../app/components/ui/utils";
import { mockActivityLogs } from "../data/mockData";

export default function SuperAdminDashboard() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [officerType, setOfficerType] = useState("lro");
  const [officerSearch, setOfficerSearch] = useState("");
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [statePlots, setStatePlots] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [officersRes, plotsRes, notifRes] = await Promise.all([
        api.get('/users'),
        api.get('/land'),
        api.get('/notifications')
      ]);

      if (officersRes.data.success) {
        const filtered = officersRes.data.data.filter(u => u.role === "LRO" || u.role === "Notary");
        setOfficers(filtered);
      }

      if (plotsRes.data.success) {
        const stateOwned = plotsRes.data.data.filter(p => p.landType === "00050");
        setStatePlots(stateOwned);
      }

      if (notifRes.data.success) {
        setNotifications(notifRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.refreshOfficerList = fetchData;
    return () => delete window.refreshOfficerList;
  }, []);

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
      fetchData();
    } catch (err) {
      toast.error("Failed to update notification");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--terra-emerald)]"></div>
      </div>
    );
  }

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
          <Badge className="bg-amber-100 text-amber-700 border-0">{statePlots.length} Plots Managed</Badge>
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
                    <Badge variant="outline" className="text-[9px] uppercase border-amber-200 text-amber-700 bg-amber-50">
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
                        <Badge variant="outline" className={`text-[10px] uppercase ${officer.role === "Notary" ? "border-purple-300 text-purple-700 bg-purple-50" : "border-blue-300 text-blue-700 bg-blue-50"}`}>
                          {officer.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{officer.matricule}</td>
                      <td className="px-4 py-3 text-xs font-medium">{officer.jurisdiction}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${officer.status === "active" ? "bg-emerald-500" : "bg-red-400"}`} />
                          <span className={`text-[10px] font-bold uppercase ${officer.status === "active" ? "text-emerald-700" : "text-red-600"}`}>
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
          <Card className="border-emerald-100 shadow-emerald-500/5">
            <CardHeader className="pb-3 border-b border-emerald-50 bg-emerald-50/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold font-['Syne'] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-600" />
                  System Notifications
                </CardTitle>
                {notifications.filter(n => n.status === 'unread').length > 0 && (
                  <Badge className="bg-red-500 text-white animate-pulse">
                    {notifications.filter(n => n.status === 'unread').length} New
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50 max-h-[350px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n._id} className={cn(
                      "p-4 hover:bg-accent/30 transition-colors group relative",
                      n.status === 'unread' ? "bg-emerald-50/40" : ""
                    )}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 mt-1.5 rounded-full shrink-0",
                          n.status === 'unread' ? "bg-red-500 animate-pulse" : "bg-transparent"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground flex items-center gap-2">
                            {n.title}
                            {n.type === 'unblock_request' && <Badge variant="outline" className="text-[8px] bg-red-50 text-red-600 border-red-200">UNBLOCK REQ</Badge>}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[9px] text-muted-foreground mt-1 uppercase font-medium tracking-wider">
                            {new Date(n.createdAt).toLocaleDateString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {n.status === 'unread' && (
                            <Button onClick={() => handleNotifAction(n._id, 'read')} variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button onClick={() => handleNotifAction(n._id, 'delete')} variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50">
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
            <CardHeader>
              <CardTitle className="text-xl font-bold font-['Syne'] flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-[var(--terra-emerald)]" />
                Log Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(showAllLogs ? mockActivityLogs : mockActivityLogs.slice(0, 4)).map((log) => (
                  <div key={log.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-2">
                    <div className={`w-1 rounded-full shrink-0 h-12 ${log.status === "success" ? "bg-emerald-500" : log.status === "failed" ? "bg-red-400" : "bg-amber-400"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{log.action}</p>
                      <p className="text-[10px] text-muted-foreground">{log.user} · {log.role}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{log.ip} · {log.time.split(" ")[1]}</p>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full text-xs font-bold uppercase tracking-widest gap-2"
                  onClick={() => setShowAllLogs(!showAllLogs)}
                >
                  {showAllLogs ? "View Less" : "View More"} <ArrowUpRight className={`w-3 h-3 transition-transform ${showAllLogs ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RegisterOfficerModal
        open={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        officerType={officerType}
      />
    </div>
  );
}
