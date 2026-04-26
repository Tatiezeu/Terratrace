import { useState, useMemo, useEffect } from "react";
import api from "../utils/api";
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
  Users,
  FileCheck,
  ExternalLink,
  History,
  X,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Badge } from "../app/components/ui/badge";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import { Textarea } from "../app/components/ui/textarea";
import { RegisterLandownerModal } from "../app/components/lro/RegisterLandownerModal";
import { PublishNoticeModal } from "../app/components/lro/PublishNoticeModal";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "../app/components/ui/dialog";
import { cn } from "../app/components/ui/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const statusConfig = {
  cleared:        { label: "Cleared",        color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> },
  disputed:       { label: "Disputed",       color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500",     icon: <AlertCircle className="w-6 h-6 text-red-500" /> },
  under_review:   { label: "Under Review",   color: "bg-blue-100 text-blue-700 border-blue-200",           dot: "bg-blue-500",    icon: <Clock className="w-6 h-6 text-blue-500" /> },
  transferred:    { label: "Transferred",    color: "bg-purple-100 text-purple-700 border-purple-200",     dot: "bg-purple-500",  icon: <FileCheck className="w-6 h-6 text-purple-500" /> },
  flagged:        { label: "Flagged",        color: "bg-amber-100 text-amber-700 border-amber-200",        dot: "bg-amber-500",   icon: <AlertTriangle className="w-6 h-6 text-amber-500" /> },
};

export default function LRODashboard() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState(null);
  const [plots, setPlots] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
        setLoading(true);
        const [plotsRes, transRes] = await Promise.all([
            api.get('/land'),
            api.get('/transfer/my-transfers')
        ]);
        if (plotsRes.data.success) setPlots(plotsRes.data.data);
        if (transRes.data.success) setTransfers(transRes.data.data);
    } catch (err) {
        toast.error("Failed to fetch regional data");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPlots = useMemo(() => {
    return plots.filter((plot) => {
      const q = searchQuery.toLowerCase();
      const ownerName = plot.owner ? `${plot.owner.firstName} ${plot.owner.lastName}` : "";
      const matchesSearch = !q || plot.landCode.toLowerCase().includes(q) || plot.location.toLowerCase().includes(q) || ownerName.toLowerCase().includes(q);
      const matchesStatus = !activeStatusFilter || plot.status === activeStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, activeStatusFilter, plots]);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleAuthorize = async (requestId) => {
    try {
        const res = await api.patch(`/transfer/${requestId}/status`, { status: 'Completed' });
        if (res.data.success) {
            toast.success("Final transfer authorized successfully!");
            fetchData();
            setIsApprovalOpen(false);
        }
    } catch (err) {
        toast.error(err.response?.data?.message || "Authorization failed");
    }
  };

  const handleRejectToNotary = async (requestId) => {
    try {
        if (!rejectionReason) return toast.error("Please provide a reason");
        const res = await api.patch(`/transfer/${requestId}/status`, { 
            status: 'Under_Verification',
            feedback: `LRO Rejection: ${rejectionReason}`
        });
        if (res.data.success) {
            toast.info("Application sent back to Notary for re-verification");
            fetchData();
            setIsRejectModalOpen(false);
            setIsApprovalOpen(false);
        }
    } catch (err) {
        toast.error("Rejection failed");
    }
  };

  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeTarget, setDisputeTarget] = useState(null);

  const handleToggleDispute = async () => {
    try {
        if (!disputeReason) return toast.error("Please provide a reason");
        const newStatus = disputeTarget.status === 'disputed' ? 'cleared' : 'disputed';
        
        await api.patch(`/transfer/plot/${disputeTarget.id}/dispute`, { 
            status: newStatus,
            feedback: disputeReason 
        });
        toast.success(`Plot marked as ${newStatus}`);
        fetchData();
        setIsDisputeModalOpen(false);
        setDisputeReason("");
    } catch (err) {
        toast.error("Status update failed");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Syne'] text-[#002147]">Registry Officer Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-base">Regional Land Registry &amp; Final Authorizations</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsRegisterOpen(true)} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 border-0 gap-2 h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20 text-white">
            <Users className="w-4 h-4" /> Register Landowner
          </Button>
        </div>
      </div>

      {/* Forwarded Applications Section */}
      <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white">
        <CardHeader className="bg-muted/30 py-4">
          <CardTitle className="text-lg font-bold font-['Syne'] flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" /> Forwarded Transfer Applications
          </CardTitle>
          <p className="text-xs text-muted-foreground">Applications verified by Notaries awaiting final registry authorization.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {transfers.map(req => (
              <div key={req._id} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#002147]">{req.plot?.landCode}</h4>
                      <Badge className={cn(
                        "border-none text-[9px] uppercase font-black px-2 py-0.5",
                        req.status === 'Completed' 
                          ? "bg-emerald-100 text-emerald-700" 
                          : req.transferType === 'direct_grant'
                            ? "bg-purple-600 text-white shadow-sm"
                            : (req.plot?.status === 'disputed' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700")
                      )}>
                        {req.status === 'Completed' 
                          ? "Authorized & Completed" 
                          : req.transferType === 'direct_grant'
                            ? "DIRECT GRANT"
                            : (req.plot?.status === 'disputed' ? "BLOCKED (DISPUTED)" : "Review Pending")}
                      </Badge>
                      <Badge variant="outline" className="text-[8px] border-blue-200 text-blue-600 bg-blue-50/50">
                         {req.isSubdivision ? `SUB PORTION (${req.transferArea}m²)` : "FULL PORTION"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                      {req.transferType === 'direct_grant' 
                        ? `Application Type: Direct State Grant`
                        : `Transfer: ${req.transferType?.toUpperCase() || "PURCHASE"} via Notary ${req.notary?.lastName || ""}`}
                      <span className="mx-1">·</span>
                      Buyer: {req.receiver?.firstName || "Unknown"} {req.receiver?.lastName || ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {req.status === 'Completed' ? (
                    <Button 
                      onClick={() => { setSelectedRequest(req); setIsApprovalOpen(true); }} 
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg h-9 px-4 font-bold flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> View Summary
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => { setSelectedRequest(req); setIsApprovalOpen(true); }} 
                      className="bg-[#002147] hover:bg-blue-900 text-white rounded-lg h-9 px-4 font-bold flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Review Dossier
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {transfers.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm">No applications currently forwarded to you.</div>}
          </div>
        </CardContent>
      </Card>

      {/* Regional Registry Table */}
      <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b">
          <CardTitle className="text-lg font-bold font-['Syne']">Regional Registry</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search registry..." className="pl-10 h-9 rounded-xl text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredPlots.map((plot) => (
              <div key={plot._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                    <img src={plot.coverImage ? `http://localhost:5001${plot.coverImage}` : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold font-mono text-sm group-hover:text-[var(--terra-emerald)] transition-colors">{plot?.landCode}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {plot.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <Badge className={`${statusConfig[plot.status]?.color || statusConfig.cleared.color} border text-[10px] uppercase px-2 py-0.5`}>
                      {statusConfig[plot.status]?.label || plot.status}
                   </Badge>
                   <Button 
                     variant="outline" 
                     size="sm" 
                     disabled={!['under_review', 'under_transfer', 'disputed'].includes(plot.status)}
                     onClick={() => { setDisputeTarget({ id: plot._id, status: plot.status, code: plot.landCode }); setIsDisputeModalOpen(true); }}
                     className={cn("h-8 gap-1.5 px-3 rounded-lg border-amber-200 text-amber-700", plot.status === 'disputed' && "bg-amber-600 text-white border-none", !['under_review', 'under_transfer', 'disputed'].includes(plot.status) && "opacity-30 cursor-not-allowed")}
                   >
                     <AlertTriangle className="w-3.5 h-3.5" />
                     {plot.status === 'disputed' ? 'Lift Dispute' : 'Dispute Land'}
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Register Landowner Modal */}
      <RegisterLandownerModal open={isRegisterOpen} onClose={() => { setIsRegisterOpen(false); fetchData(); }} />

      {/* Publish Notice Modal */}
      <PublishNoticeModal open={isPublishOpen} onClose={() => { setIsPublishOpen(false); fetchData(); }} request={selectedRequest} />

      {/* Dossier Review Modal */}
      <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#002147] p-6 text-white">
             <div className="flex justify-between items-start">
                <div>
                   <DialogTitle className="text-2xl font-bold font-['Syne'] flex items-center gap-2">
                      Dossier Review
                      {selectedRequest?.status === 'Public_Notice' && (
                        <Badge className={cn(
                          "text-[10px] uppercase font-black border",
                          new Date(selectedRequest.publicNotice?.endDate) < new Date() 
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        )}>
                          {new Date(selectedRequest.publicNotice?.endDate) < new Date() ? "Notice Expired" : "Notice Active"}
                        </Badge>
                      )}
                    </DialogTitle>
                   <DialogDescription className="text-blue-100/70 mt-1">Certified Land Transfer Application #{selectedRequest?._id?.substring(0, 8)}</DialogDescription>
                </div>
                <Badge className="bg-[var(--terra-emerald)] text-white uppercase text-[10px] px-3 py-1">{selectedRequest?.status?.replace('_', ' ') || "PENDING"}</Badge>
             </div>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
             {/* Summary Cards */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Initiator / Seller</p>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">{selectedRequest?.sender?.firstName?.[0] || "?"}</div>
                      <div>
                         <p className="text-sm font-bold">{selectedRequest?.sender?.firstName || "Unknown"} {selectedRequest?.sender?.lastName || ""}</p>
                         <p className="text-[10px] text-muted-foreground">{selectedRequest?.sender?.email || "No email provided"}</p>
                      </div>
                   </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Target Property</p>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700"><MapPin className="w-4 h-4" /></div>
                      <div>
                         <p className="text-sm font-bold font-mono">{selectedRequest?.plot?.landCode || "N/A"}</p>
                         <p className="text-[10px] text-muted-foreground">{selectedRequest?.plot?.location || "Location pending"}</p>
                      </div>
                   </div>
                </div>
             </div>


             {/* Documents Section */}
             <div className="space-y-4">
                <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase px-1 mb-2">Identity &amp; Supporting Docs</p>                    <div className="grid grid-cols-1 gap-2">
                      {selectedRequest?.clientDocuments?.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-white shadow-sm hover:border-blue-200 transition-colors">
                           <div className="flex items-center gap-3">
                              <FileCheck className="w-4 h-4 text-blue-500" />
                              <span className="text-[11px] font-bold truncate max-w-[200px]">{typeof doc === 'string' ? doc.split('/').pop() : (doc.name || `Document ${i+1}`)}</span>
                           </div>
                           <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 text-blue-600" onClick={() => window.open(`http://localhost:5001${typeof doc === 'string' ? doc : doc.url}`, '_blank')}><Eye className="w-4 h-4" /></Button>
                              <a href={`http://localhost:5001${typeof doc === 'string' ? doc : doc.url}`} download className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg"><Download className="w-4 h-4" /></a>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div>
                   <p className="text-[10px] font-bold text-emerald-600 uppercase px-1 mb-2">Notary Verified Drafts &amp; Receipts</p>
                   <div className="grid grid-cols-1 gap-2">
                      {selectedRequest?.buyerDocuments?.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-emerald-50/20 border-emerald-100 shadow-sm">
                           <div className="flex items-center gap-3">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span className="text-[11px] font-bold truncate max-w-[200px]">{typeof doc === 'string' ? doc.split('/').pop() : (doc.name || `Certified_Dossier_${i+1}`)}</span>
                           </div>
                           <a href={`http://localhost:5001${typeof doc === 'string' ? doc : doc.url}`} download className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg"><Download className="w-4 h-4" /></a>
                        </div>
                      ))}
                      {selectedRequest?.paymentReceipt && (
                        <div className="flex items-center justify-between p-3 rounded-xl border bg-amber-50/20 border-amber-100 shadow-sm">
                           <div className="flex items-center gap-3">
                              <CreditCard className="w-4 h-4 text-amber-600" />
                              <span className="text-[11px] font-bold">Payment Receipt</span>
                           </div>
                           <a href={`http://localhost:5001${selectedRequest.paymentReceipt}`} download className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg"><Download className="w-4 h-4" /></a>
                        </div>
                      )}
                   </div>
                </div>

             </div>
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t flex flex-col sm:flex-row gap-2">
             {selectedRequest?.status === 'Completed' ? (
                <div className="w-full flex flex-col gap-3">
                   <div className="flex items-center justify-center p-3 bg-emerald-50 border border-emerald-200 rounded-xl gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Transfer Finalized & Certified</p>
                   </div>
                   <Button 
                      variant="outline" 
                      onClick={() => setIsApprovalOpen(false)}
                      className="w-full h-10 rounded-lg font-bold text-[10px] uppercase tracking-widest"
                   >
                      Close Summary
                   </Button>
                </div>
             ) : (
                <>
                   <Button 
                      variant="outline" 
                      disabled={selectedRequest?.status === 'Public_Notice' || selectedRequest?.status === 'Under_Verification'}
                      onClick={() => setIsRejectModalOpen(true)} 
                      className="rounded-lg h-10 px-4 border text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                   >
                      Reject Dossier
                   </Button>
                   
                   {selectedRequest?.status !== 'Public_Notice' && selectedRequest?.status !== 'Under_Verification' ? (
                      <Button 
                        onClick={() => { setIsPublishOpen(true); setIsApprovalOpen(false); }} 
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-10 rounded-lg font-bold uppercase tracking-widest text-[10px]"
                      >
                         Publish Notice
                      </Button>
                   ) : selectedRequest?.status === 'Public_Notice' ? (
                      <div className={cn(
                        "flex-1 flex items-center justify-center rounded-lg border",
                        new Date(selectedRequest.publicNotice?.endDate) < new Date() ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                      )}>
                         <Badge className={cn(
                           "text-[9px] uppercase font-black",
                           new Date(selectedRequest.publicNotice?.endDate) < new Date() ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                         )}>
                            {new Date(selectedRequest.publicNotice?.endDate) < new Date() ? "Notice Expired" : "Notice Active"}
                         </Badge>
                      </div>
                   ) : (
                      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                         <Badge className="bg-gray-500 text-white text-[9px] uppercase font-black">Returned</Badge>
                      </div>
                   )}

                   <Button 
                      disabled={
                        (selectedRequest?.status === 'Public_Notice' && selectedRequest?.publicNotice?.endDate && new Date() < new Date(selectedRequest.publicNotice.endDate)) ||
                        selectedRequest?.plot?.status === 'disputed'
                      }
                      onClick={() => handleAuthorize(selectedRequest._id)} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 h-10 rounded-lg font-black shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-[10px] disabled:opacity-50"
                   >
                      {selectedRequest?.plot?.status === 'disputed' ? 'LOCKED (DISPUTED)' : 'Authorize Transfer'}
                   </Button>
                </>
             )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECTION JUSTIFICATION MODAL */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-['Syne'] text-red-700">Rejection Justification</DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for sending this dossier back to the Notary.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <Label htmlFor="rejectReason" className="text-xs font-bold text-gray-500 uppercase">Reason for Rejection</Label>
             <Textarea 
               id="rejectReason" 
               placeholder="e.g. Missing buyer ID verification, Plot coordinates mismatch..." 
               value={rejectionReason}
               onChange={(e) => setRejectionReason(e.target.value)}
               className="mt-2 rounded-xl h-32 text-sm focus:ring-red-500"
             />
          </div>
          <DialogFooter className="gap-2">
             <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)} className="rounded-xl h-11 px-6">Cancel</Button>
             <Button 
               onClick={() => handleRejectToNotary(selectedRequest._id)}
               className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold h-11 px-6"
             >
                Confirm Rejection &amp; Return
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DISPUTE CONFIRMATION MODAL */}
      <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-bold font-['Syne']", disputeTarget?.status === 'disputed' ? "text-emerald-700" : "text-amber-700")}>
               {disputeTarget?.status === 'disputed' ? 'Lift Land Dispute' : 'Initiate Land Dispute'}
            </DialogTitle>
            <DialogDescription>
               Plot: <span className="font-mono font-bold">{disputeTarget?.code}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className={cn("p-3 rounded-xl border text-xs", disputeTarget?.status === 'disputed' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700")}>
                {disputeTarget?.status === 'disputed' 
                  ? "Are you sure you want to lift the dispute? This will allow administrative processes to resume." 
                  : "Marking this land as 'Disputed' will block any ongoing transfers or authorizations immediately."}
             </div>
             <div className="space-y-2">
                <Label htmlFor="disputeReason" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Administrative Reason / Feedback</Label>
                <Textarea 
                  id="disputeReason" 
                  placeholder={disputeTarget?.status === 'disputed' ? "Reason for lifting dispute..." : "Reason for dispute (e.g., Ownership contestation, Court order)..."}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="rounded-xl h-24 text-sm"
                />
             </div>
          </div>
          <DialogFooter className="gap-2">
             <Button variant="ghost" onClick={() => setIsDisputeModalOpen(false)} className="rounded-xl h-11">Cancel</Button>
             <Button 
               onClick={handleToggleDispute}
               className={cn("rounded-xl font-bold h-11 px-6", disputeTarget?.status === 'disputed' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700", "text-white")}
             >
                {disputeTarget?.status === 'disputed' ? 'Confirm Lift Dispute' : 'Confirm Dispute'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
