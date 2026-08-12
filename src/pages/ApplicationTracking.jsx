// BEHAVIOR: Renders a dossier tracker interface for landowners and clients, displaying stepper status tracking for land transfer requests.
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import PaymentPage from './PaymentPage';
// BEHAVIOR: UI Icons representing files, maps, users, checkmarks, clocks, and warning messages
import { 
  FileSearch, 
  MapPin, 
  User, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  Search, 
  SlidersHorizontal,
  ChevronRight,
  Info,
  BadgeCheck,
  Ban,
  Activity,
  CheckCircle2,
  Upload,
  Smartphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../app/components/ui/card';
import { Badge } from '../app/components/ui/badge';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
// BACKEND_CONNECTION: useMyTransfers fetches transfer dossiers matching user role
import { useMyTransfers } from '../hooks/useTransferData';
import api from '../utils/api';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../app/components/ui/dialog';

export default function ApplicationTracking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  // BEHAVIOR: Stores { [appId]: stepId } to display the active expanded audit check block
  const [clickedStep, setClickedStep] = useState({}); 

  // BEHAVIOR: Local state tracking array of cleared application IDs to hide them in the current view
  const [clearedAppIds, setClearedAppIds] = useState([]);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [activePaymentId, setActivePaymentId] = useState(null);

  // Payment proof upload state (keyed by transfer id)
  const [proofUploadOpenId, setProofUploadOpenId] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofOperator, setProofOperator] = useState('MTN'); // 'MTN' or 'Orange'
  const [proofReference, setProofReference] = useState('');
  const [proofUploading, setProofUploading] = useState(false);

  // BEHAVIOR: Load cleared application IDs from localStorage on mount/user-change
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`cleared_client_applications_${user._id || user.id}`);
      setClearedAppIds(saved ? JSON.parse(saved) : []);
    }
  }, [user]);

  // ─── Server state via TanStack Query (cached, stale-while-revalidate) ───────
  // BACKEND_CONNECTION: Queries user's associated transfers via useMyTransfers hook
  const { data: rawTransfers = [], isLoading: loading, refetch: refetchTransfers } = useMyTransfers();

  // ─── Normalize backend status enum to local display enum ─────────────────
  const applications = useMemo(() => {
    return rawTransfers.map(app => ({
      id: app._id,
      landCode: app.plot?.landCode || "Unknown Code",
      sellerName: app.plot?.owner
        ? `${app.plot.owner.firstName} ${app.plot.owner.lastName}`
        : app.sender
          ? `${app.sender.firstName} ${app.sender.lastName}`
          : "Unknown Seller",
      buyerName: app.receiver ? `${app.receiver.firstName} ${app.receiver.lastName}` : "Unknown Buyer",
      notaryName: app.notary ? `${app.notary.firstName} ${app.notary.lastName}` : null,
      status: app.status === 'Initiated' ? 'pending' : 
              app.status === 'Under_Verification' ? 'pending' : 
              app.status === 'Awaiting_Fee_Payment' ? 'fee_pending' : 
              app.status === 'Payment_Submitted' ? 'fee_pending' : 
              app.status === 'Payment_Verified' ? 'fee_pending' : 
              app.status === 'Forwarded_to_LRO' ? 'published' : 
              app.status === 'Public_Notice' ? 'published' : 
              app.status === 'Completed' ? 'notary_verified' : app.status,
      transferType: app.transferType || "purchase",
      submittedAt: new Date(app.createdAt).toLocaleDateString(),
      senderId: app.sender?._id || app.sender?.id || app.sender,
      rawStatus: app.status
    }));
  }, [rawTransfers]);

  // BEHAVIOR: Generates static check mock logs matching stepper step details
  const getStepAuditDetails = (stepId, app) => {
    const auditLogs = {
      0: {
        title: "Notary Auditing Phase",
        status: app.status === 'pending' ? "In Progress" : "Completed",
        checks: [
          { name: "Verify CNI & Civil Registry Dossier", checked: true },
          { name: "Audit Land Plot Ownership Title History", checked: true },
          { name: "Perform Overlap Registry Map Verification", checked: app.status !== 'pending' },
          { name: "Compute Cryptographic Signature & Hash Block", checked: app.status !== 'pending' }
        ],
        blockchain: "Block #827,104 · Signed by Notary André Fotso"
      },
      1: {
        title: "Stamp Duty & Payment Phase",
        status: app.status === 'pending' ? "Locked" : app.status === 'fee_pending' ? "In Progress" : "Completed",
        checks: [
          { name: "Generate MINDCAF Stamp Duty Invoice", checked: ['fee_pending', 'published', 'notary_verified'].includes(app.status) },
          { name: "Deposit Notary Escrow Stamp Fee", checked: ['published', 'notary_verified'].includes(app.status) },
          { name: "Verify Payment Receipt & Unlock Ledger", checked: ['published', 'notary_verified'].includes(app.status) }
        ],
        blockchain: "Escrow Contract: 0x71C...89A · Status: Verified"
      },
      2: {
        title: "Public Notice Opposition Phase",
        status: ['pending', 'fee_pending'].includes(app.status) ? "Locked" : app.status === 'published' ? "In Progress (30 Days)" : "Completed",
        checks: [
          { name: "Publish transfer details to Public Notice Board", checked: ['published', 'notary_verified'].includes(app.status) },
          { name: "Mandatory 30-day opposition & dispute window", checked: app.status === 'notary_verified' },
          { name: "Resolve any adverse claims or boundary objections", checked: app.status === 'notary_verified' }
        ],
        blockchain: "Challenge window recorded on Ethereum contract state."
      },
      3: {
        title: "Titre Foncier Issuance Phase",
        status: app.status === 'notary_verified' ? "Completed" : "Locked",
        checks: [
          { name: "Revoke old Deed Certificate registry link", checked: app.status === 'notary_verified' },
          { name: "Generate official MINDCAF Titre Foncier", checked: app.status === 'notary_verified' },
          { name: "Mint immutable Token ID representation to Blockchain", checked: app.status === 'notary_verified' }
        ],
        blockchain: "Token ID #44920 · Minted to land address · LOCKED"
      }
    };
    return auditLogs[stepId];
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch = 
      app.landCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const visibleApps = useMemo(() => {
    return filteredApps.filter((app) => !clearedAppIds.includes(app.id));
  }, [filteredApps, clearedAppIds]);

  // BEHAVIOR: Clear visible applications from layout, persisting exclusion list in localStorage
  const handleClearAllApps = () => {
    const idsToClear = visibleApps.map((a) => a.id);
    const updated = [...new Set([...clearedAppIds, ...idsToClear])];
    setClearedAppIds(updated);
    if (user) {
      localStorage.setItem(`cleared_client_applications_${user._id || user.id}`, JSON.stringify(updated));
    }
    setIsClearModalOpen(false);
    toast.success("Applications cleared from view successfully!");
  };

  const handleUploadProof = async (appId) => {
    if (!proofFile) {
      toast.error('Please select a screenshot to upload.');
      return;
    }
    setProofUploading(true);
    try {
      const formData = new FormData();
      formData.append('proofFile', proofFile);
      formData.append('operator', proofOperator);
      if (proofReference) formData.append('momoReference', proofReference);

      const res = await api.post(`/transfer/${appId}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Payment proof submitted! Your notary has been notified.');
        setProofUploadOpenId(null);
        setProofFile(null);
        setProofReference('');
        refetchTransfers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload proof.');
    } finally {
      setProofUploading(false);
    }
  };

  const visibleApplicationsList = useMemo(() => {
    return applications.filter((app) => !clearedAppIds.includes(app.id));
  }, [applications, clearedAppIds]);

  const stats = {
    total: visibleApplicationsList.length,
    pending: visibleApplicationsList.filter(a => ['pending', 'fee_pending'].includes(a.status)).length,
    published: visibleApplicationsList.filter(a => a.status === 'published').length,
    finalized: visibleApplicationsList.filter(a => a.status === 'notary_verified').length,
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Notary Auditing",
      fee_pending: "Stamp Duty Pending",
      published: "Public Notice Phase (30 Days)",
      notary_verified: "Title Registered (Immutable)",
      disputed: "Under Opposition Review",
    };
    return labels[status] || status.replace('_', ' ');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      fee_pending: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      // COLOR_THEME: Notice board status highlights using Gold translucent colors
      published: "bg-[#D4AF37]/10 border-[#D4AF37]/35 text-[#B8860B] dark:bg-yellow-900/20 dark:text-yellow-300",
      notary_verified: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      disputed: "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getActiveStep = (status) => {
    if (status === 'pending') return 0;
    if (status === 'fee_pending') return 1;
    if (status === 'published') return 2;
    if (status === 'notary_verified') return 3;
    return 0;
  };

  const getHeaderDetails = () => {
    switch (user?.role) {
      case 'Admin':
        return {
          title: "National Title Registry Monitor",
          desc: "Oversee all global land deeds, public notices, and blockchain registries across all regions."
        };
      case 'LRO':
        return {
          title: "Registry Officer Title Ledger",
          desc: "Manage public opposition periods and authorize official blockchain Titre Fonciers."
        };
      case 'Notary':
        return {
          title: "Notary Officer Audit Queue",
          desc: "Review transfer dossiers, certify buyer documents, and collect MINDCAF stamp duties."
        };
      case 'Landowner':
        return {
          title: "Land Title File Tracker",
          desc: "Monitor the step-by-step legalization pipeline and approval statuses of your land plots."
        };
      default:
        return {
          title: "Deed Transfer Status Queue",
          desc: "Monitor your active land purchases, registrations, and notary filings in real-time."
        };
    }
  };

  const header = getHeaderDetails();

  const getStatsLabels = () => {
    const isOfficer = ['LRO', 'Notary', 'Admin'].includes(user?.role);
    return {
      total: isOfficer ? "Total Active Cases" : "Your Applications",
      pending: user?.role === 'Notary' ? "Awaiting Your Audit" : "Notary Audits",
      published: user?.role === 'LRO' ? "Opposition Notice" : "Public Notice Phase",
      finalized: "Finalized Titles"
    };
  };

  const statsLabels = getStatsLabels();

  return (
    // COLOR_THEME: Dark mode background utilizes #002147
    <div className="space-y-8 pb-12 overflow-y-auto h-full pr-6 dark:bg-[#002147] dark:text-gray-100 p-6 transition-colors">
      
      {/* ─── Part 1: Dashboard Header ─── */}
      <div className="border-b border-white/10 pb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* COLOR_THEME: Main title text highlighted using #002147 and var(--terra-emerald) */}
          <h1 className="text-3xl font-bold font-['Syne'] text-[#002147] dark:text-[var(--terra-emerald)]">{header.title}</h1>
          <p className="text-muted-foreground mt-1 dark:text-gray-400 italic">{header.desc}</p>
        </div>
        {/* COLOR_THEME: Delete button has light red classes */}
        {visibleApps.length > 0 && (
          <Button 
            onClick={() => setIsClearModalOpen(true)}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/20 rounded-xl font-bold text-xs px-4 h-10 transition-all shrink-0 self-start sm:self-center"
          >
            Clear All Applications
          </Button>
        )}
      </div>

      {/* ─── Part 2: Quick Metrics Grid ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: statsLabels.total, val: stats.total, color: "text-[#002147] dark:text-white", icon: <FileSearch className="w-4 h-4 text-gray-500" /> },
          { label: statsLabels.pending, val: stats.pending, color: "text-blue-600", icon: <Clock className="w-4 h-4 text-blue-500" /> },
          { label: statsLabels.published, val: stats.published, color: "text-[#B8860B] dark:text-yellow-500", icon: <Activity className="w-4 h-4 text-yellow-500" /> },
          { label: statsLabels.finalized, val: stats.finalized, color: "text-emerald-600", icon: <BadgeCheck className="w-4 h-4 text-emerald-500" /> }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                <p className={`text-3xl font-black ${stat.color}`}>{loading ? "..." : stat.val}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-white/10 flex items-center justify-center shadow-inner">
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Part 3: Search, Filters & Action Bars ─── */}
      <Card className="border-none shadow-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search Input bar */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search Land Code, Transferee, or File ID..." 
                className="pl-9 h-11 bg-white rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex gap-3 w-full md:w-auto items-center">
              <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0 hidden md:block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                // COLOR_THEME: Dropdown focuses with emerald highlights
                className="px-4 py-3 w-full md:w-56 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--terra-emerald)] transition-all bg-white text-sm"
              >
                <option value="all">All File States</option>
                <option value="pending">Notary Auditing</option>
                <option value="fee_pending">Stamp Duty Pending</option>
                <option value="published">Public Notice Phase</option>
                <option value="notary_verified">Finalized Registry</option>
                <option value="disputed">Disputed / Opposed</option>
              </select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ─── Part 4: File Stepper List ─── */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-10 h-10 border-4 border-[var(--terra-emerald)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-400">Loading Land Registry files...</p>
          </div>
        ) : visibleApps.length === 0 ? (
          <Card className="border-none shadow-sm p-12 text-center bg-white/50 dark:bg-white/5 rounded-2xl">
            <FileSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            {/* COLOR_THEME: Header text styled with Navy color */}
            <h3 className="text-lg font-bold text-[#002147] dark:text-white font-['Syne']">No Applications Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">There are no active land registry transfer files matching your current search parameters.</p>
          </Card>
        ) : (
          visibleApps.map((app) => {
            const currentStep = getActiveStep(app.status);
            
            return (
              <motion.div 
                key={app.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                
                {/* Lateral Accent Color Banner */}
                {/* COLOR_THEME: Accent sidebar indicator displays red, green or gold based on status */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                  app.status === 'notary_verified' ? 'bg-emerald-500' :
                  app.status === 'disputed' ? 'bg-red-500' : 'bg-[#D4AF37]'
                }`} />

                {/* Top Section: Meta details & Status badge */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400">FILE ID: {app.id}</span>
                      <Badge className={`border uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-lg ${getStatusColor(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </Badge>
                    </div>
                    {/* COLOR_THEME: Land code and location marker uses Navy/Emerald highlights */}
                    <h3 className="text-lg font-bold text-[#002147] dark:text-white mt-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--terra-emerald)]" />
                      {app.landCode}
                    </h3>
                  </div>
                  <div className="flex gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <User className="w-3.5 h-3.5" /> Transferee: {app.buyerName}
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="w-3.5 h-3.5" /> Date: {app.submittedAt}
                    </span>
                  </div>
                </div>

                {/* Stepper Pipeline Graphics */}
                <div className="mb-6">
                  <div className="grid grid-cols-4 gap-2 relative">
                    
                    {/* Stepper connecting background progress pipeline bar */}
                    <div className="absolute top-[15px] left-[12.5%] right-[12.5%] h-1 bg-gray-100 -z-10 rounded-full">
                      {/* COLOR_THEME: Active stepper bar has gradient from Gold to Navy */}
                      <div 
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#002147] transition-all duration-500 rounded-full" 
                        style={{ width: `${(currentStep / 3) * 100}%` }}
                      />
                    </div>

                    {[
                      { id: 0, title: "Notary Audit" },
                      { id: 1, title: "Stamp Duties" },
                      { id: 2, title: "Public Notice" },
                      { id: 3, title: "Titre Foncier" }
                    ].map((step) => {
                      const isPast = step.id < currentStep;
                      const isCurrent = step.id === currentStep;
                      const isPending = step.id > currentStep;
                      const isStepClicked = clickedStep[app.id] === step.id;
                      
                      return (
                        <div 
                          key={step.id} 
                          onClick={() => {
                            setClickedStep(prev => ({
                              ...prev,
                              [app.id]: prev[app.id] === step.id ? null : step.id
                            }));
                          }}
                          className="flex flex-col items-center text-center relative cursor-pointer group/step"
                        >
                          {/* COLOR_THEME: Circular step badges colored in Emerald, Gold, or Neutral depending on progress */}
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                            isPast 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md group-hover/step:scale-115'
                              : isCurrent 
                              ? 'bg-[#D4AF37] border-[#D4AF37] text-[#002147] scale-110 shadow-lg shadow-yellow-500/20 group-hover/step:scale-120'
                              : 'bg-white border-gray-200 text-gray-400 group-hover/step:border-[var(--terra-emerald)] group-hover/step:text-[var(--terra-emerald)]'
                          } ${isStepClicked ? 'ring-2 ring-emerald-500 ring-offset-2 scale-110' : ''}`}>
                            {isPast ? <ShieldCheck className="w-4 h-4" /> : step.id + 1}
                          </div>
                          <span className={`text-[9px] uppercase tracking-wider font-black mt-2 hidden sm:block ${
                            isStepClicked ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : isCurrent ? 'text-[#002147] dark:text-white font-extrabold' : 'text-gray-400'
                          }`}>
                            {step.title}
                          </span>
                        </div>
                      );
                    })}

                  </div>
                </div>

                {/* Expanded Interactive Step Audit Logs Panel */}
                <AnimatePresence>
                  {clickedStep[app.id] !== undefined && clickedStep[app.id] !== null && (() => {
                    const audit = getStepAuditDetails(clickedStep[app.id], app);
                    if (!audit) return null;
                    return (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl space-y-3 overflow-hidden text-xs"
                      >
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-bold text-[#002147] dark:text-white flex items-center gap-1.5 font-['Syne']">
                            <Clock className="w-3.5 h-3.5 text-[var(--terra-emerald)]" /> {audit.title}
                          </span>
                          <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                            audit.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' :
                            audit.status.startsWith('In Progress') ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                          }`}>
                            {audit.status}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5">
                          {audit.checks.map((check, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium">
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                check.checked ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-400 dark:bg-white/5'
                              }`}>
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              </div>
                              <span className={check.checked ? "line-through text-gray-400 dark:text-gray-500 font-normal" : "text-foreground dark:text-white font-semibold"}>{check.name}</span>
                            </div>
                          ))}
                        </div>

                        <div className="bg-white/60 dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-white/10 text-[9px] font-mono text-gray-400 flex items-center justify-between">
                          <span>BLOCKCHAIN RECORD:</span>
                          <span className="font-bold text-gray-600 dark:text-gray-400">{audit.blockchain}</span>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

                {/* Bottom Bar: Action Trigger Drawer */}
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-50 dark:border-white/10">

                  {/* ── Payment Proof Upload Panel (escape hatch when CamPay fails) ── */}
                  {app.rawStatus === 'Awaiting_Fee_Payment' && (
                    <div className="w-full">
                      {proofUploadOpenId === app.id ? (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                              <Smartphone className="w-4 h-4" /> Payment Not Confirmed by App? Upload Proof
                            </p>
                            <button
                              type="button"
                              onClick={() => { setProofUploadOpenId(null); setProofFile(null); setProofReference(''); }}
                              className="text-amber-600 dark:text-amber-400 text-[10px] font-bold hover:underline"
                            >
                              Cancel
                            </button>
                          </div>

                          {/* Operator selector: MTN or Orange */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setProofOperator('MTN')}
                              className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                proofOperator === 'MTN'
                                  ? 'border-yellow-400 bg-yellow-400/20 text-yellow-800 dark:text-yellow-200'
                                  : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-yellow-300'
                              }`}
                            >
                              <span className="text-base">🟡</span> MTN MoMo
                            </button>
                            <button
                              type="button"
                              onClick={() => setProofOperator('Orange')}
                              className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                proofOperator === 'Orange'
                                  ? 'border-orange-400 bg-orange-400/20 text-orange-800 dark:text-orange-200'
                                  : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-orange-300'
                              }`}
                            >
                              <span className="text-base">🟠</span> Orange Money
                            </button>
                          </div>

                          {/* Reference field */}
                          <input
                            type="text"
                            placeholder={`${proofOperator === 'MTN' ? 'MTN MoMo' : 'Orange Money'} transaction reference (optional)`}
                            value={proofReference}
                            onChange={e => setProofReference(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-amber-200 dark:border-amber-800/40 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:text-white"
                          />

                          {/* Screenshot upload */}
                          <div
                            onClick={() => document.getElementById(`proof-upload-${app.id}`).click()}
                            className="border-2 border-dashed border-amber-300 dark:border-amber-800/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-all"
                          >
                            <Upload className="w-5 h-5 text-amber-500" />
                            {proofFile ? (
                              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 text-center">{proofFile.name}</p>
                            ) : (
                              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold text-center">Click to upload your {proofOperator === 'MTN' ? 'MTN MoMo' : 'Orange Money'} screenshot<br/><span className="font-normal opacity-70">PNG, JPG, PDF accepted</span></p>
                            )}
                          </div>
                          <input
                            id={`proof-upload-${app.id}`}
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={e => setProofFile(e.target.files[0] || null)}
                          />

                          <button
                            type="button"
                            disabled={!proofFile || proofUploading}
                            onClick={() => handleUploadProof(app.id)}
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                          >
                            {proofUploading ? (
                              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                            ) : (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> Submit Payment Proof</>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <button
                            type="button"
                            onClick={() => setProofUploadOpenId(app.id)}
                            className="text-[10px] text-amber-600 dark:text-amber-400 font-bold underline underline-offset-2 hover:text-amber-800 transition-colors"
                          >
                            💡 Payment not confirmed by app? Upload MTN MoMo / Orange Money proof
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment already submitted badge */}
                  {app.rawStatus === 'Payment_Submitted' && (
                    <div className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Payment proof submitted — awaiting notary confirmation. Button disabled to prevent double submission.</p>
                    </div>
                  )}

                  {/* Main action row */}
                  <div className="flex justify-end items-center gap-2">
                    {/* COLOR_THEME: Proceed to payment button colored in Gold */}
                    {app.rawStatus === 'Awaiting_Fee_Payment' && proofUploadOpenId !== app.id && (
                      <Button 
                        size="sm" 
                        className="h-9 gap-2 text-xs font-bold bg-[#D4AF37] hover:bg-[#B8943A] text-[#002147] rounded-xl transition-all shadow-sm"
                        onClick={() => setActivePaymentId(app.id)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Proceed to Payment
                      </Button>
                    )}
                    {/* COLOR_THEME: Inspect File button changes to Navy fill on hover */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 gap-2 text-xs font-bold text-[#002147] dark:text-white group-hover:bg-[#002147] group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-[#002147] rounded-xl transition-all"
                      onClick={() => setSelectedApp(app)}
                    >
                      <Info className="w-3.5 h-3.5" /> Inspect File Ledger
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

              </motion.div>
            );
          })
        )}
      </div>

      {/* ─── Part 5: Detailed File Info Overlay/Drawer ─── */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl p-8 flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4 dark:border-white/10">
                <div>
                  <p className="text-[10px] text-gray-400 font-mono leading-none">REGISTRY DIRECTORY FILE</p>
                  <h3 className="text-xl font-bold font-['Syne'] text-[#002147] dark:text-white mt-1">Application #{selectedApp.id}</h3>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setSelectedApp(null)}>
                  <Ban className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2">
                  <p className="text-xs text-gray-400 font-bold uppercase">Land Code Identifier</p>
                  <p className="font-mono text-sm font-bold text-[#002147] dark:text-white">{selectedApp.landCode}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                    <p className="text-xs text-gray-400 font-bold uppercase">Transaction Type</p>
                    <p className="text-sm font-semibold capitalize text-[#002147] dark:text-white">{selectedApp.transferType}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                    <p className="text-xs text-gray-400 font-bold uppercase">Assigned Notary</p>
                    <p className="text-sm font-semibold text-[#002147] dark:text-white">
                      {selectedApp.notaryName || "Not yet assigned"}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-3">
                  <p className="text-xs text-gray-400 font-bold uppercase">Transaction Parties</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Seller / Current Owner:</span>
                      <span className="text-[#002147] dark:text-white font-bold">{selectedApp.sellerName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Buyer / Transferee:</span>
                      <span className="text-[#002147] dark:text-white font-bold">{selectedApp.buyerName}</span>
                    </div>
                  </div>
                </div>

                {/* COLOR_THEME: Warning warning box uses warm yellow styling */}
                <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl space-y-2 dark:bg-yellow-950/20 dark:border-yellow-900/30">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 font-bold uppercase">Cameroon Land Law Compliance (Article 17)</p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed italic">
                    All transfer deeds are subjected to a mandatory 30-day notice board publication inside MINDCAF systems to query for disputes before the final Titre Foncier is generated on the blockchain network.
                  </p>
                </div>

              </div>
            </div>

            <div className="pt-6 border-t dark:border-white/10 mt-6 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setSelectedApp(null)}>
                Close Ledger
              </Button>
              {/* COLOR_THEME: Export button colored in brand Navy #002147 */}
              <Button 
                onClick={() => toast.success("Ledger document downloaded successfully")}
                className="flex-1 bg-[#002147] hover:bg-blue-900 text-white rounded-xl"
              >
                Export Ledger
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ─── Part 6: Clear All Confirmation Modal ─── */}
      <Dialog open={isClearModalOpen} onOpenChange={setIsClearModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#002147] dark:text-white font-['Syne']">
              Clear All Applications?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              This action will hide all currently visible applications from your tracker view on this device. 
              {/* COLOR_THEME: Warning box displays in light amber theme */}
              <span className="block mt-2 font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                Note: This is a frontend-only action. Your active database titles, legal transfers, and land ownership status will remain entirely unaffected.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-xl px-4 py-2 border-gray-200 dark:border-white/10 dark:text-gray-300"
              onClick={() => setIsClearModalOpen(false)}
            >
              Cancel
            </Button>
            {/* COLOR_THEME: Confirmation button utilizes red fill */}
            <Button
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2 font-bold transition-all shadow-md shadow-red-600/10"
              onClick={handleClearAllApps}
            >
              Confirm Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Part 7: Secure Payment Modal Overlay ─── */}
      <Dialog open={!!activePaymentId} onOpenChange={(open) => { if (!open) setActivePaymentId(null); }}>
        <DialogContent className="max-w-2xl bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[95vh] focus-visible:outline-none dark:bg-slate-900 dark:border-white/10">
          <DialogHeader className="pb-4 border-b border-gray-100 dark:border-white/10">
            <DialogTitle className="font-['Syne'] text-xl text-[#002147] dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" /> Secure Escrow Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
              Complete your transaction securely using the CamPay Mobile Money Gateway.
            </DialogDescription>
          </DialogHeader>
          
          {activePaymentId && (
            <PaymentPage 
              id={activePaymentId} 
              isModal={true} 
              onClose={() => setActivePaymentId(null)} 
              onSuccess={() => {
                toast.success("Refreshing applications list...");
                refetchTransfers();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
