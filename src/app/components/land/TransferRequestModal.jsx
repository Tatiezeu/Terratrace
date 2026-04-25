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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Upload,
  Check,
  ShoppingBag,
  Landmark,
  Users,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { mockOfficers } from "../../../data/mockData";
import { Badge } from "../ui/badge";
import api from "../../../utils/api";

const notaryOfficers = mockOfficers.filter((o) => o.role === "Notary");

const UploadItem = ({ label, fieldKey, file, onChange, accept = ".pdf,.jpg,.jpeg,.png", multiple = false }) => {
  const files = multiple ? (Array.isArray(file) ? file : (file ? [file] : [])) : (file ? [file] : []);
  
  const handleRemove = (e, fileName) => {
    e.preventDefault();
    e.stopPropagation();
    if (multiple) {
      onChange(files.filter(f => f.name !== fileName));
    } else {
      onChange(null);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex justify-between items-center">
        <span>{label}</span>
        {multiple && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground uppercase font-bold tracking-wider">Multiple Allowed</span>}
      </Label>
      <div className="space-y-2">
        <label
          htmlFor={fieldKey}
          className={`flex flex-col gap-2 px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:bg-accent/5 ${
            files.length > 0 ? "border-[var(--terra-emerald)] bg-emerald-50/30" : "border-border hover:border-[var(--terra-navy)]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${files.length > 0 ? "bg-[var(--terra-emerald)]/10 text-[var(--terra-emerald)]" : "bg-muted text-muted-foreground"}`}>
              {files.length > 0 ? <CheckCircle2 className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {files.length > 0 ? `${files.length} Document(s) Ready` : `Select ${multiple ? 'Files' : 'Document'}`}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {files.length > 0 ? "Click to add more documents" : "PDF, JPG or PNG (Max 5MB per file)"}
              </p>
            </div>
          </div>
        </label>
        
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg border border-dashed border-border">
            {files.map((f, i) => (
              <Badge key={i} variant="secondary" className="pl-2 pr-1 py-1 gap-1 bg-white border border-border text-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all group/badge">
                <span className="truncate max-w-[120px] text-[10px] font-medium">{f.name}</span>
                <button 
                  onClick={(e) => handleRemove(e, f.name)}
                  className="p-0.5 rounded-full hover:bg-red-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      <input
        id={fieldKey}
        type="file"
        multiple={multiple}
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const selectedFiles = Array.from(e.target.files || []);
          if (multiple) {
            const currentFiles = Array.isArray(file) ? file : (file ? [file] : []);
            const newFileNames = new Set(currentFiles.map(f => f.name));
            const uniqueNewFiles = selectedFiles.filter(f => !newFileNames.has(f.name));
            onChange([...currentFiles, ...uniqueNewFiles]);
          } else {
            onChange(selectedFiles[0] || null);
          }
          // Reset input value so same file can be picked again if removed
          e.target.value = '';
        }}
      />
    </div>
  );
};

export function TransferRequestModal({ plot, open, onClose }) {
  const isDirectGrant = plot?.landType === "00050";
  const [step, setStep] = useState(0); // 0 = type, 1 = portion, 2 = upload docs, 3 = select notary, 4 = done
  const [transferType, setTransferType] = useState(null); // "purchase" | "inheritance" | "direct_grant"
  const [portionType, setPortionType] = useState("full"); // "full" | "sub"
  const [formData, setFormData] = useState({
    cniFile: null,
    deedFile: null, // This becomes an array for direct_grant
    inheritanceCertFile: null,
    notaryId: "",
    surfaceArea: "",
  });

  const reset = () => {
    setStep(0);
    setPortionType("full");
    setFormData({ cniFile: null, deedFile: null, inheritanceCertFile: null, notaryId: "", surfaceArea: "" });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    try {
        const payload = {
            plotId: plot._id,
            transferType: transferType,
            portionType: portionType,
            surfaceArea: portionType === "sub" ? formData.surfaceArea : plot.area,
            notaryId: formData.notaryId,
            documents: [
                { name: "CNI", type: "CNI", url: "mock_url" },
                { 
                    name: transferType === "purchase" ? "Deed of Sale" : transferType === "inheritance" ? "Inheritance Cert" : "Supporting Docs", 
                    type: transferType === "purchase" ? "Deed_of_Sale" : transferType === "inheritance" ? "Inheritance_Certificate" : "Direct_Grant_Docs", 
                    url: "mock_url" 
                }
            ]
        };

        const response = await api.post('/transfer/initiate', payload);

        if (response.data.success) {
            setStep(isDirectGrant ? 2 : 4);
            toast.success(isDirectGrant ? "Application submitted!" : "Transfer request submitted!");
        }
    } catch (err) {
        console.error("Transfer failed:", err);
        toast.error("Failed to submit request", {
            description: err.response?.data?.message || "Check your network"
        });
    }
  };

  const canGoNextFromStep2 =
    formData.cniFile &&
    (transferType === "purchase" ? formData.deedFile : transferType === "inheritance" ? formData.inheritanceCertFile : transferType === "direct_grant" ? (Array.isArray(formData.deedFile) ? formData.deedFile.length > 0 : formData.deedFile) : true);

  const canSubmit = isDirectGrant 
    ? formData.cniFile && (Array.isArray(formData.deedFile) ? formData.deedFile.length > 0 : formData.deedFile)
    : canGoNextFromStep2 && formData.notaryId;

  if (!plot) return null;

  const stepLabels = isDirectGrant 
    ? ["Direct Grant", "Documents", "Submission"]
    : ["Transfer Type", "Portion", "Documents", "Notary", "Submitted"];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-['Syne']">Initiate Land Transfer</DialogTitle>
          <DialogDescription className="font-mono text-[var(--terra-navy)]">
            Plot: {plot.landCode} {plot.location ? `· ${plot.location}` : ""}
          </DialogDescription>
        </DialogHeader>

        {step < (isDirectGrant ? 2 : 4) && (
          <div className="flex items-center gap-1 mb-2">
            {(isDirectGrant ? stepLabels.slice(0, 2) : stepLabels.slice(0, 4)).map((label, i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step > i
                        ? "bg-[var(--terra-emerald)] text-white"
                        : step === i
                        ? "bg-[var(--terra-navy)] text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > i ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <p className="text-[10px] mt-1 text-center text-muted-foreground font-medium">{label}</p>
                </div>
                {i < (isDirectGrant ? 1 : 3) && (
                  <div className={`h-0.5 flex-1 mb-4 transition-colors ${step > i ? "bg-[var(--terra-emerald)]" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && !isDirectGrant && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">How is this land being transferred to you?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setTransferType("purchase"); setStep(1); }}
                  className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-[var(--terra-navy)] hover:bg-[var(--terra-navy)]/5 transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-[var(--terra-navy)] transition-colors">
                    <ShoppingBag className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">Purchase</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Buying from another person</p>
                  </div>
                </button>

                <button
                  onClick={() => { setTransferType("inheritance"); setStep(1); }}
                  className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-[var(--terra-navy)] hover:bg-[var(--terra-navy)]/5 transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center group-hover:bg-[var(--terra-navy)] transition-colors">
                    <Landmark className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">Inheritance</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Succession / family transfer</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 0 && isDirectGrant && (
            <motion.div key="dg_step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Direct Grant Application</h3>
                  <p className="text-sm text-muted-foreground">You are applying for a direct grant from the State of Cameroon for this land plot.</p>
                </div>
              </div>
              <div className="bg-muted/50 p-4 rounded-xl space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Process Overview</p>
                <div className="space-y-2">
                  <div className="flex gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[var(--terra-navy)] text-white flex items-center justify-center shrink-0">1</span>
                    <span>Upload your identity and supporting documents for state review.</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[var(--terra-navy)] text-white flex items-center justify-center shrink-0">2</span>
                    <span>Submission forwarded to all Land Registry Officers for verification.</span>
                  </div>
                </div>
              </div>
              <Button onClick={() => { setTransferType("direct_grant"); setStep(1); }} className="w-full bg-[var(--terra-navy)] hover:bg-blue-900 h-12 rounded-xl text-white font-bold">
                Start Application
              </Button>
            </motion.div>
          )}

          {step === 1 && !isDirectGrant && (
            <motion.div key="step_portion" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <p className="text-sm text-muted-foreground">What portion of the land are you acquiring?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setPortionType("full"); setStep(2); }}
                  className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${portionType === "full" ? "border-[var(--terra-emerald)] bg-emerald-50/50" : "border-border hover:border-muted-foreground"}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-emerald-600 rounded-sm bg-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">Full Portion</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">The entire plot area</p>
                  </div>
                </button>

                <button
                  onClick={() => { setPortionType("sub"); setStep(2); }}
                  className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${portionType === "sub" ? "border-[var(--terra-emerald)] bg-emerald-50/50" : "border-border hover:border-muted-foreground"}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-amber-600 rounded-sm flex flex-wrap">
                      <div className="w-1/2 h-1/2 border-r border-b border-amber-600" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">Sub Portion</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Part of the land</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === (isDirectGrant ? 1 : 2) && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${transferType === "purchase" ? "bg-blue-100 text-blue-700" : transferType === "inheritance" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                  {transferType === "purchase" ? "Purchase" : transferType === "inheritance" ? "Inheritance" : "Direct Grant"}
                </div>
                <p className="text-xs text-muted-foreground">Upload the required documents</p>
              </div>

              <UploadItem
                label="Your CNI (National Identity Card)"
                fieldKey="cniFileUpload"
                file={formData.cniFile}
                onChange={(f) => setFormData({ ...formData, cniFile: f })}
              />

              {(transferType === "purchase" || transferType === "direct_grant") && (
                <UploadItem
                  label={transferType === "direct_grant" ? "Supporting Documents (Application letter, etc.)" : "Deed of Sale (Certified copy)"}
                  fieldKey="deedFileUpload"
                  file={formData.deedFile}
                  onChange={(f) => setFormData({ ...formData, deedFile: f })}
                  accept=".pdf"
                  multiple={transferType === "direct_grant"}
                />
              )}

              {transferType === "inheritance" && (
                <UploadItem
                  label="Inheritance Certificate"
                  fieldKey="inheritFileUpload"
                  file={formData.inheritanceCertFile}
                  onChange={(f) => setFormData({ ...formData, inheritanceCertFile: f })}
                  accept=".pdf"
                />
              )}

              {portionType === "sub" && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="surfaceArea">Desired Surface Area (m²)</Label>
                  <Input 
                    id="surfaceArea" 
                    type="number" 
                    placeholder="Enter area..." 
                    value={formData.surfaceArea}
                    onChange={(e) => setFormData({ ...formData, surfaceArea: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground">Note: Area cannot exceed total plot area ({plot.area}m²)</p>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg p-3">
                All documents must be clear, legible scans. Blurry or incomplete documents will be rejected.
              </p>
            </motion.div>
          )}

          {step === 3 && !isDirectGrant && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {transferType === "purchase"
                    ? "Select the Notary who certified your Deed of Sale"
                    : "Select the Notary in charge of this succession"}
                </Label>
                <Select value={formData.notaryId} onValueChange={(v) => setFormData({ ...formData, notaryId: v })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose a notary officer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {notaryOfficers.map((notary) => (
                      <SelectItem key={notary.id} value={notary.id}>
                        <span className="font-semibold">{notary.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">· {notary.matricule} · {notary.jurisdiction}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Your request and uploaded documents will be sent to this notary for verification within 3 business days.
                </p>
              </div>
            </motion.div>
          )}

          {step === (isDirectGrant ? 2 : 4) && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8 text-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-['Syne'] text-[var(--terra-navy)]">
                  {isDirectGrant ? "Application Forwarded!" : "Request Submitted!"}
                </h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                  {isDirectGrant 
                    ? `Your Direct Grant application for ${plot.landCode} has been forwarded to all Land Registry Officers for collective verification.`
                    : `Your transfer request for ${plot.landCode} has been forwarded to the selected Notary Officer for verification.`}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left w-full text-xs text-blue-700 space-y-1">
                <p className="font-bold text-blue-800">What happens next?</p>
                {isDirectGrant ? (
                  <>
                    <p>① Registry Officers verify your eligibility and documents</p>
                    <p>② Inspection of the plot by regional LRO</p>
                    <p>③ Publication of public notice for any opposition</p>
                    <p>④ Grant approval and issuance of new Titre Foncier</p>
                  </>
                ) : (
                  <>
                    <p>① Notary reviews your documents (up to 3 business days)</p>
                    <p>② Notary initiates the application and requests processing fee</p>
                    <p>③ LRO conducts on-site visit and publishes 30-day public notice</p>
                    <p>④ If no opposition: new titre foncier is issued</p>
                  </>
                )}
              </div>
              <Button onClick={handleClose} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white gap-2 mt-2 w-full">
                Done <CheckCircle2 className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {step < (isDirectGrant ? 2 : 4) && (
          <DialogFooter className="flex gap-2 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step === 1 && !isDirectGrant && (
              <Button
                onClick={() => setStep(2)}
                className="bg-[var(--terra-navy)] hover:bg-navy-800 text-white gap-2 flex-1"
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            {step === (isDirectGrant ? 1 : 2) && (
              <Button
                onClick={() => isDirectGrant ? handleSubmit() : setStep(3)}
                disabled={isDirectGrant ? !(formData.cniFile && (Array.isArray(formData.deedFile) ? formData.deedFile.length > 0 : formData.deedFile)) : !canGoNextFromStep2}
                className="bg-[var(--terra-navy)] hover:bg-navy-800 text-white gap-2 flex-1"
              >
                {isDirectGrant ? "Submit Application" : "Next"} <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            {step === 3 && !isDirectGrant && (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white gap-2 flex-1"
              >
                Confirm &amp; Submit <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
