import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import api from "../utils/api";
import Logo from "../app/components/shared/Logo";
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
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.removeItem('temp_email');

        toast.success("Verification Successful", {
          description: "Access granted to the TerraTrace Portal.",
        });
        
        window.location.href = "/dashboard";
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
          
          <div className="flex justify-center mb-6">
            <Logo variant="dark" className="h-10" />
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
                  className="w-12 h-14 text-center text-xl font-black bg-gray-50 border-gray-100 rounded-xl focus:ring-emerald-500 focus:bg-white transition-all p-0"
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
