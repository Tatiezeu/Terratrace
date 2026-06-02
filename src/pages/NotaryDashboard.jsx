import { useState, useMemo, useEffect } from "react";
import { 
  Gavel, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Search, 
  Filter, 
  FileSignature, 
  AlertCircle,
  Eye,
  ChevronRight,
  Download,
  CheckCircle2,
  Timer,
  Maximize2,
  Send,
  Upload as UploadIcon,
  CreditCard,
  UserCheck,
  FileCheck,
  ExternalLink,
  History,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Badge } from "../app/components/ui/badge";
import { Input } from "../app/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "../app/components/ui/dialog";
import { Label } from "../app/components/ui/label";
import { Textarea } from "../app/components/ui/textarea";
import { toast } from "sonner";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../app/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../app/components/ui/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useMyTransfers } from "../hooks/useTransferData";
import { useRecipients } from "../hooks/useNotificationsData";

export default function NotaryDashboard() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // ─── Server state via TanStack Query ─────────────────────────────────────────
  const { data: requests = [] } = useMyTransfers();
  const { data: allRecipients = [] } = useRecipients();

  // ─── Derive LRO list from cached recipients ───────────────────────────────
  const lros = useMemo(() => allRecipients.filter(u => u.role === "LRO"), [allRecipients]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [isPaymentReceivedModalOpen, setIsPaymentReceivedModalOpen] = useState(false);

  // ─── Frontend-only Clear States ──────────────────────────────────────────────
  const [clearedCaseIds, setClearedCaseIds] = useState([]);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`cleared_notary_cases_${currentUser._id || currentUser.id}`);
      setClearedCaseIds(saved ? JSON.parse(saved) : []);
    }
  }, [currentUser]);
  
  // Form States
  const [feeAmount, setFeeAmount] = useState("");
  const [feeDesc, setFeeDesc] = useState("");
  const [buyerDocs, setBuyerDocs] = useState([]);
  const [certifiedDocs, setCertifiedDocs] = useState([]);
  const [selectedLro, setSelectedLro] = useState("");

  const handleUpdateStatus = async (requestId, status, additionalData = {}) => {
    try {
      const formData = new FormData();
      formData.append('status', status);
      
      if (additionalData.feeNotice) {
        formData.append('feeNotice[amount]', additionalData.feeNotice.amount);
        formData.append('feeNotice[description]', additionalData.feeNotice.description);
      }
      
      if (additionalData.buyerDocuments) {
        additionalData.buyerDocuments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      if (additionalData.certifiedDocuments) {
        additionalData.certifiedDocuments.forEach(file => {
          formData.append('attachments', file);
        });
      }
      
      if (additionalData.lroId) {
        formData.append('lroId', additionalData.lroId);
      }

      const res = await api.patch(`/transfer/${requestId}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success(`Application updated to ${status.replace(/_/g, ' ')}`);
        queryClient.invalidateQueries({ queryKey: ['transfers'] });
        setIsVerificationOpen(false);
        setIsFeeModalOpen(false);
        setIsForwardModalOpen(false);
        setIsPaymentReceivedModalOpen(false);
        // Reset file states
        setBuyerDocs([]);
        setCertifiedDocs([]);
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const filteredRequests = requests.filter(r => 
    (r.plot?.landCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${r.sender?.firstName} ${r.sender?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingQueue = filteredRequests.filter(r => r.status === 'Initiated');
  const ongoingCases = filteredRequests.filter(r => ['Under_Verification', 'Awaiting_Fee_Payment', 'Payment_Submitted', 'Payment_Verified'].includes(r.status));

  const treatedCases = useMemo(() => {
    return filteredRequests.filter(r => ['Forwarded_to_LRO', 'Public_Notice', 'Completed', 'Rejected', 'Cancelled'].includes(r.status));
  }, [filteredRequests]);

  const visibleTreatedCases = useMemo(() => {
    return treatedCases.filter(r => !clearedCaseIds.includes(r._id));
  }, [treatedCases, clearedCaseIds]);

  const handleClearAllTreated = () => {
    const idsToClear = visibleTreatedCases.map(c => c._id);
    const updated = [...new Set([...clearedCaseIds, ...idsToClear])];
    setClearedCaseIds(updated);
    if (currentUser) {
      localStorage.setItem(`cleared_notary_cases_${currentUser._id || currentUser.id}`, JSON.stringify(updated));
    }
    setIsClearConfirmOpen(false);
    toast.success("Treated cases cleared from view!");
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Syne'] text-[#002147] dark:text-white">Notary Officer Portal</h1>
          <p className="text-muted-foreground mt-1">Legitimize and verify regional land transactions.</p>
        </div>
        <div className="flex gap-3">
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40 px-4 py-2 font-bold uppercase tracking-wider text-[10px]">
            <ShieldCheck className="w-4 h-4 mr-2" /> Regional Authority
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          
          {/* Ongoing Cases */}
          <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white dark:bg-white/5 dark:border dark:border-white/10">
            <CardHeader className="border-b bg-muted/30 dark:bg-slate-800/50 dark:border-white/10 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold font-['Syne'] flex items-center gap-2">
                  <Timer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Ongoing Cases &amp; Verifications
                </CardTitle>
                <CardDescription className="dark:text-gray-400">Applications currently under your supervision.</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search dossiers..." className="pl-10 h-9 rounded-xl text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {ongoingCases.map(req => (
                  <div key={req._id} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        req.status === 'Payment_Submitted' || req.status === 'Payment_Verified' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                      }`}>
                        {req.status === 'Payment_Submitted' || req.status === 'Payment_Verified' ? <FileCheck className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#002147] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{req.plot.landCode}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={cn("text-[9px] uppercase border-none", 
                            req.status === 'Payment_Verified' ? "bg-emerald-600 text-white dark:bg-emerald-700" : 
                            req.status === 'Payment_Submitted' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          )}>
                            {req.status.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-medium italic">Buyer: {req.receiver.firstName} {req.receiver.lastName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {req.status === 'Under_Verification' && (
                        <Button onClick={() => { setSelectedRequest(req); setIsFeeModalOpen(true); }} className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg h-9 px-4 font-bold shadow-sm">Prepare Fee Notice</Button>
                      )}
                      {req.status === 'Awaiting_Fee_Payment' && (
                        <Button onClick={() => { setSelectedRequest(req); setIsPaymentReceivedModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9 px-4 font-bold shadow-sm">Payment Received</Button>
                      )}
                      {req.status === 'Payment_Submitted' && (
                        <Button onClick={() => { setSelectedRequest(req); setIsPaymentReceivedModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9 px-4 font-bold">Verify &amp; Add Docs</Button>
                      )}
                      {req.status === 'Payment_Verified' && (
                        <Button onClick={() => { setSelectedRequest(req); setIsForwardModalOpen(true); }} className="bg-[var(--terra-navy)] hover:bg-blue-900 text-white rounded-lg h-9 px-6 font-bold flex items-center gap-2">Forward to LRO <ChevronRight className="w-4 h-4" /></Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedRequest(req); setIsDetailsOpen(true); }} className="h-9 w-9 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg"><Eye className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
                {ongoingCases.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm">No ongoing cases in your region.</div>}
              </div>
            </CardContent>
          </Card>

          {/* Verification Queue (New Requests) */}
          <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm dark:border dark:border-white/10">
            <CardHeader className="bg-muted/20 dark:bg-slate-800/50 py-4 border-b dark:border-white/10">
              <CardTitle className="text-lg font-bold font-['Syne'] flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <FileSignature className="w-5 h-5" /> Incoming Requests Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-border/50">
                  {pendingQueue.map(req => (
                    <div key={req._id} className="p-5 flex items-center justify-between hover:bg-white dark:hover:bg-white/5 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><FileText className="w-5 h-5" /></div>
                          <div>
                             <h4 className="font-bold text-sm text-[#002147] dark:text-white">{req.plot.landCode}</h4>
                             <p className="text-[10px] text-muted-foreground dark:text-gray-400">Submitted by {req.sender.firstName} {req.sender.lastName} · {new Date(req.createdAt).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <Button onClick={() => handleUpdateStatus(req._id, 'Under_Verification')} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 rounded-lg px-4 text-xs font-bold">Initiate Verification</Button>
                    </div>
                  ))}
                  {pendingQueue.length === 0 && <div className="p-8 text-center text-muted-foreground text-xs italic">All new requests have been processed.</div>}
               </div>
            </CardContent>
          </Card>

          {/* Treated Cases (Archive Queue) */}
          <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white dark:bg-white/5 dark:border dark:border-white/10 mt-6">
            <CardHeader className="border-b bg-muted/30 dark:bg-slate-800/50 dark:border-white/10 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold font-['Syne'] flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> All Treated Cases
                </CardTitle>
                <CardDescription className="dark:text-gray-400 text-xs">History of all cases processed and concluded by you.</CardDescription>
              </div>
              {visibleTreatedCases.length > 0 && (
                <Button 
                  onClick={() => setIsClearConfirmOpen(true)}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/20 text-xs font-bold rounded-lg h-9"
                >
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {visibleTreatedCases.map(req => (
                  <div key={req._id} className="p-5 flex items-center justify-between hover:bg-muted/30 dark:hover:bg-white/5 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-600 dark:text-slate-400">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#002147] dark:text-white">{req.plot.landCode}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={cn("text-[9px] uppercase border-none", 
                            req.status === 'Completed' ? "bg-emerald-600 text-white dark:bg-emerald-700" :
                            req.status === 'Rejected' ? "bg-red-600 text-white dark:bg-red-700" :
                            req.status === 'Cancelled' ? "bg-gray-500 text-white dark:bg-gray-600" :
                            "bg-blue-600 text-white dark:bg-blue-700"
                          )}>
                            {req.status.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-medium italic">Buyer: {req.receiver.firstName} {req.receiver.lastName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        className="rounded-lg h-9 px-4 font-bold flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-950/20 text-xs"
                        onClick={() => { setSelectedRequest(req); setIsDetailsOpen(true); }}
                      >
                        <Eye className="w-4 h-4" /> View Summary
                      </Button>
                    </div>
                  </div>
                ))}
                {visibleTreatedCases.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm italic">No treated cases to display.</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <Card className="bg-gradient-to-br from-[#002147] to-blue-900 text-white border-none shadow-xl rounded-2xl">
              <CardHeader><CardTitle className="text-lg font-bold font-['Syne']">Officer Protocol</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-[10px] font-black">1</div>
                    <p className="text-xs opacity-80">Review client-submitted documents (CNI, Sale Deed) via the summary view.</p>
                 </div>
                 <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-[10px] font-black">2</div>
                    <p className="text-xs opacity-80">Prepare Fee Notice and upload initial Buyer Drafts for client review.</p>
                 </div>
                 <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-[10px] font-black">3</div>
                    <p className="text-xs opacity-80">Upon payment verification, upload certified finalized documents and forward to LRO.</p>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      {/* Summary / Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold font-['Syne'] flex items-center gap-2">
              <Maximize2 className="w-5 h-5 text-emerald-500" /> Dossier Summary: {selectedRequest?.plot.landCode}
            </DialogTitle>
            <DialogDescription>Overview of all documents submitted and generated for this transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 overflow-y-auto max-h-[70vh] pr-2">
             <div className="grid grid-cols-3 gap-4 bg-muted/40 dark:bg-white/5 p-4 rounded-xl">
                <div><Label className="text-[10px] uppercase font-black text-muted-foreground dark:text-gray-400">Plot Code</Label><p className="font-bold text-sm text-[#002147] dark:text-white">{selectedRequest?.plot.landCode}</p></div>
                <div><Label className="text-[10px] uppercase font-black text-muted-foreground dark:text-gray-400">Initiator</Label><p className="font-bold text-sm text-[#002147] dark:text-white">{selectedRequest?.sender.firstName} {selectedRequest?.sender.lastName}</p></div>
                <div><Label className="text-[10px] uppercase font-black text-muted-foreground dark:text-gray-400">Type</Label><Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none uppercase text-[9px] block w-fit">{selectedRequest?.transferType}</Badge></div>
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                   <h4 className="font-bold text-sm flex items-center gap-2"><UserCheck className="w-4 h-4 text-blue-600" /> Client Documents</h4>
                   <Badge variant="outline" className="text-[9px]">{selectedRequest?.clientDocuments?.length} Files</Badge>
                </div>
                <div className="grid grid-cols-1 gap-2">
                   {selectedRequest?.clientDocuments?.map((doc, i) => (
                     <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-white/5 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                           <span className="text-xs font-bold truncate text-[#002147] dark:text-white">{doc.split('/').pop()}</span>
                        </div>
                        <div className="flex gap-2">
                           <a href={`http://localhost:5001${doc}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg"><Eye className="w-4 h-4" /></a>
                           <a href={`http://localhost:5001${doc}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><Download className="w-4 h-4" /></a>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {(selectedRequest?.buyerDocuments?.length > 0 || selectedRequest?.certifiedDocuments?.length > 0) && (
               <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2 pt-4">
                     <h4 className="font-bold text-sm flex items-center gap-2 text-emerald-600"><ShieldCheck className="w-4 h-4" /> Notary Certified Dossier</h4>
                     <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none text-[9px]">Verified</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                     {[...(selectedRequest?.buyerDocuments || []), ...(selectedRequest?.certifiedDocuments || [])].map((doc, i) => (
                       <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-800/30">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                             <span className="text-xs font-bold truncate italic">{doc.split('/').pop()}</span>
                          </div>
                          <a href={`http://localhost:5001${doc}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><Download className="w-4 h-4" /></a>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             {selectedRequest?.paymentReceipt && (
               <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between border-b pb-2">
                     <h4 className="font-bold text-sm flex items-center gap-2 text-amber-600"><CreditCard className="w-4 h-4" /> Payment Receipt</h4>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-amber-50/30 dark:bg-amber-950/10 border-amber-100 dark:border-amber-800/30">
                     <div className="flex items-center gap-3">
                        <Badge className="bg-amber-500 text-white p-2 rounded-lg"><CheckCircle2 className="w-4 h-4" /></Badge>
                        <div>
                           <p className="text-xs font-bold">Proof of Payment</p>
                           <p className="text-[10px] text-muted-foreground">Uploaded by client</p>
                        </div>
                     </div>
                     <a href={`http://localhost:5001${selectedRequest.paymentReceipt}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 rounded-lg text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"><Download className="w-4 h-4" /> Save Receipt</a>
                  </div>
               </div>
             )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Received Modal */}
      <Dialog open={isPaymentReceivedModalOpen} onOpenChange={setIsPaymentReceivedModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" /> Payment Verification &amp; Certification
            </DialogTitle>
            <DialogDescription>Confirm processing fee receipt and upload the final certified land transfer documents.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm"><CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                <div>
                   <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Verify Processing Fee</p>
                   <p className="text-[10px] text-emerald-600 dark:text-emerald-400 opacity-80">Ensure the amount matches the fee notice sent to the client.</p>
                </div>
             </div>
             
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Final Certified Documents</Label>
                <div className="relative">
                   <div onClick={() => document.getElementById('certified_upload').click()} className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-all">
                      <UploadIcon className="w-8 h-8 text-muted-foreground" />
                      <div className="text-center">
                         <p className="text-sm font-bold">Upload Certified Deed &amp; Dossier</p>
                         <p className="text-[10px] text-muted-foreground">PDF, JPG, or PNG (Multiple allowed)</p>
                      </div>
                   </div>
                   <input 
                     id="certified_upload" 
                     type="file" 
                     multiple 
                     className="hidden" 
                     onChange={(e) => setCertifiedDocs(prev => [...prev, ...Array.from(e.target.files)])} 
                   />
                </div>
                {certifiedDocs.length > 0 && (
                   <div className="flex flex-wrap gap-2 pt-2">
                      {certifiedDocs.map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-[9px] gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/40 flex items-center">
                           <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" /> 
                           <span className="truncate max-w-[150px]">{f.name}</span>
                           <button
                             type="button"
                             onClick={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               setCertifiedDocs(certifiedDocs.filter((_, idx) => idx !== i));
                             }}
                             className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors flex items-center justify-center shrink-0"
                           >
                             <X className="w-3 h-3" />
                           </button>
                        </Badge>
                      ))}
                   </div>
                )}
             </div>
          </div>
          <DialogFooter>
             <Button 
               disabled={certifiedDocs.length === 0}
               onClick={() => handleUpdateStatus(selectedRequest._id, 'Payment_Verified', { certifiedDocuments: certifiedDocs })} 
               className="bg-emerald-600 hover:bg-emerald-700 text-white w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs"
             >
                Confirm Payment &amp; Certify Dossier
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Other Modals (Fee, Forward) */}
      <Dialog open={isFeeModalOpen} onOpenChange={setIsFeeModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Prepare Fee Notice</DialogTitle>
            <DialogDescription>Set the processing fee and upload draft buyer documents.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label>Fee Amount (CFA)</Label>
                <Input type="number" placeholder="50000" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} className="rounded-xl" />
             </div>
             <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Registration fees and notary charges..." value={feeDesc} onChange={e => setFeeDesc(e.target.value)} className="rounded-xl" />
             </div>
              <div className="space-y-2">
                 <Label>Draft Documents (Review copies)</Label>
                 <Input type="file" id="draft_upload" multiple onChange={e => setBuyerDocs(prev => [...prev, ...Array.from(e.target.files)])} className="h-11 border-dashed pt-2.5 rounded-xl" />
                 {buyerDocs.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                       {buyerDocs.map((f, i) => (
                         <Badge key={i} variant="secondary" className="text-[9px] gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/40 flex items-center">
                            <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" /> 
                            <span className="truncate max-w-[150px]">{f.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setBuyerDocs(buyerDocs.filter((_, idx) => idx !== i));
                              }}
                              className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors flex items-center justify-center shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                         </Badge>
                       ))}
                    </div>
                 )}
              </div>
          </div>
          <DialogFooter>
             <Button onClick={() => handleUpdateStatus(selectedRequest._id, 'Awaiting_Fee_Payment', { 
               feeNotice: { amount: feeAmount, description: feeDesc },
               buyerDocuments: buyerDocs
             })} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full h-12 rounded-xl font-bold">Send Fee Notice to Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isForwardModalOpen} onOpenChange={setIsForwardModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Regional Registry Forwarding</DialogTitle>
            <DialogDescription>Select the LRO in the appropriate region for final code issuance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label>Regional Registry Officer</Label>
                <Select value={selectedLro} onValueChange={setSelectedLro}>
                   <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Choose Regional LRO..." /></SelectTrigger>
                   <SelectContent>
                      {lros.map(l => (
                        <SelectItem key={l._id} value={l._id}>{l.firstName} {l.lastName} — {l.jurisdiction}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>
             <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl text-xs text-blue-700 dark:text-blue-400 italic border border-blue-100 dark:border-blue-800/30 flex gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0 opacity-50" />
                "By forwarding, you certify that the transaction is legally valid and the dossier is complete for final registry entry."
             </div>
          </div>
          <DialogFooter>
             <Button 
               disabled={!selectedLro}
               onClick={() => handleUpdateStatus(selectedRequest._id, 'Forwarded_to_LRO', { lroId: selectedLro })} 
               className="bg-[var(--terra-navy)] hover:bg-blue-900 text-white w-full h-12 rounded-xl font-bold gap-2 uppercase tracking-widest text-xs"
             >
                <Send className="w-4 h-4" /> Authorize &amp; Forward to Registry
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CLEAR ALL TREATED CASES CONFIRMATION MODAL */}
      <Dialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-['Syne'] text-red-700 dark:text-red-500">Clear All Treated Cases</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Are you sure you want to clear all treated cases from your view?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 text-xs text-red-700 dark:text-red-400 rounded-xl leading-relaxed">
                <strong>Warning:</strong> This action will only remove the treated cases from this frontend view. It will <strong>NOT</strong> delete any records from the database or impact the actual registry status.
             </div>
          </div>
          <DialogFooter className="gap-2">
             <Button variant="ghost" onClick={() => setIsClearConfirmOpen(false)} className="rounded-xl h-11 dark:text-white dark:hover:bg-white/10">Cancel</Button>
             <Button 
               onClick={handleClearAllTreated}
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
