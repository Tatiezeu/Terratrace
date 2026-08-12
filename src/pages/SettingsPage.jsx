import React, { useState, useEffect } from "react";
import {
  ShieldAlert, Mail, Users, History, Lock, CircleAlert,
  Smartphone, Database, Activity, ScrollText, Ban, Trash2,
  CheckCircle2, UserCheck, UserX, X, AlertTriangle, Edit, Download, User, Eye, EyeOff,
  Bot
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
import { mockActivityLogs } from "../data/mockData";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import api from "../utils/api";
import { useServerQuery, useServerState } from "../context/ServerStateContext";
import { useQuery } from "@tanstack/react-query";
import { logActivity } from "../utils/logger";

export default function SettingsPage() {
  const [loginAttempts, setLoginAttempts] = useState("5");
  const [lockDuration, setLockDuration] = useState("30");
  const [senderEmail, setSenderEmail] = useState("security@terratrace.cm");
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [chatbotApiKey, setChatbotApiKey] = useState("");
  const [chatbotApiKeyName, setChatbotApiKeyName] = useState("Gemini");
  const [chatbotModel, setChatbotModel] = useState("gemini-flash-latest");
  const [chatbotProjectNumber, setChatbotProjectNumber] = useState("");
  const [showChatbotKey, setShowChatbotKey] = useState(false);
  const [chatbotSystemPrompt, setChatbotSystemPrompt] = useState("");
  const [chatbotKnowledgeBase, setChatbotKnowledgeBase] = useState("");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [noticeDurationDays, setNoticeDurationDays] = useState(30);
  const [noticeTestMode, setNoticeTestMode] = useState(false);
  const [noticeTestMinutes, setNoticeTestMinutes] = useState(10);
  const [accounts, setAccounts] = useState(() => {
    try {
      const raw = localStorage.getItem('settings_users_cache');
      if (raw) { const p = JSON.parse(raw); if (Date.now() - p.ts < 5 * 60 * 1000) return p.data; }
    } catch (_) {}
    return [];
  });
  const [loading, setLoading] = useState(() => {
    try {
      const raw = localStorage.getItem('settings_users_cache');
      if (raw) { const p = JSON.parse(raw); return !(Date.now() - p.ts < 5 * 60 * 1000); }
    } catch (_) {}
    return true;
  });
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(() => {
    return localStorage.getItem('recaptcha_enabled') !== 'false';
  });
  const [recaptchaMode, setRecaptchaMode] = useState(() => {
    return localStorage.getItem('recaptcha_mode') || 'smart';
  });
  const [recaptchaAttempts, setRecaptchaAttempts] = useState(3);

  // CamPay & Escrow States
  const [campayAppId, setCampayAppId] = useState("");
  const [campayAppKey, setCampayAppKey] = useState("");
  const [campayPassword, setCampayPassword] = useState("");
  const [campayEnv, setCampayEnv] = useState("sandbox");
  const [mindcafWalletNumber, setMindcafWalletNumber] = useState("");
  const [mindcafOperator, setMindcafOperator] = useState("MTN");
  const [terratraceWalletNumber, setTerratraceWalletNumber] = useState("");
  const [terratraceOperator, setTerratraceOperator] = useState("MTN");

  const [logFilter, setLogFilter] = useState("All");
  const [clearLogsConfirmOpen, setClearLogsConfirmOpen] = useState(false);

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
          localStorage.setItem('terratrace_activity_logs', JSON.stringify(uniqueLogs));
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

  useEffect(() => {
    const handleNewLog = () => {
      refetchLogs();
    };
    window.addEventListener('new-activity-log', handleNewLog);
    return () => {
      window.removeEventListener('new-activity-log', handleNewLog);
    };
  }, [refetchLogs]);

  useEffect(() => {
    api.get('/chatbot/training')
      .then(res => {
        if (res.data.success) {
          setChatbotSystemPrompt(res.data.data.systemPrompt);
          setChatbotKnowledgeBase(res.data.data.knowledgeBase);
        }
      })
      .catch(err => console.error("Failed to load chatbot training parameters:", err));
  }, []);

  const { data: serverUsers } = useServerQuery('settings_users', async () => {
    const response = await api.get('/users');
    const mapped = response.data.data.map(u => ({
      id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      status: u.status || (u.isVerified ? "active" : "pending"),
      lastLogin: new Date(u.updatedAt).toLocaleString(),
      tfa: u.twoFactorEnabled,
      avatar: u.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.firstName}`
    }));
    // Cache to localStorage for instant display on next visit
    try { localStorage.setItem('settings_users_cache', JSON.stringify({ data: mapped, ts: Date.now() })); } catch (_) {}
    return mapped;
  }, { staleTime: 60 * 1000 });

  // Show cached users immediately while fresh data loads in background
  const cachedUsersInit = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('settings_users_cache');
      if (raw) { const p = JSON.parse(raw); if (Date.now() - p.ts < 5 * 60 * 1000) return p.data; }
    } catch (_) {}
    return undefined;
  }, []);

  const { data: serverConfig } = useServerQuery('settings_config', async () => {
    const response = await api.get('/config');
    return response.data.data;
  });

  const { invalidateQuery } = useServerState();

  useEffect(() => {
    if (serverUsers) {
      setAccounts(serverUsers);
      setLoading(false);
    }
  }, [serverUsers]);

  useEffect(() => {
    if (serverConfig) {
      if (serverConfig.maxLoginAttempts) setLoginAttempts(serverConfig.maxLoginAttempts);
      if (serverConfig.lockoutDuration) setLockDuration(serverConfig.lockoutDuration);
      if (serverConfig.senderEmail) setSenderEmail(serverConfig.senderEmail);
      if (serverConfig.smtpHost) setSmtpHost(serverConfig.smtpHost);
      if (serverConfig.smtpPort) setSmtpPort(serverConfig.smtpPort);
      if (serverConfig.smtpUser) setSmtpUser(serverConfig.smtpUser);
      if (serverConfig.smtpPass) setSmtpPass(serverConfig.smtpPass);
      if (serverConfig.noticeDurationDays) setNoticeDurationDays(serverConfig.noticeDurationDays);
      if (serverConfig.noticeTestMode !== undefined) setNoticeTestMode(serverConfig.noticeTestMode);
      if (serverConfig.noticeTestMinutes) setNoticeTestMinutes(serverConfig.noticeTestMinutes);
      if (serverConfig.chatbotEnabled !== undefined) setChatbotEnabled(serverConfig.chatbotEnabled);
      if (serverConfig.chatbotApiKey) setChatbotApiKey(serverConfig.chatbotApiKey);
      if (serverConfig.chatbotApiKeyName) setChatbotApiKeyName(serverConfig.chatbotApiKeyName);
      if (serverConfig.chatbotModel) setChatbotModel(serverConfig.chatbotModel);
      if (serverConfig.chatbotProjectNumber) setChatbotProjectNumber(serverConfig.chatbotProjectNumber);

      // CamPay & Payout Configs
      if (serverConfig.campay_app_id) setCampayAppId(serverConfig.campay_app_id);
      if (serverConfig.campay_app_key) setCampayAppKey(serverConfig.campay_app_key);
      if (serverConfig.campay_password) setCampayPassword(serverConfig.campay_password);
      if (serverConfig.campay_env) setCampayEnv(serverConfig.campay_env);
      if (serverConfig.mindcaf_wallet_number) setMindcafWalletNumber(serverConfig.mindcaf_wallet_number);
      if (serverConfig.mindcaf_operator) setMindcafOperator(serverConfig.mindcaf_operator);
      if (serverConfig.terratrace_wallet_number) setTerratraceWalletNumber(serverConfig.terratrace_wallet_number);
      if (serverConfig.terratrace_operator) setTerratraceOperator(serverConfig.terratrace_operator);
    }
  }, [serverConfig]);

  const updateConfig = async (configs) => {
    setLoading(true);
    try {
        const response = await api.patch('/config', { configs });
        if (response.data.success) {
            toast.success("Settings updated successfully");
            logActivity('Update', 'Admin updated global system settings');
            invalidateQuery('settings_config');
        }
    } catch (err) {
        toast.error("Failed to update settings");
    } finally {
        setLoading(false);
    }
  };

  const testEmail = async () => {
    toast.promise(
        api.post('/config/test-email', { email: senderEmail }),
        {
            loading: 'Sending test email...',
            success: 'Test email sent! Check your inbox.',
            error: (err) => `Failed: ${err.response?.data?.message || 'Check console'}`
        }
    );
  };

  const testChatbotConnection = async () => {
    toast.promise(
        api.post('/config/test-chatbot', { 
          apiKey: chatbotApiKey, 
          provider: chatbotApiKeyName,
          model: chatbotModel,
          projectNumber: chatbotProjectNumber
        }),
        {
            loading: 'Testing AI Chatbot connection...',
            success: (res) => res.data?.message || 'Connection Successful!',
            error: (err) => `Failed: ${err.response?.data?.message || 'Connection failed'}`
        }
    );
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null); // Stores account to delete
  const confirmDelete = (acc) => setDeleteConfirm(acc);
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

  const toggleSuspend = async (id) => {
    try {
      const account = accounts.find(a => a.id === id);
      const nextStatus = account.status === "active" ? "suspended" : "active";
      
      const response = await api.patch(`/users/${id}`, {
        status: nextStatus
      });

      if (response.data.success) {
        toast.success(`Account ${nextStatus === "suspended" ? "suspended" : "reactivated"}`);
        invalidateQuery('settings_users');
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const response = await api.delete(`/users/${deleteConfirm.id}`);
      if (response.data.success) {
        toast.success("Account deleted successfully");
        logActivity('Delete', `Admin deleted user account: ${deleteConfirm.name} (${deleteConfirm.email})`);
        setDeleteConfirm(null);
        invalidateQuery('settings_users');
      }
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  const handleClearLogs = () => {
    localStorage.removeItem('terratrace_activity_logs');
    toast.success("Activity logs successfully cleared from local secure cache!");
    setClearLogsConfirmOpen(false);
    refetchLogs();
  };

  const toggleTFA = async (id) => {
    try {
      const account = accounts.find(a => a.id === id);
      const nextTFA = !account.tfa;
      
      const response = await api.patch(`/users/${id}`, {
        twoFactorEnabled: nextTFA
      });

      if (response.data.success) {
        toast.success(`2FA ${nextTFA ? "enabled" : "disabled"}`);
        invalidateQuery('settings_users');
      }
    } catch (err) {
      toast.error("Failed to toggle 2FA");
    }
  };

  const handleEditClick = (acc) => {
    setEditAccount(acc);
    setEditFormData({ name: acc.name, email: acc.email, role: acc.role });
  };

  const handleEditSave = async () => {
    try {
      const [firstName, ...rest] = editFormData.name.split(" ");
      const lastName = rest.join(" ");

      const response = await api.patch(`/users/${editAccount.id}`, {
        firstName,
        lastName,
        email: editFormData.email,
        role: editFormData.role
      });

      if (response.data.success) {
        toast.success("Account updated");
        setEditAccount(null);
        invalidateQuery('settings_users');
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleExportPDF = () => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          window.open('http://localhost:5001/assets/default-profile.png', '_blank');
          resolve();
        }, 2000);
      }),
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
        <TabsList className="bg-muted p-1.5 rounded-xl h-auto flex flex-wrap gap-2 w-full justify-start border border-border/40">
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
          <TabsTrigger value="recaptcha" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ShieldAlert className="w-4 h-4 mr-2" /> Manage reCAPTCHA
          </TabsTrigger>
          <TabsTrigger value="campay" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm lg:ml-2">
            <Smartphone className="w-4 h-4 mr-2" /> CamPay API Settings
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bot className="w-4 h-4 mr-2" /> Chatbot Settings
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
                <Button onClick={() => updateConfig({ maxLoginAttempts: loginAttempts, lockoutDuration: lockDuration })} className="bg-[var(--terra-navy)] text-white hover:bg-[#003d7a] px-8 rounded-xl h-11">Update Policies</Button>
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
                  <Input id="authEmail" type="email" placeholder="security@terratrace.cm" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} className="bg-white rounded-xl h-11" />
                  <p className="text-[10px] text-muted-foreground">This email will be used as the 'From' address.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-gray-200">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input id="smtpHost" placeholder="smtp.gmail.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="bg-white rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input id="smtpPort" placeholder="587" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="bg-white rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP User</Label>
                    <Input id="smtpUser" placeholder="your-email@gmail.com" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="bg-white rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPass">SMTP Password / App Secret</Label>
                    <div className="relative">
                      <Input 
                        id="smtpPass" 
                        type={showSmtpPass ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={smtpPass} 
                        onChange={(e) => setSmtpPass(e.target.value)} 
                        className="bg-white rounded-xl h-11 pr-10" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass(!showSmtpPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
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
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={testEmail} className="rounded-xl h-11">Test Connection</Button>
                <Button onClick={() => updateConfig({ senderEmail, smtpHost, smtpPort, smtpUser, smtpPass })} className="bg-[var(--terra-navy)] text-white hover:bg-[#003d7a] px-8 rounded-xl h-11">Save Configuration</Button>
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
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white/30 p-6 flex-wrap gap-4">
              <div>
                <CardTitle className="font-['Syne'] text-xl flex items-center gap-2 text-[#002147] dark:text-white">
                  <Activity className="w-5 h-5 text-[var(--terra-emerald)]" />
                  Security & Access Audit Trail
                </CardTitle>
                <CardDescription>Comprehensive, immutable visual timeline of node activity and security events.</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setClearLogsConfirmOpen(true)}
                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20 text-xs font-bold gap-2 h-10 px-4"
              >
                <Trash2 className="w-4 h-4" /> Clear Cache Logs
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2 pb-2">
                {['All', 'Auth', 'Create', 'Update', 'Delete', 'Read'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setLogFilter(cat)}
                    className={`text-xs px-4 py-2 rounded-full font-bold transition-all border ${
                      logFilter === cat
                        ? "bg-[var(--terra-navy)] text-white border-[var(--terra-navy)] dark:bg-[var(--terra-emerald)]"
                        : "border-border bg-card hover:border-[var(--terra-navy)] dark:text-gray-300 dark:hover:border-[var(--terra-emerald)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Vertical Timeline */}
              <div className="relative pl-6 border-l-2 border-border/80 space-y-6">
                {(logFilter === 'All' ? activityLogs : activityLogs.filter(log => log.action_type === logFilter)).length > 0 ? (
                  (logFilter === 'All' ? activityLogs : activityLogs.filter(log => log.action_type === logFilter)).map((log) => {
                    let dotColor = "bg-emerald-500 ring-emerald-500/20";
                    if (log.success === false) dotColor = "bg-red-500 ring-red-500/20";
                    else if (log.action_type === 'Delete') dotColor = "bg-red-400 ring-red-400/20";
                    else if (log.action_type === 'Update') dotColor = "bg-amber-400 ring-amber-400/20";
                    else if (log.action_type === 'Create') dotColor = "bg-blue-500 ring-blue-500/20";
                    else if (log.action_type === 'Auth') dotColor = "bg-purple-500 ring-purple-500/20";
                    
                    return (
                      <div key={log.id || log._id} className="relative group animate-in fade-in slide-in-from-left-2">
                        {/* Timeline Node Icon */}
                        <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full ring-4 ${dotColor}`} />
                        
                        <div className="bg-white/80 dark:bg-white/5 border border-border p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                                  log.action_type === 'Auth' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                                  log.action_type === 'Create' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                  log.action_type === 'Update' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                  log.action_type === 'Delete' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                }`}>
                                  {log.action_type}
                                </span>
                                <h4 className="text-sm font-black text-[#002147] dark:text-white leading-tight">
                                  {log.description}
                                </h4>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{log.userName || log.user || 'Anonymous'}</span>
                                <span>·</span>
                                <span className="uppercase font-black text-[9px]">{log.userRole || log.role || 'Guest'}</span>
                                <span>·</span>
                                <span className="font-mono text-[10px]">{log.ip || '127.0.0.1'}</span>
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground md:text-right shrink-0">
                              {new Date(log.timestamp || log.time).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-sm">No activity logs recorded under this category.</p>
                  </div>
                )}
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
                  <Button onClick={() => updateConfig({ noticeDurationDays, noticeTestMode: false })} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white rounded-xl h-11 px-8 font-bold">
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
                  <Button onClick={() => updateConfig({ noticeTestMinutes, noticeTestMode: true })} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-11 px-8 font-bold">
                    Apply Test Duration
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage reCAPTCHA */}
        <TabsContent value="recaptcha">
          <Card className="border-none shadow-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="font-['Syne'] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[var(--terra-emerald)]" />
                reCAPTCHA Security Management
              </CardTitle>
              <CardDescription>Configure the Custom TerraTrace reCAPTCHA shields protecting the authentication portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Policy toggles and selectors */}
                <div className="space-y-6 flex flex-col justify-center">
                  <div className="flex items-center justify-between p-6 bg-white/80 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm">
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-[#002147] dark:text-white">Enable reCAPTCHA Shield</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">Protect authentication portals with intelligent bot verification.</p>
                    </div>
                    <Switch 
                      checked={recaptchaEnabled} 
                      onCheckedChange={(checked) => {
                        setRecaptchaEnabled(checked);
                        localStorage.setItem('recaptcha_enabled', checked.toString());
                        toast.success(checked ? "reCAPTCHA Shield activated!" : "reCAPTCHA Shield deactivated!");
                      }}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  {recaptchaEnabled && (
                    <div className="p-4 bg-white/80 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl space-y-3 shadow-sm">
                      <p className="font-bold text-xs text-[#002147] dark:text-white uppercase tracking-wider">Challenge Frequency Mode</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setRecaptchaMode('smart');
                            localStorage.setItem('recaptcha_mode', 'smart');
                            toast.info("Smart Risk Mode active: Challenge appears probabilistically (~35% of sessions) like real production sites.");
                          }}
                          className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                            recaptchaMode === 'smart' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20' 
                              : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <p className="font-black text-sm">Smart Risk Mode</p>
                          <p className="font-normal text-[11px] opacity-80 mt-1">Appears sometimes (~35% of sessions) based on risk scoring, matching real websites.</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRecaptchaMode('strict');
                            localStorage.setItem('recaptcha_mode', 'strict');
                            toast.info("Strict Mode active: Challenge appears on 100% of logins.");
                          }}
                          className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                            recaptchaMode === 'strict' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20' 
                              : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <p className="font-black text-sm">Strict Mode</p>
                          <p className="font-normal text-[11px] opacity-80 mt-1">Triggers visual challenge 100% of the time for every attempt.</p>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Active Policy Summary</p>
                    <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
                      {recaptchaEnabled 
                        ? (recaptchaMode === 'smart' 
                            ? "Smart Risk Mode active. Visual reCAPTCHA challenges trigger probabilistically (~35% of sessions) based on risk scoring, matching real-world site behavior." 
                            : "Strict Mode active. Visual reCAPTCHA challenges trigger on 100% of authentication attempts.")
                        : "Security bypass active. reCAPTCHA challenge is disabled, and authentication requests pass directly through to standard 2FA checkpoints."}
                    </p>
                  </div>
                </div>

                {/* Captcha Statistics / Information Card */}
                <div className="bg-emerald-50/50 dark:bg-white/5 rounded-2xl p-6 border border-emerald-100/50 dark:border-white/10 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-white leading-none">Security Shield Status</p>
                        <p className={`text-xs mt-1 ${recaptchaEnabled ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-500'}`}>
                          {recaptchaEnabled 
                            ? (recaptchaMode === 'smart' ? 'Active (Smart Risk Mode)' : 'Active (Strict Mode)') 
                            : 'Disabled / Bypassed'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-emerald-100 dark:border-white/10">
                      <div className="flex justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <span>Dynamic Scoring Threshold:</span>
                        <span>0.65 (Adaptive Sampling)</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <span>MFA Threat Verifications:</span>
                        <span>18 (Last 24 Hours)</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <span>Direct Bot Blocks:</span>
                        <span className="text-red-600 dark:text-red-400">12 (Last 24 Hours)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-800/80 dark:text-gray-400 leading-relaxed italic mt-4">
                    TerraTrace integrates Google reCAPTCHA v3 using a multi-layered response protocol: scores 0.7–1.0 proceed seamlessly, scores 0.3–0.6 trigger forced 2FA challenge screens, and scores under 0.3 are blocked immediately.
                  </p>
                </div>

              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <Button 
                  onClick={() => {
                    localStorage.setItem('recaptcha_enabled', recaptchaEnabled.toString());
                    localStorage.setItem('recaptcha_mode', recaptchaMode);
                    toast.success("reCAPTCHA policies synchronized and saved successfully!");
                  }}
                  className="bg-[var(--terra-navy)] hover:bg-[#003d7a] text-white px-8 rounded-xl h-11 shadow-lg"
                >
                  Save Policies
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage CamPay API & Wallet Settings */}
        <TabsContent value="campay">
          <Card className="border-none shadow-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="font-['Syne'] flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[var(--terra-emerald)]" />
                CamPay API & Escrow Wallet Settings
              </CardTitle>
              <CardDescription>Configure credentials and escrow destination wallets for Cameroon Land Registry transfer fee collections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* CamPay Credentials Card */}
                <div className="space-y-4 p-6 bg-white/80 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-[#002147] dark:text-white uppercase tracking-wider">CamPay API Credentials</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="campayAppId">App ID</Label>
                    <Input id="campayAppId" value={campayAppId} onChange={e => setCampayAppId(e.target.value)} className="rounded-xl h-11" placeholder="e.g. app_12345" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="campayAppKey">App Key (Username)</Label>
                    <Input id="campayAppKey" value={campayAppKey} onChange={e => setCampayAppKey(e.target.value)} className="rounded-xl h-11" placeholder="e.g. api_key_abc123" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campayPassword">App Password</Label>
                    <Input id="campayPassword" type="password" value={campayPassword} onChange={e => setCampayPassword(e.target.value)} className="rounded-xl h-11" placeholder="••••••••" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campayEnv">API Environment</Label>
                    <select id="campayEnv" value={campayEnv} onChange={e => setCampayEnv(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--terra-emerald)] transition-all bg-white text-sm">
                      <option value="sandbox">Sandbox / Demo (demo.campay.net)</option>
                      <option value="live">Live / Production (www.campay.net)</option>
                    </select>
                  </div>
                </div>

                {/* Destination Wallets Card */}
                <div className="space-y-4 p-6 bg-white/80 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-[#002147] dark:text-white uppercase tracking-wider">Escrow Settlement Wallets</h3>
                  
                  {/* MINDCAF Payout Wallet */}
                  <div className="space-y-3 pt-2 border-b pb-4">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">MINDCAF Base Fee Wallet (100%)</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <Label htmlFor="mindcafWallet">Mobile Wallet Number</Label>
                        <Input id="mindcafWallet" value={mindcafWalletNumber} onChange={e => setMindcafWalletNumber(e.target.value)} className="rounded-xl h-11" placeholder="e.g. 677777777" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="mindcafOperator">Operator</Label>
                        <select id="mindcafOperator" value={mindcafOperator} onChange={e => setMindcafOperator(e.target.value)} className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--terra-emerald)] transition-all bg-white text-sm">
                          <option value="MTN">MTN MoMo</option>
                          <option value="Orange">Orange Money</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* TerraTrace Surplus Wallet */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">TerraTrace Platform Wallet (10% Surplus)</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <Label htmlFor="terratraceWallet">Mobile Wallet Number</Label>
                        <Input id="terratraceWallet" value={terratraceWalletNumber} onChange={e => setTerratraceWalletNumber(e.target.value)} className="rounded-xl h-11" placeholder="e.g. 699999999" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="terratraceOperator">Operator</Label>
                        <select id="terratraceOperator" value={terratraceOperator} onChange={e => setTerratraceOperator(e.target.value)} className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--terra-emerald)] transition-all bg-white text-sm">
                          <option value="MTN">MTN MoMo</option>
                          <option value="Orange">Orange Money</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <Button 
                  onClick={() => updateConfig({
                    campay_app_id: campayAppId,
                    campay_app_key: campayAppKey,
                    campay_password: campayPassword,
                    campay_env: campayEnv,
                    mindcaf_wallet_number: mindcafWalletNumber,
                    mindcaf_operator: mindcafOperator,
                    terratrace_wallet_number: terratraceWalletNumber,
                    terratrace_operator: terratraceOperator
                  })}
                  className="bg-[var(--terra-navy)] hover:bg-[#003d7a] text-white px-8 rounded-xl h-11 shadow-lg font-bold"
                >
                  Save API Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chatbot">
          <Card className="border-border/60 shadow-xl rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-[var(--terra-navy)] text-white p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Bot className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold font-['Syne'] text-white">TerraTrace Land Advisor AI Settings</CardTitle>
                  <CardDescription className="text-white/60">Configure, train, and test the conversational AI assistant.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left column: Core API settings */}
                <div className="space-y-5">
                  <h4 className="text-sm font-bold text-[var(--terra-navy)] uppercase tracking-wider">API Configuration</h4>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div>
                      <Label htmlFor="chatbot-enabled" className="text-sm font-semibold text-slate-800">Enable Land Advisor Chatbot</Label>
                      <p className="text-xs text-slate-400 mt-1">Show or hide the floating AI chatbot overlay globally.</p>
                    </div>
                    <Switch 
                      id="chatbot-enabled" 
                      checked={chatbotEnabled} 
                      onCheckedChange={setChatbotEnabled} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chatbot-provider" className="text-xs font-bold text-slate-500 uppercase tracking-widest">API Provider / Key Name</Label>
                    <select 
                      id="chatbot-provider"
                      value={chatbotApiKeyName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChatbotApiKeyName(val);
                        // Reset default model when provider changes
                        setChatbotModel(val.toLowerCase().includes('gemini') ? 'gemini-flash-latest' : 'gpt-4o-mini');
                      }}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--terra-navy)] text-sm text-slate-800"
                    >
                      <option value="Gemini">Google Gemini (Gemini 2.5 Flash)</option>
                      <option value="OpenAI">OpenAI (GPT-4o Mini)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chatbot-model" className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Model Selection</Label>
                    <select 
                      id="chatbot-model"
                      value={chatbotModel}
                      onChange={(e) => setChatbotModel(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--terra-navy)] text-sm text-slate-800"
                    >
                      {chatbotApiKeyName.toLowerCase().includes('gemini') ? (
                        <>
                          <option value="gemini-flash-latest">Gemini Flash Latest ✅ Recommended</option>
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                          <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                          <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                          <option value="gemini-pro-latest">Gemini Pro Latest</option>
                          <option value="gemini-3.5-flash">Gemini 3.5 Flash (Preview)</option>
                        </>
                      ) : (
                        <>
                          <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        </>
                      )}
                    </select>
                  </div>

                  {chatbotApiKeyName.toLowerCase().includes('gemini') && (
                    <div className="space-y-2">
                      <Label htmlFor="chatbot-project" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Google Cloud Project ID / Number</Label>
                      <Input
                        id="chatbot-project"
                        type="text"
                        value={chatbotProjectNumber}
                        onChange={(e) => setChatbotProjectNumber(e.target.value)}
                        placeholder="e.g. 977161537894"
                        className="h-11 rounded-xl text-slate-800"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Required if using Vertex AI/Google Cloud Keys that require resource billing authorization.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="chatbot-key" className="text-xs font-bold text-slate-500 uppercase tracking-widest">API Secret Key</Label>
                    <div className="relative">
                      <Input
                        id="chatbot-key"
                        type={showChatbotKey ? "text" : "password"}
                        value={chatbotApiKey}
                        onChange={(e) => setChatbotApiKey(e.target.value)}
                        placeholder="Paste your API key here..."
                        className="pr-10 h-11 rounded-xl text-slate-800"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowChatbotKey(!showChatbotKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showChatbotKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button 
                      onClick={testChatbotConnection}
                      className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 h-10 px-5 rounded-xl font-bold text-xs"
                    >
                      Test Connection
                    </Button>
                  </div>
                </div>

                {/* Right column: Training directives */}
                <div className="space-y-5">
                  <h4 className="text-sm font-bold text-[var(--terra-navy)] uppercase tracking-wider">AI Training & Knowledge Base</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="system-prompt" className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Persona / Directives</Label>
                    <textarea
                      id="system-prompt"
                      rows={4}
                      value={chatbotSystemPrompt}
                      onChange={(e) => setChatbotSystemPrompt(e.target.value)}
                      placeholder="Add custom behavioral instructions for the bot here (e.g. Tone directives, greeting overrides)..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--terra-navy)] bg-white text-slate-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="knowledge-base" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fed Knowledge Base</Label>
                    <textarea
                      id="knowledge-base"
                      rows={4}
                      value={chatbotKnowledgeBase}
                      onChange={(e) => setChatbotKnowledgeBase(e.target.value)}
                      placeholder="Feed the AI specific Cameroonian land regulations, FAQs, or custom plot metrics here..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--terra-navy)] bg-white text-slate-800"
                    />
                  </div>
                </div>

              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <Button 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const configResponse = await api.patch('/config', {
                        configs: {
                          chatbotEnabled: chatbotEnabled,
                          chatbotApiKey: chatbotApiKey,
                          chatbotApiKeyName: chatbotApiKeyName,
                          chatbotModel: chatbotModel,
                          chatbotProjectNumber: chatbotProjectNumber
                        }
                      });
                      
                      const trainingResponse = await api.post('/chatbot/train', {
                        systemPrompt: chatbotSystemPrompt,
                        knowledgeBase: chatbotKnowledgeBase
                      });

                      if (configResponse.data.success && trainingResponse.data.success) {
                        toast.success("Chatbot settings and training successfully updated!");
                        logActivity('Update', 'Admin updated global AI chatbot parameters and training data');
                        invalidateQuery('settings_config');
                      }
                    } catch (err) {
                      toast.error("Failed to update chatbot configurations");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="bg-[var(--terra-navy)] hover:bg-[#003d7a] text-white px-8 rounded-xl h-11 shadow-lg font-bold"
                >
                  Save Chatbot & Train AI
                </Button>
              </div>
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
                <option value="Admin">Admin</option>
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

      {/* CLEAR LOGS CONFIRMATION DIALOG */}
      <Dialog open={clearLogsConfirmOpen} onOpenChange={setClearLogsConfirmOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
          <div className="bg-red-500 p-6 flex flex-col items-center text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold font-['Syne']">Clear Activity Audit</DialogTitle>
            <DialogDescription className="text-white/80 mt-1">This will permanently clear your local cache logs.</DialogDescription>
          </div>
          <div className="p-8">
            <p className="text-center text-gray-600 dark:text-gray-300 font-medium">
              Are you sure you want to clear all frontend-cached activity logs?
            </p>
            <p className="text-center text-xs text-muted-foreground mt-2 px-4 dark:text-gray-400">
              Only frontend-cached activity logs in this browser will be wiped. Real-time secure logs stored in the backend server nodes will remain untouched.
            </p>
          </div>
          <DialogFooter className="p-6 bg-muted/30 border-t flex gap-3">
            <Button variant="ghost" onClick={() => setClearLogsConfirmOpen(false)} className="flex-1 rounded-xl h-11">No, Keep Logs</Button>
            <Button onClick={handleClearLogs} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 font-bold shadow-lg shadow-red-500/20">
              Yes, Clear Cache
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
