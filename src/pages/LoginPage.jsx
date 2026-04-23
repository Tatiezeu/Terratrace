import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2,
  Globe,
  Database,
  Users
} from "lucide-react";
import Logo from "../app/components/shared/Logo";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call for credentials check
    setTimeout(() => {
      setLoading(false);
      toast.info("Step 1 Complete", {
        description: "Credentials verified. Please complete Two-Factor Authentication.",
      });
      navigate("/verify-email?reason=2fa");
    }, 1500);
  };

  const features = [
    {
      icon: <Globe className="w-5 h-5 text-emerald-400" />,
      title: "Immutable Registry",
      desc: "Powered by blockchain technology to ensure land records cannot be tampered with."
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      title: "Verifiable Verification",
      desc: "Every deed is digitally signed by certified Notary Officers for ultimate trust."
    },
    {
      icon: <Database className="w-5 h-5 text-emerald-400" />,
      title: "Real-time Monitoring",
      desc: "Track the status of your land transfers in real-time with full transparency."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-['Montserrat']">
      <div className="max-w-5xl w-full flex flex-col md:flex-row gap-0 overflow-hidden rounded-[2rem] shadow-2xl bg-white border border-gray-100">
        
        {/* Left Card: Information */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 bg-[#002147] p-12 text-white relative overflow-hidden flex flex-col justify-between"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative z-10">
            <Logo variant="dark" className="h-14 mb-16" />
            
            <h2 className="text-4xl font-bold font-['Syne'] leading-tight mb-8">
              Securing Cameroon's <br />
              <span className="text-[#D4AF37]">Land Registry</span> Future.
            </h2>

            <div className="space-y-8 mt-12">
              {features.map((f, i) => (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                  key={i} 
                  className="flex gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                    {f.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">{f.title}</h4>
                    <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-12 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-white/40 uppercase tracking-[0.2em] font-bold">
            <span>© 2026 TERRATRACE</span>
            <span>powered by MINDCAF</span>
          </div>
        </motion.div>

        {/* Right Card: Login Form */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 p-12 md:p-20 bg-white"
        >
          <div className="max-w-md mx-auto">
            <div className="mb-12 text-center md:text-left">
               <div className="md:hidden flex justify-center mb-8">
                 <Logo variant="light" className="h-10" />
               </div>
               <h3 className="text-3xl font-black text-[#002147] font-['Syne']">Portal Login</h3>
               <p className="text-muted-foreground mt-2 font-medium">Enterprise Access for Officers & Clients</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-[#002147] uppercase tracking-widest opacity-60">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="officer@registry.cm" 
                    className="pl-12 h-14 bg-gray-50 border-gray-100 focus:bg-white focus:ring-emerald-500 rounded-2xl transition-all font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="password" className="text-xs font-bold text-[#002147] uppercase tracking-widest opacity-60">Password</Label>
                  <button type="button" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Forgot?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-12 pr-12 h-14 bg-gray-50 border-gray-100 focus:bg-white focus:ring-emerald-500 rounded-2xl transition-all font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 px-1 py-2">
                <input type="checkbox" id="remember" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                <label htmlFor="remember" className="text-sm text-gray-600 font-medium cursor-pointer">Remember this device</label>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-[#002147] hover:bg-blue-900 text-white rounded-2xl text-lg font-bold shadow-xl shadow-blue-900/10 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Protected Portal</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm font-medium">
                New to TerraTrace? <Link to="/register" className="text-emerald-600 font-bold hover:underline">Apply for an Account</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
