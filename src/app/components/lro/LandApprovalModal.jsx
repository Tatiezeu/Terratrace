import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Building2, 
  MapPin, 
  User, 
  FileCheck, 
  Calendar, 
  Clock, 
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ExternalLink,
  X,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export function LandApprovalModal({ plot, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  if (!plot) return null;

  const handleApprove = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Land Transfer Approved!", {
        description: `The final title deed for plot ${plot.landCode} has been generated and the previous title is officially cancelled.`,
        duration: 5000,
      });
      onClose();
    }, 1500);
  };

  const handlePreview = (docName) => {
    setPreviewDoc(docName);
  };

  const handleFullScreen = () => {
    const element = document.getElementById("lro-document-viewer");
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

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-md border-white/20 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-100/50">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <DialogTitle className="font-['Syne'] text-xl text-[#002147]">Final Registry Approval</DialogTitle>
                <DialogDescription>Validate and finalize ownership transfer on blockchain</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left Column: Plot Info */}
            <div className="space-y-4">
              <div className="aspect-video relative rounded-2xl overflow-hidden border shadow-inner">
                <img src={plot.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <Badge className="bg-emerald-500 text-white border-0 text-[10px]">{plot.landCode}</Badge>
                </div>
              </div>
              <div className="bg-muted/30 rounded-2xl p-4 space-y-3 border border-border/50">
                <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground border-b pb-2 mb-2">Property Details</h4>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{plot.location}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Surface Area</span>
                  <span className="font-medium">{plot.area} m²</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Proposed Owner</span>
                  <span className="font-bold text-[var(--terra-navy)]">Ousmanou Bello</span>
                </div>
              </div>
            </div>

            {/* Right Column: Verification Status */}
            <div className="space-y-4">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Pre-Approval Checklist
                </div>
                <ul className="space-y-2">
                  {[
                    "Notary Certification Verified",
                    "Public Notice Period (30 Days) Passed",
                    "No Opposition Claims Filed",
                    "On-site Inspection Completed",
                    "Blockchain Registry Hash Ready"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] text-emerald-700/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground px-1">Evidence & Docs</h4>
                <button 
                  onClick={() => handlePreview("Certified Deed of Sale.pdf")}
                  className="w-full flex items-center justify-between p-3 rounded-xl border bg-white hover:bg-emerald-50 hover:border-emerald-200 transition-all text-xs group"
                >
                  <div className="flex items-center gap-2 text-muted-foreground group-hover:text-emerald-700">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Certified Deed of Sale.pdf</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </button>
                <button 
                  onClick={() => handlePreview("Public Notice Report.pdf")}
                  className="w-full flex items-center justify-between p-3 rounded-xl border bg-white hover:bg-emerald-50 hover:border-emerald-200 transition-all text-xs group"
                >
                  <div className="flex items-center gap-2 text-muted-foreground group-hover:text-emerald-700">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Public Notice Report.pdf</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-[11px] text-amber-900/70">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p>
              <strong className="text-amber-800">Warning:</strong> Authorization of legal cancellation of existing title and issuance of new title on blockchain. This action is immutable.
            </p>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button variant="ghost" onClick={onClose} className="rounded-xl h-11">Cancel</Button>
            <Button 
              onClick={handleApprove} 
              className="flex-1 bg-[var(--terra-navy)] hover:bg-blue-900 text-white h-11 font-bold rounded-xl shadow-lg shadow-blue-500/20"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                   Confirming Registry...
                </div>
              ) : "Authorize Final Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Sub-Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <div className="bg-[#002147] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <FileCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold font-['Syne']">{previewDoc}</p>
                <p className="text-[10px] text-white/60">Digital Registry Evidence — Verifiable Hash: 0x82...f92</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(null)} className="text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div id="lro-document-viewer" className="flex-1 bg-muted p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-[750px] mx-auto bg-white shadow-lg p-12 min-h-full border border-border/50 relative">
              {/* Mock PDF Content Styling */}
              <div className="absolute top-8 right-8 opacity-10">
                <ShieldCheck className="w-32 h-32 text-gray-900" />
              </div>
              <div className="border-b-2 border-gray-900 pb-4 mb-8 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">REPUBLIQUE DU CAMEROUN</h2>
                  <p className="text-xs font-bold italic">Peace - Work - Fatherland</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold">MINISTRY OF LANDS</p>
                  <p className="text-[10px]">Registry of Fixed Property</p>
                </div>
              </div>
              
              <div className="space-y-6 text-sm text-gray-800 leading-relaxed text-justify">
                <div className="text-center py-4">
                  <h3 className="text-xl font-bold underline decoration-double underline-offset-4 uppercase">CERTIFICATE OF VERIFICATION</h3>
                </div>
                <p>
                  I, the undersigned Registry Officer for the <strong>LITTORAL REGION</strong>, hereby certify that the document titled 
                  <span className="font-bold italic"> "{previewDoc}" </span> 
                  has been duly examined and found to be in full compliance with Decree No. 2005/481 of 16 December 2005.
                </p>
                <p>
                  The subject property identified under Land Code <strong>{plot.landCode}</strong> has completed all mandatory notification periods. 
                  No opposition has been registered in the official ledger as of {new Date().toLocaleDateString()}.
                </p>
                <div className="pt-12 grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Digital Signature</p>
                    <div className="h-20 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center italic text-gray-300">
                      Officer Hash Signature
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Registry Seal</p>
                    <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 flex items-center justify-center mx-auto opacity-30">
                      <ShieldCheck className="w-12 h-12 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white border-t flex justify-end gap-3">
             <Button variant="outline" onClick={() => setPreviewDoc(null)} className="rounded-xl">Close Preview</Button>
             <Button onClick={handleFullScreen} className="bg-[var(--terra-navy)] text-white gap-2 rounded-xl">
               <ExternalLink className="w-4 h-4" /> Open Full Screen
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
