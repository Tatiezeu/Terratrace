import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Eye, EyeOff, Camera, MapPin, FileText, CheckCircle2, User } from "lucide-react";
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
import { Checkbox } from "../ui/checkbox";
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
    landStatus: "Cleared",
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
  const [existingOwners, setExistingOwners] = useState([]);
  const [notaries, setNotaries] = useState([]);
  const [useExistingOwner, setUseExistingOwner] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");

  useEffect(() => {
    if (open) {
      api.get('/users')
        .then(res => {
          if (res.data.success) {
            setExistingOwners(res.data.data.filter(u => u.role === 'Landowner'));
            setNotaries(res.data.data.filter(u => u.role === 'Notary'));
          }
        })
        .catch(err => console.error("Failed to fetch owners/notaries"));
    }
  }, [open]);

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
    
    let ownerIdSegment = "00000";
    if (formData.landType === "private") {
      if (useExistingOwner) {
        const owner = existingOwners.find(o => o._id === selectedOwnerId);
        ownerIdSegment = owner?.cniNumber?.slice(-5).padStart(5, "0") || "00000";
      } else {
        ownerIdSegment = formData.cni.slice(-5).padStart(5, "0");
      }
    }
    
    const plotNum = formData.plotNumber;
    return `${typeCode}-${regionCode}-${ownerIdSegment}-${plotNum}`;
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
        formDataToSend.append('status', formData.landStatus.toLowerCase());

        if (useExistingOwner && selectedOwnerId) {
            formDataToSend.append('ownerId', selectedOwnerId);
        } else {
            // New Owner Data
            const nameParts = formData.fullName.split(' ');
            formDataToSend.append('ownerFirstName', nameParts[0] || '');
            formDataToSend.append('ownerLastName', nameParts.slice(1).join(' ') || '');
            formDataToSend.append('ownerEmail', formData.email);
            formDataToSend.append('ownerPhone', formData.phone);
            formDataToSend.append('ownerCNI', formData.cni);
            formDataToSend.append('ownerPassword', formData.password);
        }
        
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
            setUseExistingOwner(false);
            setSelectedOwnerId("");
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
                    <SelectItem value="Cleared">Cleared</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                    <SelectItem value="Under_Review">Under Review</SelectItem>
                    <SelectItem value="Flagged">Flagged</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
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
                        <SelectItem key={n._id} value={n._id}>
                          {n.firstName} {n.lastName}
                        </SelectItem>
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
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-bold text-[var(--terra-navy)]">Owner Section</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="existingOwner" 
                    checked={useExistingOwner} 
                    onCheckedChange={(checked) => setUseExistingOwner(!!checked)}
                  />
                  <Label htmlFor="existingOwner" className="text-xs font-medium cursor-pointer">Owner already exists</Label>
                </div>
              </div>

              {useExistingOwner ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label htmlFor="ownerSelect">Select Existing Landowner</Label>
                    <Select onValueChange={setSelectedOwnerId} value={selectedOwnerId}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Search or select landowner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {existingOwners.map((owner) => (
                          <SelectItem key={owner._id} value={owner._id}>
                            <div className="flex flex-col">
                              <span className="font-bold">{owner.firstName} {owner.lastName}</span>
                              <span className="text-[10px] text-muted-foreground">CNI: {owner.cniNumber} | {owner.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedOwnerId && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-900">
                          {existingOwners.find(o => o._id === selectedOwnerId)?.firstName} {existingOwners.find(o => o._id === selectedOwnerId)?.lastName}
                        </p>
                        <p className="text-[10px] text-emerald-700">Verified Landowner Profile Selected</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
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
              )}
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
