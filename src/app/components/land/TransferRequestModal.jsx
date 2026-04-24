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
  FileText,
  Check,
  ShoppingBag,
  Landmark,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { mockOfficers } from "../../../data/mockData";

const notaryOfficers = mockOfficers.filter((o) => o.role === "Notary");

const UploadItem = ({ label, fieldKey, file, onChange, accept = ".pdf,.jpg,.jpeg,.png" }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <label
      htmlFor={fieldKey}
      className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        file ? "border-[var(--terra-emerald)] bg-emerald-50/50" : "border-border hover:border-muted-foreground"
      }`}
    >
      {file ? (
        <>
          <CheckCircle2 className="w-5 h-5 text-[var(--terra-emerald)] shrink-0" />
          <span className="text-sm font-medium text-[var(--terra-emerald)] truncate">{file.name}</span>
        </>
      ) : (
        <>
          <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">Click to upload — PDF, JPG or PNG</span>
        </>
      )}
    </label>
    <input
      id={fieldKey}
      type="file"
      className="hidden"
      accept={accept}
      onChange={(e) => onChange(e.target.files?.[0] || null)}
    />
  </div>
);

export function TransferRequestModal({ plot, open, onClose }) {
  const [step, setStep] = useState(0); // 0 = choose type, 1 = upload docs, 2 = select notary, 3 = done
  const [transferType, setTransferType] = useState(null); // "purchase" | "inheritance"
  const [formData, setFormData] = useState({
    cniFile: null,
    deedFile: null,
    inheritanceCertFile: null,
    notaryId: "",
  });

  const reset = () => {
    setStep(0);
    setTransferType(null);
    setFormData({ cniFile: null, deedFile: null, inheritanceCertFile: null, notaryId: "" });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    const notary = notaryOfficers.find((o) => o.id === formData.notaryId);
    setStep(3);
    setTimeout(() => {
      toast.success("Transfer request submitted!", {
        description: `Your request for ${plot?.landCode} has been sent to ${notary?.name} for verification. Expect a response within 3 business days.`,
        duration: 6000,
      });
    }, 800);
  };

  const canGoNextFromStep1 =
    formData.cniFile &&
    (transferType === "purchase" ? formData.deedFile : formData.inheritanceCertFile);

  const canSubmit = canGoNextFromStep1 && formData.notaryId;

  if (!plot) return null;

  // Steps: 0=type, 1=docs, 2=notary, 3=success
  const stepLabels = ["Transfer Type", "Documents", "Notary", "Submitted"];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-['Syne']">Initiate Land Transfer</DialogTitle>
          <DialogDescription className="font-mono text-[var(--terra-navy)]">
            Plot: {plot.landCode} {plot.location ? `· ${plot.location}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicators */}
        {step < 3 && (
          <div className="flex items-center gap-1 mb-2">
            {stepLabels.slice(0, 3).map((label, i) => (
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
                {i < 2 && (
                  <div className={`h-0.5 flex-1 mb-4 transition-colors ${step > i ? "bg-[var(--terra-emerald)]" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 0: Choose transfer type */}
          {step === 0 && (
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

          {/* STEP 1: Upload documents */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${transferType === "purchase" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                  {transferType === "purchase" ? "Purchase" : "Inheritance"}
                </div>
                <p className="text-xs text-muted-foreground">Upload the required documents</p>
              </div>

              <UploadItem
                label="Your CNI (National Identity Card)"
                fieldKey="cniFileUpload"
                file={formData.cniFile}
                onChange={(f) => setFormData({ ...formData, cniFile: f })}
              />

              {transferType === "purchase" && (
                <UploadItem
                  label="Deed of Sale (Certified copy)"
                  fieldKey="deedFileUpload"
                  file={formData.deedFile}
                  onChange={(f) => setFormData({ ...formData, deedFile: f })}
                  accept=".pdf"
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

              <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg p-3">
                All documents must be clear, legible scans. Blurry or incomplete documents will be rejected.
              </p>
            </motion.div>
          )}

          {/* STEP 2: Select notary */}
          {step === 2 && (
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

              {/* Summary */}
              <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm border border-border">
                <p className="font-bold text-[var(--terra-navy)] mb-2">Summary</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plot</span>
                  <span className="font-mono font-bold">{plot.landCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize font-medium">{transferType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CNI</span>
                  <span className={formData.cniFile ? "text-emerald-600 font-medium" : "text-red-500"}>
                    {formData.cniFile ? `✓ ${formData.cniFile.name}` : "Missing"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{transferType === "purchase" ? "Deed of Sale" : "Inheritance Cert."}</span>
                  <span className={
                    (transferType === "purchase" ? formData.deedFile : formData.inheritanceCertFile)
                      ? "text-emerald-600 font-medium"
                      : "text-red-500"
                  }>
                    {(transferType === "purchase" ? formData.deedFile?.name : formData.inheritanceCertFile?.name) || "Missing"}
                    {(transferType === "purchase" ? formData.deedFile : formData.inheritanceCertFile) && " ✓"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
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
                <h3 className="text-xl font-bold font-['Syne'] text-[var(--terra-navy)]">Request Submitted!</h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                  Your transfer request for <strong className="font-mono">{plot.landCode}</strong> has been forwarded to the selected Notary Officer for verification.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left w-full text-xs text-blue-700 space-y-1">
                <p className="font-bold text-blue-800">What happens next?</p>
                <p>① Notary reviews your documents (up to 3 business days)</p>
                <p>② Notary initiates the application and requests processing fee</p>
                <p>③ LRO conducts on-site visit and publishes 30-day public notice</p>
                <p>④ If no opposition: new titre foncier is issued</p>
              </div>
              <Button onClick={handleClose} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white gap-2 mt-2 w-full">
                Done <CheckCircle2 className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer navigation */}
        {step < 3 && (
          <DialogFooter className="flex gap-2 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step === 1 && (
              <Button
                onClick={() => setStep(2)}
                disabled={!canGoNextFromStep1}
                className="bg-[var(--terra-navy)] hover:bg-navy-800 text-white gap-2 flex-1"
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            {step === 2 && (
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
