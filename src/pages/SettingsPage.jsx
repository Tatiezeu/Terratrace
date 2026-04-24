import { useState } from "react";
import {
  ShieldAlert, Mail, Users, History, Lock, CircleAlert,
  Smartphone, Database, Activity, ScrollText, Ban, Trash2,
  CheckCircle2, UserCheck, UserX, X, AlertTriangle, Edit, Download, User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../app/components/ui/tabs";
import { Label } from "../app/components/ui/label";
import { Switch } from "../app/components/ui/switch";
import { Badge } from "../app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../app/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "../app/components/ui/dialog";
import { mockSystemAccounts, mockActivityLogs } from "../data/mockData";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function SettingsPage() {
  const [loginAttempts, setLoginAttempts] = useState("5");
  const [lockDuration, setLockDuration] = useState("30");
  const [noticeDurationDays, setNoticeDurationDays] = useState(30);
  const [noticeTestMode, setNoticeTestMode] = useState(false);
  const [noticeTestMinutes, setNoticeTestMinutes] = useState(10);
  const [accounts, setAccounts] = useState(mockSystemAccounts);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // Stores account to delete
  const [editAccount, setEditAccount] = useState(null); // Stores account to edit
  const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "" });

  // System stats derived from accounts
  const activeCount    = accounts.filter(a => a.status === "active").length;
  const suspendedCount = accounts.filter(a => a.status === "suspended").length;
  const totalCount     = accounts.length;

  const systemStats = [
    { label: "System Nodes",       value: "4",           icon: <Database className="w-5 h-5 text-purple-500" />,  color: "bg-purple-50" },
    { label: "Active Accounts",    value: activeCount,    icon: <UserCheck className="w-5 h-5 text-emerald-500" />, color: "bg-emerald-50" },
    { label: "Suspended Accounts", value: suspendedCount, icon: <UserX className="w-5 h-5 text-red-400" />,        color: "bg-red-50" },
    { label: "User Logs",          value: mockActivityLogs.length, icon: <ScrollText className="w-5 h-5 text-blue-500" />, color: "bg-blue-50" },
  ];

  const toggleSuspend = (id) => {
    setAccounts(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next = a.status === "active" ? "suspended" : "active";
      toast.success(`Account ${next === "suspended" ? "suspended" : "reactivated"}`, {
        description: `${a.name}'s account is now ${next}.`,
      });
      return { ...a, status: next };
    }));
  };

  const confirmDelete = (acc) => {
    setDeleteConfirm(acc);
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;
    setAccounts(prev => prev.filter(a => a.id !== deleteConfirm.id));
    toast.success("Account deleted successfully", { 
      description: `${deleteConfirm.name}'s account has been permanently removed from the system.` 
    });
    setDeleteConfirm(null);
  };

  const toggleTFA = (id) => {
    setAccounts(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next = !a.tfa;
      toast.success(`2FA ${next ? "enabled" : "disabled"}`, { 
        description: `${a.name}'s two-factor authentication is now ${next ? "on" : "off"}.` 
      });
      return { ...a, tfa: next };
    }));
  };

  const handleEditClick = (acc) => {
    setEditAccount(acc);
    setEditFormData({ name: acc.name, email: acc.email, role: acc.role });
  };

  const handleEditSave = () => {
    setAccounts(prev => prev.map(a => a.id === editAccount.id ? { ...a, ...editFormData } : a));
    toast.success("Account updated", { description: `${editFormData.name}'s information has been saved.` });
    setEditAccount(null);
  };

  const handleExportPDF = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Generating PDF Registry...',
        success: 'PDF Registry exported successfully!',
        error: 'Failed to export registry.',
      }
    );
  };

  return (
    <div className="space-y-8 pb-12 overflow-y-auto h-full pr-6 dark:bg-[#002147] dark:text-gray-100 p-6 transition-colors">
      <div className="border-b border-white/10 pb-8">
        <h1 className="text-3xl font-bold font-['Syne'] text-[#002147] dark:text-[var(--terra-emerald)]">System Settings</h1>
        <p className="text-muted-foreground mt-1 dark:text-gray-400 italic">Configure global security policies and manage system accounts.</p>
      </div>

      {/* System Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {systemStats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden bg-white/60 dark:bg-white/5 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3 shadow-inner`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-black tracking-tight text-[#002147]">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="login-attempts" className="w-full space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl h-auto flex flex-wrap lg:grid lg:grid-cols-5 gap-1">
          <TabsTrigger value="login-attempts" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ShieldAlert className="w-4 h-4 mr-2" /> Login Attempts
          </TabsTrigger>
          <TabsTrigger value="2fa" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Smartphone className="w-4 h-4 mr-2" /> Two-Step Auth
          </TabsTrigger>
          <TabsTrigger value="accounts" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="w-4 h-4 mr-2" /> Accounts
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <History className="w-4 h-4 mr-2" /> Login Activity
          </TabsTrigger>
          <TabsTrigger value="publish-notice" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CircleAlert className="w-4 h-4 mr-2" /> Publish Notice
          </TabsTrigger>
        </TabsList>

        {/* Login Attempts */}
        <TabsContent value="login-attempts">
          <Card className="border-none shadow-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="font-['Syne']">Security Policies</CardTitle>
              <CardDescription>Define rules for failed login attempts to prevent brute-force attacks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                    <div className="flex items-center gap-3">
                      <Input id="maxAttempts" type="number" value={loginAttempts} onChange={(e) => setLoginAttempts(e.target.value)} className="w-24 bg-white rounded-xl" />
                      <span className="text-sm text-muted-foreground">attempts before locking</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lockDuration">Lockout Duration</Label>
                    <div className="flex items-center gap-3">
                      <Input id="lockDuration" type="number" value={lockDuration} onChange={(e) => setLockDuration(e.target.value)} className="w-24 bg-white rounded-xl" />
                      <span className="text-sm text-muted-foreground">minutes of account suspension</span>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex gap-4">
                  <CircleAlert className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <p className="font-bold text-amber-900 leading-none">Important Security Note</p>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Setting these values too low may result in accidental lockouts for legitimate users. We recommend 5 attempts and 30 minutes.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={() => toast.success("Security policies updated!")} className="bg-[var(--terra-navy)] text-white hover:bg-[#003d7a] px-8 rounded-xl h-11">Update Policies</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2FA */}
        <TabsContent value="2fa">
          <Card className="border-none shadow-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="font-['Syne']">2FA Global Configuration</CardTitle>
              <CardDescription>Configure the email server and templates for two-step authentication.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="authEmail">Sender Email Address</Label>
                  <Input id="authEmail" type="email" placeholder="security@terratrace.cm" className="bg-white rounded-xl h-11" />
                  <p className="text-[10px] text-muted-foreground">This email will be used to send authentication codes.</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex gap-3">
                    <Mail className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-emerald-900 leading-none">Email Service Status</p>
                      <p className="text-xs text-emerald-700 mt-1">Operational — Connection verified</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500 text-white border-none uppercase text-[10px] font-black">Active</Badge>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={() => toast.success("2FA configuration saved!")} className="bg-[var(--terra-navy)] text-white hover:bg-[#003d7a] px-8 rounded-xl h-11">Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts */}
        <TabsContent value="accounts">
          <Card className="border-none shadow-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white/30">
              <div>
                <CardTitle className="font-['Syne']">User Accounts</CardTitle>
                <CardDescription>
                  {activeCount} active · {suspendedCount} suspended · {totalCount} total
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-lg h-9 font-bold text-xs gap-2"
                onClick={handleExportPDF}
              >
                <Download className="w-3.5 h-3.5" /> Export PDF Registry
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-5 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Role</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last Login</th>
                      <th className="px-5 py-4 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">2FA</th>
                      <th className="px-5 py-4 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {accounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-white/40 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 border-2 border-white shadow-sm ring-1 ring-border/50">
                              <AvatarImage src={acc.avatar} />
                              <AvatarFallback className="text-xs">{acc.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-[#002147]">{acc.name}</p>
                              <p className="text-[10px] text-muted-foreground">{acc.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-black px-2 py-0.5 bg-gray-100 rounded-lg text-gray-700 uppercase tracking-tighter">{acc.role}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={acc.status === "active"
                            ? "bg-emerald-100 text-emerald-700 border-0 text-[9px] uppercase font-bold rounded-lg"
                            : "bg-red-100 text-red-600 border-0 text-[9px] uppercase font-bold rounded-lg"
                          }>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${acc.status === "active" ? "bg-emerald-500" : "bg-red-400"}`} />
                            {acc.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-[11px] text-muted-foreground font-mono">{acc.lastLogin}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={acc.tfa}
                              onCheckedChange={() => toggleTFA(acc.id)}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(acc)}
                              className="p-2 rounded-xl text-blue-500 bg-blue-50 hover:bg-blue-100 transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleSuspend(acc.id)}
                              className={`p-2 rounded-xl transition-all ${
                                acc.status === "active"
                                  ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                                  : "text-emerald-500 bg-emerald-50 hover:bg-emerald-100"
                              }`}
                            >
                              {acc.status === "active" ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => confirmDelete(acc)}
                              className="p-2 rounded-xl text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login Activity */}
        <TabsContent value="activity">
          <Card className="border-none shadow-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="font-['Syne']">Access Log</CardTitle>
              <CardDescription>Detailed history of all system access events and sessions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-5 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">User</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Role</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Action</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Time</th>
                      <th className="px-5 py-4 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {mockActivityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/40 transition-colors">
                        <td className="px-5 py-3 font-bold text-sm text-[#002147]">{log.user}</td>
                        <td className="px-5 py-3 text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{log.role}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-lg ${
                            log.status === "failed"  ? "bg-red-50 text-red-600"    :
                            log.status === "warning" ? "bg-amber-50 text-amber-600" :
                            "bg-emerald-50 text-emerald-600"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{log.time}</td>
                        <td className="px-5 py-3 text-right text-xs font-mono text-[#002147] font-bold">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Publish Notice */}
        <TabsContent value="publish-notice">
          <Card className="border-none shadow-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="font-['Syne']">Public Notice Duration</CardTitle>
              <CardDescription>
                Configure how long a land transfer public notice remains active. Default is 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 max-w-2xl pb-10">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-amber-200 bg-amber-50/50">
                <div className="space-y-1">
                  <p className="font-bold text-amber-900 text-sm">Testing Mode</p>
                  <p className="text-xs text-amber-700">Override the notice duration with a short time for demo/testing purposes.</p>
                </div>
                <div
                  onClick={() => setNoticeTestMode(!noticeTestMode)}
                  className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${noticeTestMode ? "bg-amber-500" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${noticeTestMode ? "translate-x-6" : ""}`} />
                </div>
              </div>

              {!noticeTestMode ? (
                <div className="space-y-6">
                  <Label className="text-sm font-bold text-[#002147]">
                    Production Duration: <span className="text-[var(--terra-emerald)] font-black text-lg">{noticeDurationDays} DAYS</span>
                  </Label>
                  <div className="space-y-3">
                    <input type="range" min={7} max={90} step={1} value={noticeDurationDays}
                      onChange={(e) => setNoticeDurationDays(Number(e.target.value))}
                      className="w-full appearance-none h-2 bg-muted rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--terra-navy)] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="relative h-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="absolute left-0">7 days</span>
                      <span className="absolute left-[27.7%] -translate-x-1/2 text-[var(--terra-emerald)]">30 days (default)</span>
                      <span className="absolute right-0">90 days</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground bg-white/50 border rounded-xl p-4 leading-relaxed">
                    The Cameroon Land Registration Act (Article 17) mandates a minimum public notice period of 30 days.
                  </p>
                  <Button onClick={() => toast.success("Notice duration saved!")} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white rounded-xl h-11 px-8 font-bold">
                    Update Production Policy
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-amber-100/50 border border-amber-300 rounded-2xl p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed italic">Notice duration is overridden for testing. This allows for rapid iteration of the 30-day notice period in a demo environment.</p>
                  </div>
                  <Label className="text-sm font-bold text-amber-700">
                    Test Duration: <span className="font-black text-lg">{noticeTestMinutes} MINUTES</span>
                  </Label>
                  <div className="space-y-3">
                    <input type="range" min={1} max={30} step={1} value={noticeTestMinutes}
                      onChange={(e) => setNoticeTestMinutes(Number(e.target.value))}
                      className="w-full appearance-none h-2 bg-muted rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:shadow-xl"
                    />
                    <div className="relative h-4 text-[10px] font-bold text-amber-600/60 uppercase tracking-widest">
                      <span className="absolute left-0">1 min</span>
                      <span className="absolute left-[31.0%] -translate-x-1/2 text-amber-600">10 min (default)</span>
                      <span className="absolute right-0">30 min</span>
                    </div>
                  </div>
                  <Button onClick={() => toast.success("Test duration applied!")} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-11 px-8 font-bold">
                    Apply Test Duration
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-red-500 p-6 flex flex-col items-center text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold font-['Syne']">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-white/80 mt-1">This action is permanent and cannot be undone.</DialogDescription>
          </div>
          <div className="p-8">
            <p className="text-center text-gray-600 font-medium">
              Are you sure you want to delete <span className="font-bold text-[#002147]">{deleteConfirm?.name}'s</span> account?
            </p>
            <p className="text-center text-xs text-muted-foreground mt-2 px-4">
              All associated records will be archived, but the account will no longer be able to access the TerraTrace portal.
            </p>
          </div>
          <DialogFooter className="p-6 bg-muted/30 border-t flex gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl h-11">No, Keep Account</Button>
            <Button onClick={executeDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 font-bold shadow-lg shadow-red-500/20">
              Yes, Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT ACCOUNT DIALOG */}
      <Dialog open={!!editAccount} onOpenChange={() => setEditAccount(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Syne'] text-xl flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--terra-emerald)]" />
              Edit Account Info
            </DialogTitle>
            <DialogDescription>Update system user information and role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Full Name</Label>
              <Input 
                id="editName" 
                value={editFormData.name} 
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} 
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email Address</Label>
              <Input 
                id="editEmail" 
                type="email" 
                value={editFormData.email} 
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} 
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">System Role</Label>
              <select 
                id="editRole"
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--terra-emerald)] transition-all bg-white text-sm"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Notary">Notary</option>
                <option value="LRO">LRO</option>
                <option value="Landowner">Landowner</option>
                <option value="Client">Client</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditAccount(null)} className="rounded-xl h-11">Cancel</Button>
            <Button onClick={handleEditSave} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white rounded-xl h-11 px-8">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
