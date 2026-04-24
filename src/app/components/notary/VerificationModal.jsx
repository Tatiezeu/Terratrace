import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { CheckCircle2, Upload, Send, ArrowRight, Check, FileText, ExternalLink, Download, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { mockTransferRequests, mockLandPlots } from "../../../data/mockData";

const UploadItem = ({ label, fieldKey, files, onChange, onRemove }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold">{label}</Label>
    <div className="space-y-2">
      {files && files.map((file, idx) => (
        <div key={idx} className="flex items-center gap-3 px-4 py-2 border border-[var(--terra-emerald)] bg-emerald-50/50 rounded-xl text-sm animate-in fade-in slide-in-from-left-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-emerald-700 font-medium truncate flex-1">{file.name}</span>
          <button onClick={() => onRemove(idx)} className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <label
        htmlFor={fieldKey}
        className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-muted-foreground transition-colors text-sm"
      >
        <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">Add {files && files.length > 0 ? "another" : "document"}</span>
      </label>
    </div>
    <input 
      id={fieldKey} 
      type="file" 
      className="hidden" 
      accept=".pdf,.jpg,.jpeg,.png" 
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onChange(file);
        e.target.value = ""; // Reset to allow adding same file again if needed
      }} 
    />
  </div>
);

export function VerificationModal({ requestId, open, onClose, startStep = 1 }) {
  const [step, setStep] = useState(startStep);
  const [matterportId, setMatterportId] = useState("");
  const [buyerDocs, setBuyerDocs] = useState([]);
  const [feeNote, setFeeNote] = useState("Please pay the land transfer processing fee of 150,000 XAF via the platform payment portal. Attach your payment receipt to unlock forwarding to the LRO.");
  const [done, setDone] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState("");

  // Sync step with startStep when modal opens
  useEffect(() => {
    if (open) {
      setStep(startStep);
    }
  }, [open, startStep]);

  const request = mockTransferRequests.find((r) => r.id === requestId);
  const plot = request ? mockLandPlots.find((p) => p.landCode === request?.landCode) : null;

  const handleSendFeeNotice = () => {
    setStep(4);
    setTimeout(() => {
      toast.success("Fee notice sent to client!", {
        description: "The client has been notified to pay the processing fee. Once they upload the receipt, you can forward to LRO.",
        duration: 5000,
      });
    }, 400);
  };

  const handleForwardToLRO = () => {
    setDone(true);
    toast.success("Documents forwarded to LRO!", {
      description: `Plot ${request?.landCode} has been forwarded to the Land Registry Officer for on-site visit and public notice publication.`,
      duration: 6000,
    });
    setTimeout(onClose, 1800);
  };

  const handleClose = () => {
    setStep(startStep);
    setMatterportId("");
    setBuyerDocs([]);
    setDone(false);
    onClose();
  };

  const handleAddBuyerDoc = (file) => {
    setBuyerDocs(prev => [...prev, file]);
  };

  const handleRemoveBuyerDoc = (index) => {
    setBuyerDocs(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadDoc = (doc) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Preparing ${doc} for download...`,
        success: `${doc} downloaded successfully as PDF!`,
        error: 'Failed to download document.',
      }
    );
  };

  const handleViewDoc = (doc) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  const handleFullScreen = () => {
    const element = document.getElementById("notary-document-viewer");
    if (element) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    }
  };

  if (!request || !plot) return null;

  const stepLabels = ["Review", "Buyer Docs", "Fee Notice", "Forward"];

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Syne'] text-lg">Verification — {request.landCode}</DialogTitle>
            <DialogDescription>
              {request.transferType === "purchase" ? "Deed of Sale" : "Inheritance"} · Buyer: {request.buyerName}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicators */}
          <div className="flex items-center gap-1">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    step > i + 1 ? "bg-[var(--terra-emerald)] text-white" : step === i + 1 ? "bg-[var(--terra-navy)] text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {step > i + 1 ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <p className="text-[9px] mt-1 text-muted-foreground text-center">{label}</p>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`h-0.5 flex-1 mb-4 transition-colors ${step > i + 1 ? "bg-[var(--terra-emerald)]" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Review submitted docs */}
            {step === 1 && (
              <motion.div key="v1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-xs text-muted-foreground">Review the documents submitted by the buyer. Approve to continue.</p>
                <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm border">
                  <div className="flex justify-between"><span className="text-muted-foreground">Land Code</span><span className="font-mono font-bold">{request.landCode}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{plot.location}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Current Owner</span><span className="font-semibold text-amber-700">{plot.owner}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Buyer</span><span className="font-semibold">{request.buyerName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">CNI</span><span>{request.buyerCNI}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize font-medium">{request.transferType}</span></div>
                </div>
                <div className="space-y-2">
                  {["CNI Document", request.transferType === "purchase" ? "Deed of Sale" : "Inheritance Certificate"].map((doc) => (
                    <div key={doc} className="flex items-center gap-3 p-3 rounded-lg border bg-emerald-50/50 border-emerald-200 group">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium">{doc}</span>
                      <div className="ml-auto flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="text-xs h-7 hover:bg-emerald-100" onClick={() => handleViewDoc(doc)}>View</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-100 text-emerald-600" onClick={() => handleDownloadDoc(doc)}>
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Upload buyer docs + matterport */}
            {step === 2 && (
              <motion.div key="v2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-xs text-muted-foreground">Upload the buyer's supporting documents and link the Matterport ID for the plot.</p>
                <UploadItem
                  label="Buyer's Compiled Documents (CNI, Deed of Sale, etc.)"
                  fieldKey="buyerDocsUpload"
                  files={buyerDocs}
                  onChange={handleAddBuyerDoc}
                  onRemove={handleRemoveBuyerDoc}
                />
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Matterport ID (360° Scan)</Label>
                  <Input
                    placeholder="e.g. SxQL3iGyvJ5"
                    value={matterportId}
                    onChange={(e) => setMatterportId(e.target.value)}
                    className="h-10 font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Enter the Matterport model ID from the on-site 3D scan of the property.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Send processing fee notice */}
            {step === 3 && (
              <motion.div key="v3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Send a fee payment notification to the client. They must upload the payment receipt before you can forward to LRO.
                </p>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Notification Message</Label>
                  <Textarea
                    value={feeNote}
                    onChange={(e) => setFeeNote(e.target.value)}
                    className="min-h-[100px] text-sm"
                  />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 space-y-1">
                  <p className="font-bold text-amber-800">Client will be notified:</p>
                  <p>→ SMS + Platform notification with payment instructions</p>
                  <p>→ Client uploads receipt on their dashboard</p>
                  <p>→ You review receipt, then forward to LRO</p>
                </div>
              </motion.div>
            )}

            {/* Step 4: Forward to LRO */}
            {step === 4 && (
              <motion.div key="v4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 space-y-1">
                  <p className="font-bold">Fee notice sent ✓</p>
                  <p className="text-xs">Waiting for the client to upload their payment receipt. Once received, forward all documents to the LRO for the on-site visit and 30-day public notice.</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm border">
                  <p className="font-bold text-[var(--terra-navy)] mb-1">What the LRO will do:</p>
                  <p className="text-xs text-muted-foreground">① Conduct an on-site visit to the property</p>
                  <p className="text-xs text-muted-foreground">② Publish a 30-day public notice on the platform</p>
                  <p className="text-xs text-muted-foreground">③ If no opposition: validate transfer, cancel old titre foncier, issue new one</p>
                  <p className="text-xs text-muted-foreground">④ Buyer is notified to collect the new titre foncier in person</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="gap-2 pt-2">
            {step > 1 && step < 4 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            {step === 1 && (
              <Button onClick={() => setStep(2)} className="bg-[var(--terra-navy)] text-white gap-2 flex-1">
                Approve &amp; Continue <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            {step === 2 && (
              <Button onClick={() => setStep(3)} disabled={buyerDocs.length === 0} className="bg-[var(--terra-navy)] text-white gap-2 flex-1">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleSendFeeNotice} className="bg-amber-500 hover:bg-amber-600 text-white gap-2 flex-1">
                <Send className="w-4 h-4" /> Send Fee Notice to Client
              </Button>
            )}
            {step === 4 && (
              <Button onClick={handleForwardToLRO} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white gap-2 flex-1">
                <Send className="w-4 h-4" /> Forward to LRO
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Document Preview: {selectedDoc}
            </DialogTitle>
            <DialogDescription>Verified Authentic Document — Chamber of Notaries</DialogDescription>
          </DialogHeader>
          <div className="flex-1 bg-muted/20 rounded-xl border flex flex-col overflow-hidden relative">
            <div className="bg-muted h-10 flex items-center px-4 justify-between border-b">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest italic">Encrypted Secure Portal</div>
            </div>
            <div id="notary-document-viewer" className="flex-1 p-12 overflow-y-auto bg-white">
              <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="border-b-2 border-black pb-4 text-center">
                  <h2 className="text-xl font-serif font-black uppercase tracking-tighter">Republic of Cameroon</h2>
                  <p className="text-xs font-serif italic">Peace - Work - Fatherland</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-center underline uppercase">{selectedDoc}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                    <div>Ref No: <span className="font-bold">CM-DOC-2024-{Math.floor(Math.random()*900)+100}</span></div>
                    <div>Date: <span className="font-bold">20/05/2024</span></div>
                  </div>
                  <div className="space-y-4 pt-4">
                    <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    <div className="h-4 bg-muted animate-pulse rounded w-11/12" />
                    <div className="h-4 bg-muted animate-pulse rounded w-10/12" />
                    <div className="h-8 bg-muted animate-pulse rounded w-full" />
                    <div className="h-4 bg-muted animate-pulse rounded w-9/12" />
                    <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  </div>
                </div>
                <div className="pt-20 flex justify-end">
                  <div className="text-center opacity-60">
                    <div className="w-24 h-12 border-2 border-dashed border-black/20 flex items-center justify-center italic text-xs mb-1">STAMP</div>
                    <p className="text-[10px] font-serif uppercase tracking-widest font-black">Certified Copy</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-25deg]">
              <span className="text-9xl font-black uppercase">TerraTrace Verified</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close Preview</Button>
            <Button onClick={handleFullScreen} className="bg-[var(--terra-navy)] text-white gap-2">
              <ExternalLink className="w-4 h-4" /> Open Full Screen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
