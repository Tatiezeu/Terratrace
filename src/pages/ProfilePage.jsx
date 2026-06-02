import { useState, useRef, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Lock,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../app/components/ui/avatar";
import { Badge } from "../app/components/ui/badge";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import { toast } from "sonner";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { SpinnerLoader } from "../app/components/shared/SpinnerLoader";
import { useProfile, useUpdateProfile } from "../hooks/useProfile";
import { logActivity } from "../utils/logger";

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [profilePic, setProfilePic] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=John");

  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    cniNumber: "",
    status: "active"
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { data: serverUser, isLoading: pageLoading, error: fetchError } = useProfile();
  const { mutateAsync: updateProfile, isPending: loading, error: mutationError } = useUpdateProfile();

  useEffect(() => {
    if (serverUser) {
      setUserData(serverUser);
      if (serverUser.profilePic) {
        if (serverUser.profilePic === 'default-profile.png') {
          setProfilePic('http://localhost:5001/assets/default-profile.png');
        } else {
          const isAbsolute = serverUser.profilePic.startsWith('http') || serverUser.profilePic.startsWith('data:');
          let avatarUrl = isAbsolute ? serverUser.profilePic : `http://localhost:5001/${serverUser.profilePic.startsWith('/') ? serverUser.profilePic.substring(1) : serverUser.profilePic}`;
          
          // Dynamically apply Cloudinary cropping transformations c_thumb, g_face, w_200, h_200
          if (avatarUrl.includes("cloudinary.com") && avatarUrl.includes("/image/upload/")) {
            avatarUrl = avatarUrl.replace("/image/upload/", "/image/upload/c_thumb,g_face,w_200,h_200/");
          }
          setProfilePic(avatarUrl);
        }
      }
    }
  }, [serverUser]);

  const [passLoading, setPassLoading] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Preview instantly
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);

      // 2. Upload and save to database instantly
      const toastId = toast.loading("Saving and uploading new profile image...");
      try {
        const result = await updateProfile({
          userData: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            profilePic: serverUser?.profilePic
          },
          selectedFile: file
        });

        if (result) {
          toast.success("Profile picture updated and saved successfully!", { id: toastId });
          logActivity('Update', 'User updated profile avatar image');
          // Dispatch custom event to notify AppLayout / TopNav to fetch user data immediately
          window.dispatchEvent(new CustomEvent('auth-update'));
        }
      } catch (err) {
        console.error("Instant profile pic save failed:", err);
        toast.error(`Failed to save profile picture: ${err.message}`, { id: toastId });
      }
    }
  };

  const handleSave = async () => {
    try {
      const result = await updateProfile({
        userData: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          profilePic: serverUser?.profilePic
        },
        selectedFile: null
      });

      if (result) {
        toast.success("Profile information updated successfully!");
        logActivity('Update', 'User updated profile information');
        // Dispatch custom event to sync navbar/sidebar immediately
        window.dispatchEvent(new CustomEvent('auth-update'));
      }
    } catch (err) {
      console.error("Profile update failed:", err);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      return toast.error("Passwords do not match");
    }

    setPassLoading(true);
    try {
      const response = await api.patch('/users/update-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      if (response.data.success) {
        toast.success("Password updated successfully!");
        logActivity('Update', 'User updated account password');
        setPasswords({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      }
    } catch (err) {
      toast.error("Failed to update password", {
        description: err.response?.data?.message || "Invalid current password."
      });
    } finally {
      setPassLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <SpinnerLoader className="scale-150" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 overflow-y-auto h-full pr-6 dark:bg-[#002147] dark:text-gray-100 p-6 transition-colors">
      <div className="border-b border-white/10 pb-8">
        <h1 className="text-3xl font-bold font-['Syne'] text-[#002147] dark:text-[var(--terra-emerald)]">Profile Settings</h1>
        <p className="text-muted-foreground mt-1 dark:text-gray-400 italic">Manage your personal information and account security.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 w-[70vw] max-w-none">
        {/* Personal Info Card */}
        <Card className="border-none shadow-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold font-['Syne'] flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--terra-emerald)]" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {mutationError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
                <span>⚠ Error saving changes: {mutationError.message || "Please check connection and try again."}</span>
              </div>
            )}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 ring-4 ring-[var(--terra-emerald)]/20 transition-all group-hover:ring-[var(--terra-emerald)]/40">
                  <AvatarImage src={profilePic} />
                  <AvatarFallback className="text-2xl font-bold bg-[var(--terra-navy)] text-white">
                    {userData.firstName && userData.lastName ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase() : "TT"}
                  </AvatarFallback>
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
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={userData.firstName} onChange={(e) => setUserData({...userData, firstName: e.target.value})} className="h-11 bg-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={userData.lastName} onChange={(e) => setUserData({...userData, lastName: e.target.value})} className="h-11 bg-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={userData.email} disabled className="h-11 bg-gray-50 rounded-xl opacity-70 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={userData.phone} onChange={(e) => setUserData({...userData, phone: e.target.value})} className="h-11 bg-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cniNumber">CNI Number</Label>
                <Input id="cniNumber" value={userData.cniNumber} disabled className="h-11 bg-gray-50 rounded-xl opacity-70 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">User Role</Label>
                <Input id="role" value={userData.role} disabled className="h-11 bg-gray-50 rounded-xl opacity-70 cursor-not-allowed" />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave} disabled={loading} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 px-8 text-white h-11 rounded-xl shadow-lg shadow-emerald-500/10">
                {loading ? "Saving & Uploading..." : "Save Changes"}
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
                {userData.status}
              </Badge>
            </div>

            <div className="pt-6 border-t border-border space-y-4">
              <p className="font-bold font-['Syne'] text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-[var(--terra-emerald)]" />
                Change Password
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Old Password</Label>
                  <div className="relative">
                    <Input 
                      id="oldPassword" 
                      type={showOldPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="h-10 bg-white rounded-xl pr-10" 
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="newPassword" 
                      type={showNewPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="h-10 bg-white rounded-xl pr-10" 
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirmNewPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="h-10 bg-white rounded-xl pr-10" 
                      value={passwords.confirmNewPassword}
                      onChange={(e) => setPasswords({...passwords, confirmNewPassword: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleUpdatePassword}
                  disabled={passLoading}
                  className="bg-[var(--terra-navy)] hover:bg-[#003d7a] text-white px-6 h-10 rounded-xl"
                >
                  {passLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
