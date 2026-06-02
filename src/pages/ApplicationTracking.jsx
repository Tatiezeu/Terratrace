import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../app/components/ui/card';
import { Badge } from '../app/components/ui/badge';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useMyTransfers } from '../hooks/useTransferData';

/**
 * ApplicationTracking Page Component
 * Renders a premium, comprehensive registry dashboard page for Landowners/Clients
 * to trace and monitor the detailed stepper progress of their Land Title Transfer files in real time.
 */
export default function ApplicationTracking() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [clickedStep, setClickedStep] = useState({}); // Stores { [appId]: stepId }

  // ─── Server state via TanStack Query (cached, stale-while-revalidate) ───────
  const { data: rawTransfers = [], isLoading: loading } = useMyTransfers();

  // ─── Normalize backend status enum to local display enum ─────────────────
  const applications = useMemo(() => {
    return rawTransfers.map(app => ({
      id: app._id,
      landCode: app.plot?.landCode || "Unknown Code",
      buyerName: app.receiver ? `${app.receiver.firstName} ${app.receiver.lastName}` : "Unknown Buyer",
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
      senderId: app.sender?._id || app.sender?.id || app.sender
    }));
  }, [rawTransfers]);

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

  // Filter application files based on query strings, dropdown selections, and role authorization
  const filteredApps = applications.filter((app) => {
    // Normal users can only track applications they initiated (senderId === user.id)
    // Admins (SuperAdmin) can track all applications
    const isAuthorized = user?.role === 'SuperAdmin' || 
                         (app.senderId && (String(app.senderId) === String(user?._id) || String(app.senderId) === String(user?.id)));
    if (!isAuthorized) return false;

    const matchesSearch = 
      app.landCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate high-level summary metrics for display cards
  const stats = {
    total: applications.length,
    pending: applications.filter(a => ['pending', 'fee_pending'].includes(a.status)).length,
    published: applications.filter(a => a.status === 'published').length,
    finalized: applications.filter(a => a.status === 'notary_verified').length,
  };

  /**
   * Translates raw database status keys into localized Cameroon Land Registry terminology
   * @param {string} status - Raw status database value.
   */
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

  /**
   * Assigns theme-matching colors to status tags
   * @param {string} status - Raw status database value.
   */
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      fee_pending: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      published: "bg-[#D4AF37]/10 border-[#D4AF37]/35 text-[#B8860B] dark:bg-yellow-900/20 dark:text-yellow-300",
      notary_verified: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      disputed: "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  /**
   * Standardized stepper mapping helper. Returns current step index (0-3) based on file status.
   * @param {string} status - Raw status database value.
   */
  const getActiveStep = (status) => {
    if (status === 'pending') return 0;
    if (status === 'fee_pending') return 1;
    if (status === 'published') return 2;
    if (status === 'notary_verified') return 3;
    return 0;
  };

  // Get customized header title and description based on current logged in user's role
  const getHeaderDetails = () => {
    switch (user?.role) {
      case 'SuperAdmin':
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

  // Get customized statistics labels based on current logged in user's role
  const getStatsLabels = () => {
    const isOfficer = ['LRO', 'Notary', 'SuperAdmin'].includes(user?.role);
    return {
      total: isOfficer ? "Total Active Cases" : "Your Applications",
      pending: user?.role === 'Notary' ? "Awaiting Your Audit" : "Notary Audits",
      published: user?.role === 'LRO' ? "Opposition Notice" : "Public Notice Phase",
      finalized: "Finalized Titles"
    };
  };

  const statsLabels = getStatsLabels();

  return (
    <div className="space-y-8 pb-12 overflow-y-auto h-full pr-6 dark:bg-[#002147] dark:text-gray-100 p-6 transition-colors">
      
      {/* ─── Part 1: Dashboard Header ─── */}
      <div className="border-b border-white/10 pb-8">
        <h1 className="text-3xl font-bold font-['Syne'] text-[#002147] dark:text-[var(--terra-emerald)]">{header.title}</h1>
        <p className="text-muted-foreground mt-1 dark:text-gray-400 italic">{header.desc}</p>
      </div>

      {/* ─── Part 2: Quick Metrics Grid ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: statsLabels.total, val: stats.total, color: "text-[#002147]", icon: <FileSearch className="w-4 h-4 text-gray-500" /> },
          { label: statsLabels.pending, val: stats.pending, color: "text-blue-600", icon: <Clock className="w-4 h-4 text-blue-500" /> },
          { label: statsLabels.published, val: stats.published, color: "text-[#B8860B]", icon: <Activity className="w-4 h-4 text-yellow-500" /> },
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
        ) : filteredApps.length === 0 ? (
          <Card className="border-none shadow-sm p-12 text-center bg-white/50 dark:bg-white/5 rounded-2xl">
            <FileSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#002147] font-['Syne']">No Applications Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">There are no active land registry transfer files matching your current search parameters.</p>
          </Card>
        ) : (
          filteredApps.map((app) => {
            const currentStep = getActiveStep(app.status);
            
            return (
              <motion.div 
                key={app.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                
                {/* Lateral Accent Color Banner */}
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
                    <h3 className="text-lg font-bold text-[#002147] mt-1 flex items-center gap-2">
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
                              <span className={check.checked ? "line-through text-gray-400 dark:text-gray-500 font-normal" : "text-foreground font-semibold"}>{check.name}</span>
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
                <div className="flex justify-end pt-4 border-t border-gray-50 items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 gap-2 text-xs font-bold text-[#002147] group-hover:bg-[#002147] group-hover:text-white rounded-xl transition-all"
                    onClick={() => setSelectedApp(app)}
                  >
                    <Info className="w-3.5 h-3.5" /> Inspect File Ledger
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

              </motion.div>
            );
          })
        )}
      </div>

      {/* ─── Part 5: Detailed File Info Overlay/Drawer ─── */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-8 flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-mono leading-none">REGISTRY DIRECTORY FILE</p>
                  <h3 className="text-xl font-bold font-['Syne'] text-[#002147] mt-1">Application #{selectedApp.id}</h3>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setSelectedApp(null)}>
                  <Ban className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                
                <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                  <p className="text-xs text-gray-400 font-bold uppercase">Land Code Identifier</p>
                  <p className="font-mono text-sm font-bold text-[#002147]">{selectedApp.landCode}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                    <p className="text-xs text-gray-400 font-bold uppercase">Transaction Type</p>
                    <p className="text-sm font-semibold capitalize text-[#002147]">{selectedApp.transferType}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                    <p className="text-xs text-gray-400 font-bold uppercase">Assigned Notary</p>
                    <p className="text-sm font-semibold text-[#002147]">Me André Fotso (CH10001)</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <p className="text-xs text-gray-400 font-bold uppercase">Transaction Parties</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Seller/Lessor:</span>
                      <span className="text-[#002147] font-bold">Jean-Claude Mbarga</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Buyer/Transferee:</span>
                      <span className="text-[#002147] font-bold">{selectedApp.buyerName}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl space-y-2">
                  <p className="text-xs text-yellow-700 font-bold uppercase">Cameroon Land Law Compliance (Article 17)</p>
                  <p className="text-xs text-yellow-800 leading-relaxed italic">
                    All transfer deeds are subjected to a mandatory 30-day notice board publication inside MINDCAF systems to query for disputes before the final Titre Foncier is generated on the blockchain network.
                  </p>
                </div>

              </div>
            </div>

            <div className="pt-6 border-t mt-6 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setSelectedApp(null)}>
                Close Ledger
              </Button>
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

    </div>
  );
}
