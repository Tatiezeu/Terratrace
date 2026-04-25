import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Eye, EyeOff, Camera, MapPin, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
import { toast } from "sonner";
import api from "../../../utils/api";
import { mockOfficers } from "../../../data/mockData";

export function RegisterLandownerModal({ open, onClose }) {
  const [formData, setFormData] = useState({
    // Land Section
    landType: "",
    region: "",
    plotSize: "",
    matterportId: "",
    landStatus: "Clear",
    assignedNotary: "",
    plotNumber: "",
    // Owner Section
    fullName: "",
    cni: "",
    phone: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const notaries = mockOfficers.filter(off => off.role === "Notary");

  const regions = [
    { name: "Adamaoua", code: "01" },
    { name: "Centre", code: "02" },
    { name: "East", code: "03" },
    { name: "Far North", code: "04" },
    { name: "Littoral", code: "05" },
    { name: "North", code: "06" },
    { name: "North West", code: "07" },
    { name: "West", code: "08" },
    { name: "South", code: "09" },
    { name: "South West", code: "10" },
  ];

  const generateLandCode = () => {
    const typeCode = formData.landType === "private" ? "10005" : "00050";
    const regionObj = regions.find(r => r.name === formData.region);
    const regionCode = regionObj ? regionObj.code : "00";
    const ownerId = formData.landType === "public" ? "00000" : (formData.cni.slice(-5).padStart(5, "0"));
    const plotNum = formData.plotNumber;

    return `${typeCode}-${regionCode}-${ownerId}-${plotNum}`;
  };

  const handleSubmit = async () => {
    const landCode = generateLandCode();
    
    try {
        const formDataToSend = new FormData();
        
        // Land Data
        formDataToSend.append('landType', formData.landType === 'private' ? '10005' : '00050');
        const regionObj = regions.find(r => r.name === formData.region);
        formDataToSend.append('regionCode', regionObj ? regionObj.code : '05');
        formDataToSend.append('plotNumber', formData.plotNumber);
        formDataToSend.append('area', formData.plotSize);
        formDataToSend.append('matterportId', formData.matterportId);
        
        // Owner Data
        const nameParts = formData.fullName.split(' ');
        formDataToSend.append('ownerFirstName', nameParts[0] || '');
        formDataToSend.append('ownerLastName', nameParts.slice(1).join(' ') || '');
        formDataToSend.append('ownerEmail', formData.email);
        formDataToSend.append('ownerPhone', formData.phone);
        formDataToSend.append('ownerCNI', formData.cni);
        formDataToSend.append('ownerPassword', formData.password);
        
        if (coverImage) {
            formDataToSend.append('coverImage', coverImage);
        }

        const response = await api.post('/land/register-all', formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
            toast.success("Landowner & Plot registered successfully!", {
                description: `Generated Land Code: ${landCode}`,
            });
            onClose();
            setFormData({
              landType: "",
              region: "",
              plotSize: "",
              matterportId: "",
              landStatus: "Clear",
              assignedNotary: "",
              plotNumber: "",
              fullName: "",
              cni: "",
              phone: "",
              email: "",
              password: "",
            });
            setCoverImage(null);
            setPreviewUrl(null);
        }
    } catch (err) {
        console.error("Registration failed:", err);
        toast.error("Registration failed", {
            description: err.response?.data?.message || "Check your network"
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-['Syne']">
            Register New Landowner & Plot
          </DialogTitle>
          <DialogDescription>
            Enter land details and owner information to generate a unique Land Code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Land Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-2 text-[var(--terra-navy)]">Land Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="landType">Land Type</Label>
                <Select 
                  onValueChange={(value) => {
                    const updates = { landType: value };
                    if (value === "public") {
                      updates.fullName = "Government of Cameroon";
                      updates.cni = "000000000";
                      updates.phone = "+237 000 000 000";
                      updates.email = "registry@state.cm";
                      updates.password = "StateLand2024!";
                      updates.landStatus = "Flagged";
                    }
                    setFormData({ ...formData, ...updates });
                  }}
                  value={formData.landType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public (State Land)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select 
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                  value={formData.region}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.code} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plotSize">Plot Size (m²)</Label>
                <Input
                  id="plotSize"
                  type="number"
                  value={formData.plotSize}
                  onChange={(e) => setFormData({ ...formData, plotSize: e.target.value })}
                  placeholder="e.g. 500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="matterportId">GPS Coordinates (Matterport ID)</Label>
                <Input
                  id="matterportId"
                  value={formData.matterportId}
                  onChange={(e) => setFormData({ ...formData, matterportId: e.target.value })}
                  placeholder="Matterport ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landStatus">Land Status</Label>
                <Select 
                  onValueChange={(value) => setFormData({ ...formData, landStatus: value })}
                  value={formData.landStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clear">Clear</SelectItem>
                    <SelectItem value="Under Transfer">Under Transfer</SelectItem>
                    <SelectItem value="Disputed">Disputed</SelectItem>
                    <SelectItem value="Flagged">Flagged</SelectItem>
                    <SelectItem value="Transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.landType !== "public" && (
                <div className="space-y-2">
                  <Label htmlFor="notary">Assigned Notary</Label>
                  <Select 
                    onValueChange={(value) => setFormData({ ...formData, assignedNotary: value })}
                    value={formData.assignedNotary}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select notary" />
                    </SelectTrigger>
                    <SelectContent>
                      {notaries.map((n) => (
                        <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.landType !== "public" && (
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="plotNumber">Plot Number (Official No.)</Label>
                  <Input
                    id="plotNumber"
                    value={formData.plotNumber}
                    onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                    placeholder="Official number"
                  />
                </div>
              )}

              <div className="space-y-2 md:col-span-1">
                <Label>Cover Page (Images Only)</Label>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-muted border border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                    {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <Input 
                    type="file" accept="image/*" 
                    className="h-11 pt-2" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setCoverImage(file);
                      if (file) setPreviewUrl(URL.createObjectURL(file));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Owner Section */}
          {formData.landType !== "public" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b pb-2 text-[var(--terra-navy)]">Owner Section</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Full name as on CNI"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cni">CNI Number</Label>
                  <Input
                    id="cni"
                    value={formData.cni}
                    onChange={(e) => setFormData({ ...formData, cni: e.target.value })}
                    placeholder="National ID Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Set account password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[var(--terra-emerald)] hover:bg-emerald-600"
          >
            Validate & Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
