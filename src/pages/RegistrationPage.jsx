import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Users
} from "lucide-react";
import Logo from "../app/components/shared/Logo";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../app/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../app/components/ui/avatar";
import { toast } from "sonner";

export default function RegistrationPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const getPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length > 6) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
    return strength;
  };

  const getStrengthColor = (strength) => {
    if (strength <= 25) return "bg-red-500";
    if (strength <= 50) return "bg-orange-500";
    if (strength <= 75) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const strength = getPasswordStrength(password);
  const confirmStrength = getPasswordStrength(confirmPassword);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match", {
        description: "Please ensure both password fields are identical.",
      });
      return;
    }

    if (strength < 50) {
      toast.error("Password is too weak", {
        description: "Please use a stronger password with symbols and numbers.",
      });
      return;
    }

    setLoading(true);
    
    // Simulate API call to send verification email
    setTimeout(() => {
      setLoading(false);
      toast.info("Verification Code Sent", {
        description: "Please check your email for the 6-digit code.",
      });
      navigate("/verify-email");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12 px-6 font-['Montserrat']">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <Link to="/">
          <Logo variant="light" className="h-12" />
        </Link>
      </motion.div>

      <div className="max-w-3xl w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden mb-12">
        <div className="bg-[#002147] p-8 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-['Syne']">Join TerraTrace</h2>
            <p className="text-white/60 text-sm mt-1 font-medium italic">Create your secure land registry account</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="p-10">
          <form onSubmit={handleSignup} className="space-y-8">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center mb-8">
               <div className="relative group">
                 <Avatar className="w-28 h-28 ring-4 ring-gray-50 transition-all group-hover:ring-emerald-500/20">
                   <AvatarImage src={profilePic} />
                   <AvatarFallback className="bg-gray-100 text-gray-400">
                     <User className="w-10 h-10" />
                   </AvatarFallback>
                 </Avatar>
                 <button 
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className="absolute bottom-0 right-0 p-2 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-colors"
                 >
                   <Camera className="w-4 h-4" />
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleImageChange} 
                   className="hidden" 
                   accept="image/*" 
                 />
               </div>
               <p className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-widest">Profile Picture</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#002147] uppercase tracking-widest opacity-60 ml-1">First Name</Label>
                <Input placeholder="John" className="h-12 rounded-xl bg-gray-50 border-gray-100 font-medium" required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#002147] uppercase tracking-widest opacity-60 ml-1">Last Name</Label>
                <Input placeholder="Doe" className="h-12 rounded-xl bg-gray-50 border-gray-100 font-medium" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#002147] uppercase tracking-widest opacity-60 ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input type="email" placeholder="john.doe@example.cm" className="pl-11 h-12 rounded-xl bg-gray-50 border-gray-100 font-medium" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#002147] uppercase tracking-widest opacity-60 ml-1">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="+237 6XX XXX XXX" className="pl-11 h-12 rounded-xl bg-gray-50 border-gray-100 font-medium" required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#002147] uppercase tracking-widest opacity-60 ml-1">Gender</Label>
                <Select required>
                  <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-gray-100 font-medium">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#002147] uppercase tracking-widest opacity-60 ml-1">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input type="date" className="pl-11 h-12 rounded-xl bg-gray-50 border-gray-100 font-medium" required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#002147] uppercase tracking-widest opacity-60 ml-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    type={showPass ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-11 pr-11 h-12 rounded-xl bg-gray-50 border-gray-100 font-medium" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="px-1 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                       <span>Strength</span>
                       <span className={strength > 75 ? "text-emerald-500" : ""}>{strength}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${strength}%` }}
                        className={`h-full ${getStrengthColor(strength)} transition-all duration-500`}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#002147] uppercase tracking-widest opacity-60 ml-1">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    type={showConfirmPass ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-11 pr-11 h-12 rounded-xl bg-gray-50 border-gray-100 font-medium" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="px-1 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                       <span>Conformity</span>
                       <span className={password === confirmPassword && password.length > 0 ? "text-emerald-500" : "text-red-400"}>
                         {password === confirmPassword ? "MATCHED" : "MISMATCH"}
                       </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: password === confirmPassword ? "100%" : "30%" }}
                        className={`h-full ${password === confirmPassword ? "bg-emerald-500" : "bg-red-400"} transition-all duration-300`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 bg-[#002147] hover:bg-blue-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-900/10 transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Secure Account</span>
                    <ShieldCheck className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">
            By signing up, you agree to the <strong>MINDCAF</strong> land registry security protocols and data management terms.
          </p>
        </div>
      </div>
      
      <p className="text-sm font-medium text-gray-500">
        Already have an account? <Link to="/login" className="text-emerald-600 font-bold hover:underline">Sign In</Link>
      </p>
    </div>
  );
}
