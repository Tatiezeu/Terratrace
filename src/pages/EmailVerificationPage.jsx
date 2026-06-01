import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import api from "../utils/api";
import logoSvg from "../assets/logo.svg";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { toast } from "sonner";

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const reason = queryParams.get("reason"); // '2fa' or null (for registration)

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [isActivated, setIsActivated] = useState(false);
  const [show2faWelcome, setShow2faWelcome] = useState(false);
  const [welcomeUserName, setWelcomeUserName] = useState("");
  const inputsRef = useRef([]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const emailParam = queryParams.get("email");
    const codeParam = queryParams.get("code");

    if (emailParam && codeParam) {
      localStorage.setItem('temp_email', emailParam);
      
      const codeDigits = codeParam.split("").slice(0, 6);
      while (codeDigits.length < 6) codeDigits.push("");
      setCode(codeDigits);

      const triggerAutoVerification = async () => {
        setLoading(true);
        try {
          const response = await api.post('/auth/verify-email', {
            email: emailParam,
            code: codeParam
          });

          if (response.data.success) {
            localStorage.removeItem('temp_email');

            if (reason === "2fa") {
              const userData = response.data.data?.user || response.data.data;
              localStorage.setItem('token', response.data.token);
              localStorage.setItem('user', JSON.stringify(userData));
              setWelcomeUserName(userData?.firstName || "Officer");
              setShow2faWelcome(true);
              setTimeout(() => {
                window.location.href = "/dashboard";
              }, 2500);
            } else {
              setIsActivated(true);
              toast.success("Account Activated Successfully", {
                description: "Your landowner profile is now active and ready for access."
              });
            }
          }
        } catch (err) {
          toast.error("Auto-activation failed", {
            description: err.response?.data?.message || "Invalid or expired link. Please verify manually."
          });
        } finally {
          setLoading(false);
        }
      };

      triggerAutoVerification();
    }
  }, [location.search]);

  const handleChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    
    try {
      const email = localStorage.getItem('temp_email');
      const response = await api.post('/auth/verify-email', {
        email,
        code: fullCode
      });

      if (response.data.success) {
        localStorage.removeItem('temp_email');

        if (reason === "2fa") {
          const userData = response.data.data?.user || response.data.data;
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(userData));
          setWelcomeUserName(userData?.firstName || "Officer");
          setShow2faWelcome(true);
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 2500);
        } else {
          setIsActivated(true);
          toast.success("Account Activated Successfully", {
            description: "Your landowner profile is now active and ready for access."
          });
        }
      }
    } catch (err) {
      toast.error("Verification failed", {
        description: err.response?.data?.message || "Invalid or expired code.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCount >= 3) {
      toast.error("Maximum resends reached", {
        description: "Please contact support for manual verification."
      });
      return;
    }

    if (timer > 0) return;

    try {
      const email = localStorage.getItem('temp_email');
      if (!email) return toast.error("Email not found. Please sign up again.");

      const response = await api.post('/auth/resend-code', { email });

      if (response.data.success) {
        setTimer(60);
        setResendCount(prev => prev + 1);
        toast.success("New Code Sent", {
          description: `Check your inbox. (${3 - (resendCount + 1)} attempts remaining)`
        });
      }
    } catch (err) {
      toast.error("Failed to resend code");
    }
  };

  // 2FA success welcome overlay — shown briefly before redirecting to dashboard
  if (show2faWelcome) {
    return (
      <div className="min-h-screen bg-[#001529] flex flex-col items-center justify-center p-6 font-['Montserrat']">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="max-w-md w-full text-center"
        >
          {/* Animated shield */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ShieldCheck className="w-14 h-14 text-white" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <p className="text-emerald-400 text-xs font-black uppercase tracking-[0.3em] mb-3">
              Access Granted
            </p>
            <h1 className="text-4xl font-bold font-['Syne'] text-white mb-2">
              Welcome back,
            </h1>
            <h2 className="text-5xl font-black font-['Syne'] text-[#D4AF37] mb-6">
              {welcomeUserName}!
            </h2>
            <p className="text-white/50 text-sm font-medium leading-relaxed">
              Identity verified. Redirecting you to the<br />
              <span className="text-white/80 font-bold">TerraTrace Secure Portal...</span>
            </p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="mt-10 h-1 bg-white/10 rounded-full overflow-hidden max-w-xs mx-auto"
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.2, ease: "linear" }}
              className="h-full bg-emerald-400 rounded-full"
            />
          </motion.div>
          <p className="text-white/30 text-[10px] font-medium mt-3 uppercase tracking-widest">
            Initializing secure session...
          </p>
        </motion.div>
      </div>
    );
  }


  if (isActivated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-['Montserrat']">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
        >
          <div className="bg-[#002147] p-10 text-white text-center relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-24 h-24" />
            </div>
            
            <div className="flex justify-center mb-6 select-none">
              <div className="bg-white/95 dark:bg-white/10 backdrop-blur-md px-5 py-2 rounded-2xl shadow-lg border border-white/20 w-fit mx-auto flex items-center justify-center">
                <img src={logoSvg} alt="TerraTrace Logo" className="h-8 w-auto" />
              </div>
            </div>
            <h2 className="text-2xl font-bold font-['Syne'] tracking-tight">
              Activation Successful!
            </h2>
            <p className="text-white/70 text-sm mt-2 font-medium">
              Your landowner account is now fully active
            </p>
          </div>

          <div className="p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#002147] font-['Syne']">Ready for Access</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Your credentials have been successfully authenticated against the MINDCAF secure protocol. You are now cleared to access the TerraTrace digital land portal.
              </p>
            </div>

            <Button 
              onClick={() => navigate("/login")}
              className="w-full h-14 bg-[var(--terra-emerald)] hover:bg-[#208a54] text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/10 transition-all flex items-center justify-center gap-3 group"
            >
              <span>Proceed to Login</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
        
        <p className="mt-8 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          Secured by TerraTrace Protocol
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-['Montserrat']">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
      >
        <div className="bg-[#002147] p-10 text-white text-center relative">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck className="w-24 h-24" />
          </div>
          
          <div className="flex justify-center mb-6 select-none">
            <div className="bg-white/95 dark:bg-white/10 backdrop-blur-md px-5 py-2 rounded-2xl shadow-lg border border-white/20 w-fit mx-auto flex items-center justify-center">
              <img src={logoSvg} alt="TerraTrace Logo" className="h-8 w-auto" />
            </div>
          </div>
          <h2 className="text-2xl font-bold font-['Syne'] tracking-tight">
            {reason === "2fa" ? "Two-Factor Verification" : "Verify Your Email"}
          </h2>
          <p className="text-white/60 text-sm mt-2 font-medium">
            {reason === "2fa" 
              ? "Verify your identity to access the portal" 
              : "We've sent a 6-digit secure code to your inbox"}
          </p>
        </div>

        <div className="p-10">
          <form onSubmit={handleVerify} className="space-y-8">
            <div className="flex justify-between gap-2">
              {code.map((digit, idx) => (
                <Input
                  key={idx}
                  ref={(el) => (inputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-2xl font-extrabold tracking-widest bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-400 transition-all p-0 shadow-sm"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 bg-[#002147] hover:bg-blue-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-900/10 transition-all flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify Account</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-gray-500 font-medium">
              Didn't receive the code?
            </p>
            <button 
              onClick={handleResend}
              disabled={timer > 0 || resendCount >= 3}
              className={`flex items-center gap-2 mx-auto font-bold text-sm transition-colors ${
                (timer > 0 || resendCount >= 3) 
                  ? "text-gray-400 cursor-not-allowed" 
                  : "text-emerald-600 hover:text-emerald-700"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${timer > 0 ? "animate-spin" : ""}`} />
              {timer > 0 
                ? `Resend in ${timer}s` 
                : resendCount >= 3 
                  ? "Max Resends Reached" 
                  : "Resend New Code"}
            </button>
            <div className="pt-4 border-t border-gray-50">
              <Link to="/register" className="text-xs text-gray-400 font-bold hover:text-gray-600 flex items-center justify-center gap-2">
                <ArrowRight className="w-3 h-3 rotate-180" />
                Change Email Address
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
      
      <p className="mt-8 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
        <ShieldCheck className="w-3 h-3" />
        Secured by TerraTrace Protocol
      </p>
    </div>
  );
}
