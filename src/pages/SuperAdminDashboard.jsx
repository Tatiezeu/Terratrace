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
import { mockOfficers, mockActivityLogs } from "../data/mockData";
import { motion } from "motion/react";
import { toast } from "sonner";

export default function SuperAdminDashboard() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [officerType, setOfficerType] = useState("lro");
  const [officerSearch, setOfficerSearch] = useState("");
  const [showAllLogs, setShowAllLogs] = useState(false);

  const lroCount    = mockOfficers.filter(o => o.role === "LRO").length;
  const notaryCount = mockOfficers.filter(o => o.role === "Notary").length;
  const totalUsers  = 248;

  const stats = [
    { label: "Total LRO Officers",    value: lroCount,    icon: <Building className="w-5 h-5 text-blue-500" />,    change: "+2 this month" },
    { label: "Total Notary Officers", value: notaryCount, icon: <Gavel className="w-5 h-5 text-purple-500" />,     change: "+1 this month" },
    { label: "Total Users",           value: totalUsers,  icon: <Users className="w-5 h-5 text-emerald-500" />,    change: "+12%" },
    { label: "Log Activity",          value: mockActivityLogs.length, icon: <Activity className="w-5 h-5 text-blue-400" />, change: "Last 24h" },
  ];

  const filteredOfficers = useMemo(() => {
    const q = officerSearch.toLowerCase();
    if (!q) return mockOfficers;
    return mockOfficers.filter(o =>
      o.name.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.matricule.toLowerCase().includes(q) ||
      o.jurisdiction.toLowerCase().includes(q) ||
      o.role.toLowerCase().includes(q)
    );
  }, [officerSearch]);

  const openRegister = (type) => {
    setOfficerType(type);
    setIsRegisterOpen(true);
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
              {officerSearch && (
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setOfficerSearch("")}>
                  <X className="w-4 h-4" />
                </Button>
              )}
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
                    <tr key={officer.id} className="hover:bg-accent/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--terra-navy)]/10 flex items-center justify-center font-bold text-[var(--terra-navy)] text-xs shrink-0">
                            {officer.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{officer.name}</p>
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
                  {filteredOfficers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        No officers match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Log Activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold font-['Syne'] flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-[var(--terra-emerald)]" />
                Log Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(showAllLogs ? mockActivityLogs : mockActivityLogs.slice(0, 6)).map((log) => (
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
                  {showAllLogs ? "View Less Logs" : "View Full Logs"} <ArrowUpRight className={`w-3 h-3 transition-transform ${showAllLogs ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-blue-700 text-white relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 opacity-20 rotate-12">
              <ShieldAlert className="w-32 h-32" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg font-bold font-['Syne']">Security Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/70">Health Score</span>
                <span className="text-sm font-bold">99.8%</span>
              </div>
              <div className="w-full bg-white/20 h-1 rounded-full mb-6">
                <div className="bg-emerald-400 h-full w-[99.8%] rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/10 text-center">
                  <p className="text-xl font-bold">0</p>
                  <p className="text-[10px] text-white/60">Breaches</p>
                </div>
                <div className="p-3 rounded-xl bg-white/10 text-center">
                  <p className="text-xl font-bold">12K</p>
                  <p className="text-[10px] text-white/60">Requests/h</p>
                </div>
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
