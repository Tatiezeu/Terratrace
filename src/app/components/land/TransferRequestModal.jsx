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
  X
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "../ui/badge";
import api from "../../../utils/api";

const UploadItem = ({ label, fieldKey, files, onChange, accept = ".pdf,.jpg,.jpeg,.png", multiple = false }) => {
  const fileArray = Array.isArray(files) ? files : (files ? [files] : []);
  
  return (
    <div className="space-y-2">
      <Label>{label} {multiple && <span className="text-[10px] text-muted-foreground ml-1">(Multiple allowed)</span>}</Label>
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
          <div className="flex flex-wrap gap-2 mt-1">
            {fileArray.map((f, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] bg-white border border-emerald-200 text-emerald-700 truncate max-w-[150px] flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {f.name}
                <X className="w-2 h-2 cursor-pointer hover:text-red-500" onClick={(e) => {
                  e.preventDefault();
                  onChange(fileArray.filter((_, idx) => idx !== i));
                }} />
              </Badge>
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
  const [step, setStep] = useState(0); 
  const [transferType, setTransferType] = useState(null); 
  const [portionType, setPortionType] = useState("full"); 
  const [notaryOfficers, setNotaryOfficers] = useState([]);
  const [formData, setFormData] = useState({
    cniFiles: [],
    supportingDocs: [],
    notaryId: "",
    surfaceArea: "",
  });

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
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const data = new FormData();
      data.append('plotId', plot._id);
      data.append('transferType', isDirectGrant ? 'direct_grant' : transferType);
      data.append('portionType', portionType);
      data.append('surfaceArea', portionType === "sub" ? formData.surfaceArea : plot.area);
      data.append('notaryId', formData.notaryId);
      
      formData.cniFiles.forEach(f => data.append('attachments', f));
      formData.supportingDocs.forEach(f => data.append('attachments', f));

      const response = await api.post('/transfer/initiate', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setStep(isDirectGrant ? 2 : 4);
        toast.success(isDirectGrant ? "Application submitted!" : "Transfer request submitted!");
      }
    } catch (err) {
      toast.error("Submission failed", {
        description: err.response?.data?.message || "Check your network"
      });
    }
  };

  const canGoNextFromStep2 = formData.cniFiles.length > 0 && formData.supportingDocs.length > 0;
  const canSubmit = isDirectGrant ? canGoNextFromStep2 : (canGoNextFromStep2 && formData.notaryId);

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
                  <p className="text-sm text-muted-foreground">You are applying for a direct grant from the State of Cameroon.</p>
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
              />

              <UploadItem
                label={transferType === "purchase" ? "Deed of Sale" : transferType === "inheritance" ? "Inheritance Certificate" : "Supporting Documents"}
                fieldKey="supportingDocs"
                files={formData.supportingDocs}
                multiple={true}
                onChange={(f) => setFormData({ ...formData, supportingDocs: f })}
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
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold font-['Syne'] text-[var(--terra-navy)]">Application Submitted!</h3>
              <Button onClick={handleClose} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white w-full">
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {step < (isDirectGrant ? 2 : 4) && (
          <DialogFooter className="flex gap-2 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            {step === 1 && !isDirectGrant && (
              <Button onClick={() => setStep(2)} className="bg-[var(--terra-navy)] text-white flex-1">Next</Button>
            )}
            {step === (isDirectGrant ? 1 : 2) && (
              <Button
                onClick={() => isDirectGrant ? handleSubmit() : setStep(3)}
                disabled={!canGoNextFromStep2}
                className="bg-[var(--terra-navy)] text-white flex-1"
              >
                {isDirectGrant ? "Submit Application" : "Next"}
              </Button>
            )}
            {step === 3 && !isDirectGrant && (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-[var(--terra-emerald)] text-white flex-1"
              >
                Confirm &amp; Submit
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
