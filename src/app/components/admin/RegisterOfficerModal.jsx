import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import api from "../../../utils/api";
import { useQueryClient } from "@tanstack/react-query";

export function RegisterOfficerModal({
  open,
  onClose,
  officerType,
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    matricule: "",
    region: "",
    jurisdiction: "",
    phone: "",
    password: "",
    email: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Conformity validation patterns
  const matriculePattern = /^\d{5}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\+?[0-9\s-]{9,15}$/;

  const conformity = {
    names: formData.firstName.trim().length >= 2 && formData.lastName.trim().length >= 2,
    matricule: matriculePattern.test(formData.matricule),
    email: emailPattern.test(formData.email),
    phone: phonePattern.test(formData.phone),
    password: formData.password.length >= 6 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password),
    assignment: officerType === "lro" ? !!formData.region : !!formData.jurisdiction
  };

  const isConformed = Object.values(conformity).every(Boolean);

  const handleSubmit = async () => {
    if (!isConformed) {
      toast.error("Conformity Check Failed", {
        description: "Please ensure all credentials and assignments pass the conformity check."
      });
      return;
    }
    try {
        const prefix = officerType === "lro" ? "CM" : "CH";
        const fullMatricule = `${prefix}${formData.matricule}`;
        const finalRole = officerType === "lro" ? "LRO" : "Notary";

        const response = await api.post('/users/register-officer', {
            ...formData,
            role: finalRole,
            matricule: fullMatricule,
            jurisdiction: officerType === "lro" ? formData.region : formData.jurisdiction
        });

        if (response.data.success) {
            toast.success(
              `${finalRole} Officer Registered!`,
              {
                description: `${formData.firstName} ${formData.lastName} (${fullMatricule}) has been added to the system.`,
              }
            );

            queryClient.invalidateQueries({ queryKey: ['users', 'all'] });
            onClose();
            setFormData({
              firstName: "",
              lastName: "",
              matricule: "",
              region: "",
              jurisdiction: "",
              phone: "",
              password: "",
              email: "",
            });
            
            // Refresh parent data if needed
            if (window.refreshOfficerList) {
                window.refreshOfficerList();
            }
        }
    } catch (err) {
        console.error("Officer registration failed:", err);
        toast.error("Registration failed", {
            description: err.response?.data?.message || "Internal server error"
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-['Syne']">
            Register {officerType === "lro" ? "LRO" : "Notary"} Officer
          </DialogTitle>
          <DialogDescription>
            Add a new {officerType === "lro" ? "Land Registry" : "Notary"} officer
            to the system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="Enter first name"
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="matricule">
              {officerType === "lro"
                ? "Matricule Number (CM + 5 digits)"
                : "Chamber Registration (CH + 5 digits)"}
            </Label>
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-sm font-mono font-bold">
                {officerType === "lro" ? "CM" : "CH"}
              </div>
              <Input
                id="matricule"
                value={formData.matricule}
                onChange={(e) =>
                  setFormData({ ...formData, matricule: e.target.value })
                }
                placeholder="12345"
                maxLength={5}
                className="flex-1"
              />
            </div>
          </div>

          {officerType === "lro" ? (
            <div>
              <Label htmlFor="region">Assigned Region</Label>
              <Select
                value={formData.region}
                onValueChange={(value) =>
                  setFormData({ ...formData, region: value })
                }
              >
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Littoral">Littoral</SelectItem>
                  <SelectItem value="Centre">Centre</SelectItem>
                  <SelectItem value="West">West</SelectItem>
                  <SelectItem value="North">North</SelectItem>
                  <SelectItem value="Northwest">Northwest</SelectItem>
                  <SelectItem value="Southwest">Southwest</SelectItem>
                  <SelectItem value="East">East</SelectItem>
                  <SelectItem value="South">South</SelectItem>
                  <SelectItem value="Adamawa">Adamawa</SelectItem>
                  <SelectItem value="Far North">Far North</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Select
                value={formData.jurisdiction}
                onValueChange={(value) =>
                  setFormData({ ...formData, jurisdiction: value })
                }
              >
                <SelectTrigger id="jurisdiction">
                  <SelectValue placeholder="Select jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Douala">Douala</SelectItem>
                  <SelectItem value="Yaoundé">Yaoundé</SelectItem>
                  <SelectItem value="Bafoussam">Bafoussam</SelectItem>
                  <SelectItem value="Garoua">Garoua</SelectItem>
                  <SelectItem value="Bamenda">Bamenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+237 6XX XXX XXX"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Set temporary password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@terratrace.cm"
            />
          </div>

          {/* Conformity Check Status Widget */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-white/10">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conformity Check</span>
              <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                isConformed 
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400" 
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
              }`}>
                {isConformed ? "PASSED" : "PENDING"}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white transition-colors duration-300 ${conformity.names ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                  ✓
                </div>
                <span>Name Validity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white transition-colors duration-300 ${conformity.matricule ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                  ✓
                </div>
                <span>Matricule digits</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white transition-colors duration-300 ${conformity.email ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                  ✓
                </div>
                <span>Email format</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white transition-colors duration-300 ${conformity.phone ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                  ✓
                </div>
                <span>Phone format</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white transition-colors duration-300 ${conformity.password ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                  ✓
                </div>
                <span>Password Strength</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white transition-colors duration-300 ${conformity.assignment ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                  ✓
                </div>
                <span>{officerType === "lro" ? "Assigned Region" : "Jurisdiction"}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isConformed}
            className={`transition-colors duration-300 ${
              isConformed 
                ? "bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            }`}
          >
            Register Officer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
