import { useState, useEffect, useRef } from "react";
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
import api from "../utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { setCachedData } from "../utils/cache";
import { logActivity } from "../utils/logger";
import VisualCaptchaChallenge from "../app/components/shared/VisualCaptchaChallenge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../app/components/ui/dialog";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [isCaptchaRequired] = useState(() => {
    return localStorage.getItem('recaptcha_enabled') !== 'false';
  });

  // Custom reCAPTCHA v2 States
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [captchaSolving, setCaptchaSolving] = useState(false);

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    setIsSendingForgot(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      if (response.data.success) {
        toast.success("Reset link sent!", {
          description: "Please check your inbox for password reset instructions."
        });
        setShowForgotModal(false);
        setForgotEmail("");
      }
    } catch (err) {
      toast.error("Request failed", {
        description: err.response?.data?.message || "Failed to submit password reset request."
      });
    } finally {
      setIsSendingForgot(false);
    }
  };

  // Dynamic Bundle Preloader triggered on mount
  useEffect(() => {
    const preloadTimer = setTimeout(() => {
      preloadDashboardBundles();
    }, 500);
    return () => clearTimeout(preloadTimer);
  }, []);

  const preloadDashboardBundles = () => {
    // Dynamic import calls trigger Vite's pre-fetching mechanisms
    import("../app/components/layouts/AppLayout").catch(() => null);
    import("./ClientDashboard").catch(() => null);
    import("./LandPlotsPage").catch(() => null);
    import("./MyLandPlotsPage").catch(() => null);
    import("./LRODashboard").catch(() => null);
    import("./NotaryDashboard").catch(() => null);
    import("./AdminDashboard").catch(() => null);
  };

  // TanStack Query useMutation for zero-latency authentication
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.twoFactorRequired) {
        localStorage.setItem('temp_email', email);
        toast.info("Two-Factor Authentication", {
          description: data.message || "A verification code has been sent to your email.",
        });
        navigate("/verify-email?reason=2fa");
        return;
      }

      const userData = data.data?.user || data.data;
      if (!userData) {
        throw new Error("User data missing in response");
      }

      setWelcomeName(userData.firstName || "Officer");
      setShowSuccessOverlay(true);

      // ACTION 1: Persist token and user in Zustand Store instantly
      setAuth(data.token, userData);
      logActivity('Auth', `User '${userData.firstName} ${userData.lastName}' logged in successfully`);

      // ACTION 2: Prefetch critical dashboard server-states in parallel
      const prefetchPromises = [
        queryClient.prefetchQuery({
          queryKey: ['profile'],
          queryFn: async () => {
            const res = await api.get('/users/me');
            const data = res.data.data;
            setCachedData('profile', data);
            return data;
          }
        }),
        queryClient.prefetchQuery({
          queryKey: ['transfers'],
          queryFn: async () => {
            const res = await api.get('/transfer/my-transfers');
            const data = res.data.data;
            setCachedData('transfers', data);
            return data;
          }
        }),
        queryClient.prefetchQuery({
          queryKey: ['land'],
          queryFn: async () => {
            const res = await api.get('/land');
            const data = res.data.data;
            setCachedData('land', data);
            return data;
          }
        })
      ];

      // BACKEND_CONNECTION: Prefetch admin-only configurations and user listings if user has Admin role
      if (userData.role === 'Admin') {
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: ['users', 'all'],
            queryFn: async () => {
              const res = await api.get('/users');
              const data = res.data.data;
              setCachedData('users_all', data);
              return data;
            }
          }),
          queryClient.prefetchQuery({
            queryKey: ['settings_config'],
            queryFn: async () => {
              const res = await api.get('/config');
              const data = res.data.data;
              setCachedData('settings_config', data);
              return data;
            }
          })
        );
      }

      // Execute queries in background concurrently (fire-and-forget, do not block transition)
      prefetchPromises.forEach(p => p.catch(() => null));

      // ACTION 3: Route instantly to preloaded dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000); // 1.0 second for visual overlay transitions
    },
    onError: (err) => {
      console.error("Login failure:", err);
      if (email) {
        localStorage.setItem('failed_login_email', email);
      }
      if (err.response?.status === 401 && err.response?.data?.message?.includes("not verified")) {
        localStorage.setItem('temp_email', email);
        toast.info("Verification Required", {
          description: "Please verify your email to continue.",
        });
        navigate("/verify-email");
      } else {
        toast.error("Login failed", {
          description: err.response?.data?.message || err.message || "Invalid credentials.",
        });
      }
    }
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (isCaptchaRequired && !isCaptchaVerified) {
      toast.error("Please solve the 'I'm not a robot' visual challenge.");
      return;
    }

    loginMutation.mutate({
      email,
      password
    });
  };

  const features = [
    {
      icon: <Globe className="w-5 h-5 text-emerald-400" />,
      title: "Immutable Registry",
      desc: "Powered by TerraTrace technology to ensure land records cannot be tampered with."
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-['Montserrat'] relative overflow-hidden">
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0 z-50 bg-[#002147] flex flex-col items-center justify-center text-white"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-4xl font-bold font-['Syne'] mb-4 text-center">Login Successful</h2>
              <p className="text-xl text-emerald-100/80 mb-8">Welcome back, {welcomeName}!</p>
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "linear" }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
              <p className="text-sm text-white/40 mt-4 uppercase tracking-widest font-bold">Redirecting to Dashboard...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <button type="button" onClick={() => { setForgotEmail(email || localStorage.getItem('failed_login_email') || ""); setShowForgotModal(true); }} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Forgot password?</button>
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

              {/* Custom Google-like reCAPTCHA v2 Checkbox widget */}
              {isCaptchaRequired && (
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/50 shadow-inner max-w-sm mx-auto my-6 select-none font-['Montserrat']">
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => {
                        if (!isCaptchaVerified && !captchaSolving) {
                          setCaptchaSolving(true);
                          setShowCaptchaModal(true);
                        }
                      }}
                      className={`w-7 h-7 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                        isCaptchaVerified 
                          ? "bg-emerald-500 border-emerald-600 shadow-md shadow-emerald-500/20" 
                          : "bg-white border-gray-300 hover:border-emerald-500"
                      }`}
                    >
                      {captchaSolving ? (
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      ) : isCaptchaVerified ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : null}
                    </div>
                    <span className="text-xs font-bold text-gray-700 tracking-tight">I'm not a robot</span>
                  </div>
                  
                  <div className="flex flex-col items-center shrink-0">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-6 h-6 text-emerald-500" />
                      <span className="text-[9px] font-black text-gray-500 tracking-tighter">reCAPTCHA v2</span>
                    </div>
                    <div className="flex gap-1.5 text-[8px] text-gray-400 mt-1 font-semibold">
                      <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="hover:underline">Privacy</a>
                      <span>·</span>
                      <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="hover:underline">Terms</a>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loginMutation.isPending || (isCaptchaRequired && !isCaptchaVerified)}
                onMouseEnter={preloadDashboardBundles}
                onFocus={preloadDashboardBundles}
                className="w-full h-14 bg-[#002147] hover:bg-blue-900 text-white rounded-2xl text-lg font-bold shadow-xl shadow-blue-900/10 transition-all flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginMutation.isPending ? (
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

      {/* Dialog modal for custom visual challenge grid */}
      <Dialog open={showCaptchaModal} onOpenChange={(open) => {
        if (!open) {
          setShowCaptchaModal(false);
          setCaptchaSolving(false);
        }
      }}>
        <DialogContent className="max-w-[400px] p-0 border-none bg-transparent shadow-none flex justify-center">
          <VisualCaptchaChallenge 
            onSuccess={() => {
              setIsCaptchaVerified(true);
              setShowCaptchaModal(false);
              setCaptchaSolving(false);
              toast.success("Identity Verified", {
                description: "reCAPTCHA visual challenge solved successfully."
              });
            }}
            onCancel={() => {
              setShowCaptchaModal(false);
              setCaptchaSolving(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* FORGOT PASSWORD DIALOG */}
      <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-none shadow-2xl p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-['Syne'] text-2xl text-[#002147] flex items-center gap-2">
              <Lock className="w-6 h-6 text-emerald-500" />
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">
              Enter your email address and we'll send you a secure link to reset your password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="forgotEmail" className="text-xs font-bold text-[#002147] uppercase tracking-widest opacity-60">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  id="forgotEmail"
                  type="email" 
                  placeholder="your-email@domain.com" 
                  className="pl-12 h-14 bg-gray-50 border-gray-100 focus:bg-white focus:ring-emerald-500 rounded-2xl transition-all font-medium"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4 flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForgotModal(false)}
                className="flex-1 rounded-2xl h-12 font-bold"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSendingForgot}
                className="flex-1 bg-[#002147] hover:bg-blue-900 text-white rounded-2xl h-12 font-bold shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
              >
                {isSendingForgot ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
