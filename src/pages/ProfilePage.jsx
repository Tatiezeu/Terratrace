import { useState, useRef } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Lock,
  BadgeCheck,
  Camera,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../app/components/ui/avatar";
import { Badge } from "../app/components/ui/badge";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import { toast } from "sonner";

export default function ProfilePage() {
  const fileInputRef = useRef(null);
  const [profilePic, setProfilePic] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=John");
  
  const [userData, setUserData] = useState({
    name: "John Doe",
    email: "john.doe@terratrace.cm",
    phone: "+237 600 000 000",
    role: "Property Owner",
    location: "Yaoundé, Cameroon",
    id: "TT-USR-2024-042",
    twoFactorEnabled: true,
    accountStatus: "active"
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
        toast.success("Profile picture updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    toast.success("Profile updated successfully!");
  };

  return (
    <div className="space-y-8 pb-12 overflow-y-auto h-full pr-6 dark:bg-[#002147] dark:text-gray-100 p-6 transition-colors">
      <div className="border-b border-white/10 pb-8">
        <h1 className="text-3xl font-bold font-['Syne'] text-[#002147] dark:text-[var(--terra-emerald)]">Profile Settings</h1>
        <p className="text-muted-foreground mt-1 dark:text-gray-400 italic">Manage your personal information and account security.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 max-w-4xl">
        {/* Personal Info Card */}
        <Card className="border-none shadow-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold font-['Syne'] flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--terra-emerald)]" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 ring-4 ring-[var(--terra-emerald)]/20 transition-all group-hover:ring-[var(--terra-emerald)]/40">
                  <AvatarImage src={profilePic} />
                  <AvatarFallback className="text-2xl font-bold">JD</AvatarFallback>
                </Avatar>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity"
                >
                  <Camera className="w-6 h-6" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>
              <div className="space-y-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 rounded-lg text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Photo
                </Button>
                <p className="text-[10px] text-muted-foreground">Select an image from your device</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={userData.name} onChange={(e) => setUserData({...userData, name: e.target.value})} className="h-11 bg-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} className="h-11 bg-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={userData.phone} onChange={(e) => setUserData({...userData, phone: e.target.value})} className="h-11 bg-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Region/Location</Label>
                <Input id="location" value={userData.location} onChange={(e) => setUserData({...userData, location: e.target.value})} className="h-11 bg-white rounded-xl" />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 px-8 text-white h-11 rounded-xl shadow-lg shadow-emerald-500/10">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security & Authentication Card */}
        <Card className="border-none shadow-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold font-['Syne'] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[var(--terra-emerald)]" />
              Security & Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between py-4 border-b border-border">
              <div className="space-y-1">
                <p className="font-semibold text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Secure your account with 2FA protection via Email.</p>
              </div>
              <Badge className={userData.twoFactorEnabled 
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 border-0 font-bold" 
                : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-200 border-0 font-bold"}>
                {userData.twoFactorEnabled ? "ENABLED" : "DISABLED"}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">Account Status</p>
                  <BadgeCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xs text-muted-foreground">Your identity has been verified by the National Registry.</p>
              </div>
              <Badge className="bg-emerald-500 text-white border-none px-4 py-1.5 uppercase tracking-wider text-[10px] font-bold rounded-full">
                {userData.accountStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
