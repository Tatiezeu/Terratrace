import { useState } from "react";
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
  Maximize2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card";
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
import { VerificationModal } from "../app/components/notary/VerificationModal";
import { mockTransferRequests, mockLandPlots } from "../data/mockData";
import { toast } from "sonner";

export default function NotaryDashboard() {
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [statusModal, setStatusModal] = useState({ type: null, requestId: null });
  const [verificationStartStep, setVerificationStartStep] = useState(1);
  const [caseSummaryModal, setCaseSummaryModal] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const filterRequests = (requests) => {
    const q = searchQuery.toLowerCase();
    if (!q) return requests;
    return requests.filter(r =>
      r.landCode.toLowerCase().includes(q) ||
      r.buyerName.toLowerCase().includes(q) ||
      r.transferType.toLowerCase().includes(q)
    );
  };

  const pendingRequests = filterRequests(mockTransferRequests.filter(r => r.status === "pending"));
  const ongoingRequests = filterRequests(mockTransferRequests.filter(r => ["notary_verified","fee_pending","site_visit","published"].includes(r.status)));

  const handleVerify = (id) => {
    setSelectedRequestId(id);
    setVerificationStartStep(1);
    setIsVerifyOpen(true);
  };

  const handleStatusAction = (request) => {
    if (request.status === "fee_pending") {
      setSelectedRequestId(request.id);
      setVerificationStartStep(4);
      setIsVerifyOpen(true); 
    } else {
      setStatusModal({ type: request.status, requestId: request.id });
    }
  };

  const handleViewDetails = (request) => {
    setCaseSummaryModal(request);
  };

  const handleViewDoc = (doc) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  const handleDownloadDoc = (doc) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Preparing ${doc.name || doc} for download...`,
        success: `${doc.name || doc} downloaded successfully!`,
        error: 'Failed to download document.',
      }
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Syne']">Notary Officer Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Chamber of Notaries - Jurisdiction: Douala I
          </p>
        </div>
        <div className="flex gap-3">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 px-4 py-2">
            <ShieldCheck className="w-4 h-4 mr-2" />
            License Active: 2026/001
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Queue */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-bold font-['Syne']">Verification Queue</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, buyer, type..."
                  className="pl-10 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex flex-col p-4 rounded-xl border border-border hover:border-emerald-500/50 hover:bg-accent/5 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[var(--terra-navy)]/10 flex items-center justify-center">
                          <FileSignature className="w-6 h-6 text-[var(--terra-navy)] dark:text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">New Transfer Request</p>
                          <h4 className="font-bold text-lg mt-0.5">{request.landCode}</h4>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-0">Awaiting Review</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 py-4 border-y border-border">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-muted">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">Buyer: {request.buyerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-muted">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Submitted: 2 hours ago</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                            DOC
                          </div>
                        ))}
                        <span className="ml-4 text-xs text-muted-foreground self-center">+2 more docs</span>
                      </div>
                      <Button 
                        onClick={() => handleVerify(request.id)}
                        className="bg-[var(--terra-emerald)] hover:bg-emerald-600 gap-2"
                      >
                        Start Verification
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ongoing Cases */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold font-['Syne']">Ongoing Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ongoingRequests.map((request) => {
                  const plot = mockLandPlots.find(p => p.landCode === request.landCode);
                  return (
                    <div key={request.id} className="p-4 rounded-xl border border-border bg-white dark:bg-white/5 hover:shadow-md transition-all group relative">
                      <div className="flex justify-between items-start mb-3">
                        <Badge className={`text-[10px] py-0 px-2 uppercase border-none ${
                          request.status === 'published' ? "bg-amber-100 text-amber-700" :
                          request.status === 'notary_verified' ? "bg-emerald-100 text-emerald-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">ID: #OWN-{plot?.ownerCNI || request.id}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold font-mono text-sm">{request.landCode}</p>
                          <p className="text-xs text-muted-foreground mt-1">Buyer: {request.buyerName}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-[var(--terra-navy)] hover:bg-[var(--terra-navy)]/5"
                            onClick={() => handleViewDetails(request)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-[var(--terra-emerald)] hover:bg-[var(--terra-emerald)]/5"
                            onClick={() => handleStatusAction(request)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="w-full bg-muted h-1.5 rounded-full mt-4 overflow-hidden">
                        <div 
                          className="bg-[var(--terra-emerald)] h-full transition-all duration-1000" 
                          style={{ width: request.status === "published" ? "80%" : request.status === "notary_verified" ? "100%" : "40%" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Action Modals */}
        <Dialog open={!!statusModal.type} onOpenChange={() => setStatusModal({ type: null, requestId: null })}>
          <DialogContent className="max-w-md">
            {statusModal.type === "published" && (
              <div className="py-6 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset="70" className="text-amber-500 transition-all duration-1000" />
                    </svg>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-[#002147]">22</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Days Left</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <DialogTitle className="text-xl font-bold font-['Syne']">Public Notice Countdown</DialogTitle>
                  <DialogDescription>
                    The 30-day public notice for this plot is currently active. 
                    Oppositions can be filed until June 10, 2024.
                  </DialogDescription>
                </div>
                <Button onClick={() => setStatusModal({ type: null, requestId: null })} className="w-full bg-[var(--terra-navy)] text-white">
                  Close Monitoring
                </Button>
              </div>
            )}

            {statusModal.type === "notary_verified" && (
              <div className="py-8 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold font-['Syne']">Verification Completed</DialogTitle>
                  <DialogDescription className="text-base">
                    This case has been fully verified and signed by the Notary. 
                    All documents are ready for final LRO validation.
                  </DialogDescription>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-700 text-sm italic">
                  "Authenticity of deed and identity of parties confirmed."
                </div>
                <Button onClick={() => setStatusModal({ type: null, requestId: null })} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Back to Dashboard
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Case Summary Modal */}
        <Dialog open={!!caseSummaryModal} onOpenChange={() => setCaseSummaryModal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-['Syne']">Case File Summary</DialogTitle>
              <DialogDescription>
                Secure digital dossier for plot {caseSummaryModal?.landCode}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Request ID</p>
                  <p className="font-mono font-bold">{caseSummaryModal?.id?.toUpperCase()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Submitted On</p>
                  <p className="font-bold">{caseSummaryModal?.submittedAt}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Buyer Name</p>
                  <p className="font-bold">{caseSummaryModal?.buyerName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Status</p>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none capitalize">
                    {caseSummaryModal?.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--terra-emerald)]" />
                  Verified Case Documents
                </h4>
                <div className="space-y-2">
                  {[
                    { name: "Buyer Identity (CNI)", type: "PDF", size: "1.2 MB" },
                    { name: "Signed Deed of Sale", type: "PDF", size: "2.4 MB" },
                    { name: "Land Title Extract", type: "PDF", size: "0.8 MB" },
                    { name: "Registry Tax Receipt", type: "PDF", size: "0.5 MB" }
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl border bg-white hover:bg-gray-50 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{doc.type} · {doc.size}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                          onClick={() => handleViewDoc(doc)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                          onClick={() => handleDownloadDoc(doc)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setCaseSummaryModal(null)} className="w-full bg-[var(--terra-navy)] text-white h-11 rounded-xl">
                Close Case File
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Legal Resources */}
        <div className="space-y-6">
          <Card className="bg-[var(--terra-navy)] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Gavel className="w-24 h-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-bold font-['Syne']">Legal Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-white/10 border border-white/10">
                <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  NEW REGULATION
                </p>
                <p className="text-sm font-medium">Updated 2026 Land Transfer Act (Section 4.2)</p>
                <p className="text-xs text-white/50 mt-1">Mandatory digital witness signatures required for all deeds.</p>
              </div>
              <Button variant="secondary" className="w-full">View Legal Library</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold font-['Syne']">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "John Doe", type: "Deed Signing", time: "09:00 AM" },
                { name: "Alice Smith", type: "Doc Review", time: "11:30 AM" },
                { name: "Robert Ngollo", type: "Inheritance", time: "02:15 PM" },
              ].map((apt, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-semibold">{apt.name}</p>
                    <p className="text-[10px] text-muted-foreground">{apt.type}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] tabular-nums">{apt.time}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <VerificationModal 
        requestId={selectedRequestId}
        open={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        startStep={verificationStartStep}
      />

      {/* Document Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={(open) => {
        setIsPreviewOpen(open);
        if (!open) setIsFullScreen(false);
      }}>
        <DialogContent className={`${isFullScreen ? "max-w-[100vw] h-[100vh] w-[100vw]" : "max-width-4xl h-[80vh] w-[90vw]"} transition-all duration-300 p-0 overflow-hidden flex flex-col`}>
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-600">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold">{selectedDoc?.name || selectedDoc}</DialogTitle>
                <DialogDescription className="text-[10px]">Secure Document Preview · Verified by TerraTrace</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 pr-8">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsFullScreen(!isFullScreen)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => handleDownloadDoc(selectedDoc)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-gray-100 p-4 flex justify-center overflow-auto">
            <div className={`bg-white shadow-2xl w-full max-w-[800px] h-fit min-h-full p-12 border-t-4 border-[var(--terra-emerald)] transition-all ${isFullScreen ? "scale-105" : ""}`}>
              {/* Mock PDF Content */}
              <div className="flex justify-between items-start mb-12">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold uppercase tracking-tighter text-[#002147]">Republic of Cameroon</h1>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em]">Peace - Work - Fatherland</p>
                  <div className="w-12 h-1 bg-emerald-500 mt-2" />
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-emerald-700">DOC-REF: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                  <p className="text-[10px] text-muted-foreground">Certified on: 2024-05-24</p>
                </div>
              </div>
              
              <div className="text-center mb-12">
                <h2 className="text-xl font-black underline decoration-2 underline-offset-8 uppercase text-[#002147] tracking-widest">{selectedDoc?.name || selectedDoc}</h2>
              </div>

              <div className="space-y-6 text-sm leading-loose text-gray-700">
                <p>This document serves as an official certified digital copy of the <strong>{selectedDoc?.name || selectedDoc}</strong> related to the land transfer request for plot <strong>{caseSummaryModal?.landCode}</strong>.</p>
                <p>The parties involved, {caseSummaryModal?.buyerName} (Buyer) and the registered landowner, have duly submitted this document through the TerraTrace secure portal. It has been cryptographically signed and verified against the National Civil Registry.</p>
                
                <div className="py-12 border-y border-dashed border-gray-200 my-8">
                  <div className="h-64 bg-gray-50/50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20 pointer-events-none" />
                     <FileText className="w-16 h-16 text-emerald-100 mb-4 group-hover:scale-110 transition-transform" />
                     <p className="text-xs text-gray-400 font-medium italic">High-Resolution Document Scan Preview</p>
                     <Badge variant="secondary" className="mt-4 bg-emerald-50 text-emerald-700 border-emerald-100">AUTHENTICATED</Badge>
                  </div>
                </div>

                <p>Any falsification of this document is subject to prosecution under the Land Management Act 2023. The validity of this digital copy is equivalent to the physical original as per Law No. 2023/007 on Digital Transactions.</p>
              </div>

              <div className="mt-20 flex justify-between items-end">
                <div className="space-y-4">
                  <div className="w-32 h-32 border-4 border-emerald-500 bg-white p-2 flex items-center justify-center">
                    {/* Placeholder for QR code */}
                    <div className="grid grid-cols-6 gap-0.5 opacity-80">
                      {[...Array(36)].map((_, i) => <div key={i} className={`w-3 h-3 ${Math.random() > 0.5 ? "bg-[#002147]" : "bg-transparent"}`} />)}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Scan to verify authenticity</p>
                </div>
                <div className="text-right space-y-3">
                   <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Signed by</p>
                      <p className="font-['Syne'] font-black text-[#002147]">TerraTrace Authority</p>
                   </div>
                   <div className="w-48 h-0.5 bg-gray-200 ml-auto" />
                   <p className="text-[8px] uppercase font-bold tracking-[0.3em] text-emerald-600">Secure Digital Registry</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t bg-white flex justify-end gap-3">
             <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-xl px-8 h-11">Close Preview</Button>
             <Button onClick={() => handleDownloadDoc(selectedDoc)} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white rounded-xl px-8 h-11 font-bold gap-2">
                <Download className="w-4 h-4" /> Download PDF
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
