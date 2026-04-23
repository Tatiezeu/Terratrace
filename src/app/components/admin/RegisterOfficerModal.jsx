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

export function RegisterOfficerModal({
  open,
  onClose,
  officerType,
}) {
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

  const handleSubmit = () => {
    const prefix = officerType === "lro" ? "CM" : "CH";
    const fullMatricule = `${prefix}${formData.matricule}`;

    toast.success(
      `${officerType === "lro" ? "LRO" : "Notary"} Officer Registered!`,
      {
        description: `${formData.firstName} ${formData.lastName} (${fullMatricule}) has been added to the system.`,
      }
    );

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
              <div className="px-3 py-2 bg-muted border border-border rounded-lg text-sm font-mono">
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
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Set temporary password"
            />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[var(--terra-emerald)] hover:bg-emerald-600"
          >
            Register Officer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
