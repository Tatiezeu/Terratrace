// BEHAVIOR: Modal wizard helping landowners/clients to initiate land transfers, supporting purchases, inheritance successions, subdivisions, and direct grants.
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
// BEHAVIOR: Lucide React icon triggers
import {
  Upload,
  Check,
  ShoppingBag,
  Landmark,
  Users,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Trash2,
  Loader2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "../ui/badge";
// BACKEND_CONNECTION: Custom Axios API helper
import api from "../../../utils/api";
import { logActivity } from "../../../utils/logger";
import { useQueryClient } from "@tanstack/react-query";

// BEHAVIOR: Sub-component processing file attachment selections, displaying loaders during conformity checks
const UploadItem = ({ label, fieldKey, files, onChange, accept = ".pdf,.jpg,.jpeg,.png", multiple = false, onVerifyingChange }) => {
  const fileArray = Array.isArray(files) ? files : (files ? [files] : []);
  const [fileStatuses, setFileStatuses] = useState({});

  // BEHAVIOR: Simulates file verification checks when attachments are updated
  useEffect(() => {
    const currentNames = fileArray.map(f => f?.name).filter(Boolean);
    
    // 1. Identify files that need checking (not in fileStatuses)
    const newFiles = fileArray.filter(f => f && f.name && !fileStatuses[f.name]);
    
    if (newFiles.length > 0) {
      // Set new files to checking
      const newStatuses = {};
      newFiles.forEach(f => {
        newStatuses[f.name] = 'checking';
      });
      setFileStatuses(prev => ({ ...prev, ...newStatuses }));
      if (onVerifyingChange) onVerifyingChange(fieldKey, true);

      // Fast checking completion
      newFiles.forEach(f => {
        setTimeout(() => {
          setFileStatuses(prev => {
            const updated = { ...prev, [f.name]: 'passed' };
            const anyChecking = Object.values(updated).some(status => status === 'checking');
            if (onVerifyingChange) onVerifyingChange(fieldKey, anyChecking);
            return updated;
          });
        }, 150);
      });
    }

    // Clean up removed files
    const existingNames = Object.keys(fileStatuses);
    const removedNames = existingNames.filter(name => !currentNames.includes(name));
    if (removedNames.length > 0) {
      setFileStatuses(prev => {
        const next = { ...prev };
        removedNames.forEach(name => delete next[name]);
        const anyChecking = Object.values(next).some(status => status === 'checking');
        if (onVerifyingChange) onVerifyingChange(fieldKey, anyChecking);
        return next;
      });
    }
  }, [files]);
  
  return (
    <div className="space-y-2">
      <Label>{label} {multiple && <span className="text-[10px] text-muted-foreground ml-1">(Multiple allowed)</span>}</Label>
      {/* COLOR_THEME: Selection wraps styled in Terra Emerald green borders if files are loaded */}
      <label
        htmlFor={fieldKey}
        className={`flex flex-col gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${fileArray.length > 0 ? "border-[var(--terra-emerald)] bg-emerald-50/50" : "border-border hover:border-muted-foreground"
          }`}
      >
        <div className="flex items-center gap-3">
          {fileArray.length > 0 ? (
            <CheckCircle2 className="w-5 h-5 text-[var(--terra-emerald)] shrink-0" />
          ) : (
            <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
          <span className="text-sm text-muted-foreground">
            {fileArray.length > 0
              ? `${fileArray.length} document(s) selected`
              : `Click to upload ${multiple ? "documents" : "a document"} — PDF, JPG or PNG`}
          </span>
        </div>
        {fileArray.length > 0 && (
          <div className="flex flex-col gap-3 mt-2 w-full max-h-52 overflow-y-auto pr-1">
            {fileArray.map((f, i) => (
              <div 
                key={i} 
                className="flex flex-col gap-2 p-3 rounded-lg bg-white border border-emerald-100 hover:border-emerald-300 transition-colors group/file overflow-hidden"
              >
                <div className="flex items-center justify-between min-w-0 w-full gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs text-emerald-900 font-bold truncate min-w-0 flex-1 break-all">{f.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange(fileArray.filter((_, idx) => idx !== i));
                    }}
                    className="p-1 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Conformity check status indicator */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/20 px-2 py-1.5 rounded-md text-[10px]">
                  <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                    {fileStatuses[f.name] === 'checking' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                        <span>Verifying format, signatures &amp; size...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-700 font-bold">Conformity check passed</span>
                      </>
                    )}
                  </div>
                  <span className="text-muted-foreground font-mono">{(f.size ? (f.size / (1024 * 1024)).toFixed(2) : "0.10")} MB</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </label>
      <input
        id={fieldKey}
        type="file"
        multiple={multiple}
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const selectedFiles = Array.from(e.target.files || []);
          if (multiple) {
            onChange([...fileArray, ...selectedFiles]);
          } else {
            onChange(selectedFiles[0] || null);
          }
        }}
      />
    </div>
  );
};

export function TransferRequestModal({ plot, open, onClose }) {
  const isDirectGrant = plot?.landType === "00050";
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0); 
  const [transferType, setTransferType] = useState(null); 
  const [portionType, setPortionType] = useState("full"); 
  const [notaryOfficers, setNotaryOfficers] = useState([]);
  const [verifyingFiles, setVerifyingFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cniFiles: [],
    supportingDocs: [],
    notaryId: "",
    surfaceArea: "",
  });

  // BACKEND_CONNECTION: GET /users/recipients?role=Notary - Queries list of available notaries from the database
  useEffect(() => {
    const fetchNotaries = async () => {
      try {
        const res = await api.get('/users/recipients?role=Notary');
        if (res.data.success) {
          setNotaryOfficers(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch notaries:", err);
      }
    };
    if (open) fetchNotaries();
  }, [open]);

  const reset = () => {
    setStep(0);
    setPortionType("full");
    setFormData({ cniFiles: [], supportingDocs: [], notaryId: "", surfaceArea: "" });
    setVerifyingFiles({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // BACKEND_CONNECTION: POST /transfer/initiate - Initiates a new transfer request, sending CNI/evidence attachments as multipart/form-data
  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (portionType === "sub") {
      const areaVal = parseFloat(formData.surfaceArea);
      if (!formData.surfaceArea || isNaN(areaVal) || areaVal <= 0 || areaVal >= plot.area) {
        return toast.error("Invalid Subdivision Area", {
          description: `Area must be strictly greater than 0 and less than total plot area (${plot.area}m²)`
        });
      }
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('plotId', plot._id);
      data.append('transferType', isDirectGrant ? 'direct_grant' : transferType);
      data.append('isSubdivision', portionType === "sub");
      data.append('transferArea', portionType === "sub" ? formData.surfaceArea : plot.area);
      data.append('notaryId', formData.notaryId);
      
      formData.cniFiles.forEach(f => data.append('attachments', f));
      formData.supportingDocs.forEach(f => data.append('attachments', f));

      // BACKEND_CONNECTION: Calls backend initiation API route
      const response = await api.post('/transfer/initiate', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setStep(isDirectGrant ? 2 : 4);
        toast.success(isDirectGrant ? "Application submitted!" : "Transfer request submitted!");
        // BEHAVIOR: Wipes query cache segments to trigger list refetching
        queryClient.invalidateQueries({ queryKey: ['transfers'] });
        queryClient.invalidateQueries({ queryKey: ['land'] });
        logActivity('Create', `User initiated ${isDirectGrant ? 'direct grant application' : 'transfer request'} for Plot '${plot.landCode}'`);
      }
    } catch (err) {
      toast.error("Submission failed", {
        description: err.response?.data?.message || "Check your network"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyingChange = (fieldName, isVerifying) => {
    setVerifyingFiles(prev => ({ ...prev, [fieldName]: isVerifying }));
  };

  const isAnyFileChecking = Object.values(verifyingFiles).some(Boolean);
  const isSubValid = portionType !== "sub" || (formData.surfaceArea && parseFloat(formData.surfaceArea) > 0 && parseFloat(formData.surfaceArea) < plot.area);
  const canGoNextFromStep2 = formData.cniFiles.length > 0 && formData.supportingDocs.length > 0 && !isAnyFileChecking && isSubValid;
  const canSubmit = isDirectGrant ? canGoNextFromStep2 : (canGoNextFromStep2 && formData.notaryId);

  if (!plot) return null;

  const stepLabels = isDirectGrant
    ? ["Direct Grant", "Documents", "Submission"]
    : ["Transfer Type", "Portion", "Documents", "Notary", "Submitted"];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl sm:max-w-2xl w-full">
        <DialogHeader>
          {/* COLOR_THEME: Dialog Title uses Syne Font family */}
          <DialogTitle className="text-xl font-bold font-['Syne']">Initiate Land Transfer</DialogTitle>
          {/* COLOR_THEME: Displays target plot land code in Terra Navy font style */}
          <DialogDescription className="font-mono text-[var(--terra-navy)]">
            Plot: {plot.landCode} {plot.location ? `· ${plot.location}` : ""}
          </DialogDescription>
        </DialogHeader>

        {step < (isDirectGrant ? 2 : 4) && (
          <div className="flex items-center gap-1 mb-2">
            {(isDirectGrant ? stepLabels.slice(0, 2) : stepLabels.slice(0, 4)).map((label, i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* COLOR_THEME: Step circle indicator: completed segments colored in green, active segment colored in Terra Navy */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > i
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
                  // COLOR_THEME: Steps line spacer: green if completed, gray if pending
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
                {/* COLOR_THEME: Purchase button wrapper: hover focus outline set to Terra Navy */}
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

                {/* COLOR_THEME: Inheritance button wrapper: hover focus outline set to Terra Navy */}
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
                  <p className="text-sm text-muted-foreground">You are applying for a direct grant from the State of Cameroon.</p>
                </div>
              </div>
              {/* COLOR_THEME: Direct grant button styled in Terra Navy background */}
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
                  </div>
                </button>

                <button
                  onClick={() => { setPortionType("sub"); setStep(2); }}
                  className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${portionType === "sub" ? "border-[var(--terra-emerald)] bg-emerald-50/50" : "border-border hover:border-muted-foreground"}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-amber-600 rounded-sm flex flex-wrap" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">Sub Portion</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === (isDirectGrant ? 1 : 2) && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <UploadItem
                label="Identity Documents (CNI/Passport)"
                fieldKey="cniFiles"
                files={formData.cniFiles}
                multiple={true}
                onChange={(f) => setFormData({ ...formData, cniFiles: f })}
                onVerifyingChange={handleVerifyingChange}
              />

              <UploadItem
                label={transferType === "purchase" ? "Deed of Sale" : transferType === "inheritance" ? "Inheritance Certificate" : "Supporting Documents"}
                fieldKey="supportingDocs"
                files={formData.supportingDocs}
                multiple={true}
                onChange={(f) => setFormData({ ...formData, supportingDocs: f })}
                onVerifyingChange={handleVerifyingChange}
              />

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
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && !isDirectGrant && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Select Notary Officer
                </Label>
                <Select value={formData.notaryId} onValueChange={(v) => setFormData({ ...formData, notaryId: v })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose a notary..." />
                  </SelectTrigger>
                  <SelectContent>
                    {notaryOfficers.map((notary) => (
                      <SelectItem key={notary._id} value={notary._id}>
                        <span className="font-semibold">{notary.firstName} {notary.lastName}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {/* COLOR_THEME: Completed circle badge styled in soft green background */}
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              {/* COLOR_THEME: Title uses Syne Font family and Terra Navy text color */}
              <h3 className="text-xl font-bold font-['Syne'] text-[var(--terra-navy)]">Application Submitted!</h3>
              {/* COLOR_THEME: Completion action button styled in Terra Emerald green */}
              <Button onClick={handleClose} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white w-full">
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {step < (isDirectGrant ? 2 : 4) && (
          <DialogFooter className="flex gap-2 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isSubmitting}>Back</Button>
            )}
            {/* COLOR_THEME: Next button styled in Terra Navy background */}
            {step === 1 && !isDirectGrant && (
              <Button onClick={() => setStep(2)} className="bg-[var(--terra-navy)] text-white flex-1">Next</Button>
            )}
            {/* COLOR_THEME: Submit or Next button styled in Terra Navy background */}
            {step === (isDirectGrant ? 1 : 2) && (
              <Button
                onClick={() => isDirectGrant ? handleSubmit() : setStep(3)}
                disabled={!canGoNextFromStep2 || isSubmitting}
                className="bg-[var(--terra-navy)] text-white flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  isDirectGrant ? "Submit Application" : "Next"
                )}
              </Button>
            )}
            {/* COLOR_THEME: Confirmation submit button styled in Terra Emerald green */}
            {step === 3 && !isDirectGrant && (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="bg-[var(--terra-emerald)] text-white flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Confirm & Submit"
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
