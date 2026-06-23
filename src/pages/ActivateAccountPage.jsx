import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { ShieldCheck, ShieldAlert, ArrowRight, Loader2, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import api from "../utils/api";
import { Button } from "../app/components/ui/button";
import { toast } from "sonner";

export default function ActivateAccountPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const type = queryParams.get("type");
  const isResetMode = type === "reset";

  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'error', 'reset_form', 'reset_success'
  const [errorMessage, setErrorMessage] = useState("");
  const requestInitiated = useRef(false);

  // Resend Activation states
  const [resendEmail, setResendEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);

  // Reset Password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submittingReset, setSubmittingReset] = useState(false);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResendLink = async (e) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    setResending(true);
    try {
      const response = await api.post("/auth/resend-code", { email: resendEmail });
      if (response.data.success) {
        toast.success("Activation link resent successfully!", {
          description: "Please check your inbox.",
        });
        setResendTimer(60); // 1-minute cooldown!
      }
    } catch (err) {
      toast.error("Failed to resend link", {
        description: err.response?.data?.message || "Please check the email address.",
      });
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (isResetMode) {
      setStatus("reset_form");
      return;
    }

    if (!token) {
      setStatus("error");
      setErrorMessage("No activation token was provided in the link. Please check your email and click the link again.");
      return;
    }

    if (requestInitiated.current) return;
    requestInitiated.current = true;

    const activateAccount = async () => {
      try {
        const response = await api.post("/auth/activate", { token });
        if (response.data.success) {
          setStatus("success");
          toast.success("Account activated successfully!", {
            description: "You can now log in to the portal.",
          });
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage(err.response?.data?.message || "Invalid or expired activation link. Please request a new one.");
        toast.error("Activation failed", {
          description: err.response?.data?.message || "Failed to activate account.",
        });
      }
    };

    activateAccount();
  }, [token, isResetMode]);

  const getPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 6) strength += 25;
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

  const getStrengthText = (strength) => {
    if (strength === 0) return "VERY WEAK";
    if (strength <= 25) return "WEAK";
    if (strength <= 50) return "FAIR";
    if (strength <= 75) return "GOOD";
    return "STRONG";
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Match Conformity Failed", {
        description: "Confirm password does not match the new password."
      });
      return;
    }
    if (getPasswordStrength(newPassword) < 50) {
      toast.error("Weak Password Strength", {
        description: "Please choose a stronger password matching the complexity requirements."
      });
      return;
    }

    setSubmittingReset(true);
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password: newPassword
      });
      if (response.data.success) {
        toast.success("Password updated successfully!", {
          description: "You can now log in with your new password."
        });
        setStatus("reset_success");
      }
    } catch (err) {
      toast.error("Password reset failed", {
        description: err.response?.data?.message || "Invalid or expired reset token."
      });
    } finally {
      setSubmittingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001833] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 text-center flex flex-col items-center"
      >
        {/* Centered TerraTrace Brand Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-['Syne'] text-white tracking-wide">
            Terra<span className="text-[#D4AF37]">Trace</span>
          </h1>
          <p className="text-[10px] text-emerald-400 font-semibold tracking-[4px] uppercase mt-1">
            Digital Land Registry
          </p>
        </div>

        {/* Loading State */}
        {status === "loading" && (
          <div className="flex flex-col items-center py-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="mb-6"
            >
              <Loader2 className="w-16 h-16 text-[#D4AF37]" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2 font-['Syne']">
              Verifying Security Token...
            </h3>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              We are verifying your cryptographically secure signature. Please hold on.
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="flex flex-col items-center">
            {/* Animated green shield with premium hover and entry */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20"
            >
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </motion.div>

            <h3 className="text-2xl font-bold text-white mb-3 font-['Syne']">
              Portal Access Verified
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-8 max-w-sm px-2">
              Excellent! Your identity is confirmed, and your TerraTrace profile has been updated to <span className="text-emerald-400 font-extrabold">Active</span>.
            </p>

            <Button
              asChild
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4C430] hover:from-[#e3bd42] hover:to-[#ffd64a] text-[#002147] font-extrabold h-12 rounded-xl flex items-center justify-center gap-2 group transition-all duration-300 shadow-xl shadow-[#D4AF37]/15"
            >
              <Link to="/login">
                Proceed to Sign In
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-500/20"
            >
              <ShieldAlert className="w-10 h-10 text-red-400" />
            </motion.div>

            <h3 className="text-2xl font-bold text-white mb-3 font-['Syne']">
              Verification Failed
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-8 max-w-sm px-2">
              {errorMessage}
            </p>

            <div className="w-full space-y-3">
              <Button
                asChild
                className="w-full bg-white/10 hover:bg-white/15 text-white font-bold h-12 rounded-xl transition-all duration-300"
              >
                <Link to="/register">
                  Return to Registration
                </Link>
              </Button>
              <Button
                asChild
                variant="link"
                className="text-gray-400 hover:text-white text-xs font-semibold"
              >
                <Link to="/login">
                  Go to Login Portal
                </Link>
              </Button>
            </div>

            {/* Resend activation link section */}
            <div className="w-full mt-6 pt-6 border-t border-white/5 space-y-4">
              <p className="text-xs text-gray-400 font-medium">
                Need a new activation link? Enter your email:
              </p>
              <form onSubmit={handleResendLink} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all text-sm text-white placeholder-gray-500 text-center"
                />
                <Button
                  type="submit"
                  disabled={resending || resendTimer > 0}
                  className="w-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/30 font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : resendTimer > 0 ? (
                    `Resend link in ${resendTimer}s`
                  ) : (
                    "Resend Activation Link"
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Form State */}
        {status === "reset_form" && (
          <form onSubmit={handleResetPassword} className="space-y-6 w-full flex flex-col items-center">
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center shadow-lg">
                <KeyRound className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-white font-['Syne']">Reset Portal Password</h3>
              <p className="text-gray-400 text-xs max-w-xs">
                Update your security credentials for the digital land registry.
              </p>
            </div>

            {/* New Password input */}
            <div className="space-y-2 text-left w-full">
              <label htmlFor="newPassword" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  id="newPassword"
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="w-full pl-11 pr-11 h-12 rounded-xl bg-white/5 border border-white/10 font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {newPassword && (
                <div className="px-1 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                     <span>Strength</span>
                     <span className={getPasswordStrength(newPassword) >= 75 ? "text-emerald-400" : "text-amber-400"}>
                       {getStrengthText(getPasswordStrength(newPassword))} ({getPasswordStrength(newPassword)}%)
                     </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${getPasswordStrength(newPassword)}%` }}
                      className={`h-full ${getStrengthColor(getPasswordStrength(newPassword))} transition-all duration-300`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password input */}
            <div className="space-y-2 text-left w-full">
              <label htmlFor="confirmPassword" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="w-full pl-11 pr-11 h-12 rounded-xl bg-white/5 border border-white/10 font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {confirmPassword && (
                <div className="px-1 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                     <span>Conformity</span>
                     <span className={newPassword === confirmPassword ? "text-emerald-400" : "text-red-400"}>
                       {newPassword === confirmPassword ? "MATCHED" : "MISMATCH"}
                     </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: newPassword === confirmPassword ? "100%" : "30%" }}
                      className={`h-full ${newPassword === confirmPassword ? "bg-emerald-500" : "bg-red-400"} transition-all duration-300`}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={submittingReset || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className={`w-full font-extrabold h-12 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                newPassword && confirmPassword && newPassword === confirmPassword && getPasswordStrength(newPassword) >= 50
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#F4C430] text-[#002147] hover:from-[#e3bd42] hover:to-[#ffd64a]"
                  : "bg-white/10 text-white/40 border border-white/5 cursor-not-allowed"
              }`}
            >
              {submittingReset ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Update Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
            
            <Button
              asChild
              variant="link"
              className="text-gray-400 hover:text-white text-xs font-semibold mt-2"
            >
              <Link to="/login">Cancel and Return</Link>
            </Button>
          </form>
        )}

        {/* Reset Success State */}
        {status === "reset_success" && (
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20"
            >
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </motion.div>

            <h3 className="text-2xl font-bold text-white mb-3 font-['Syne']">
              Password Updated!
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-8 max-w-sm px-2">
              Your password has been cryptographically updated in the registry. You can now access your dashboard.
            </p>

            <Button
              asChild
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4C430] hover:from-[#e3bd42] hover:to-[#ffd64a] text-[#002147] font-extrabold h-12 rounded-xl flex items-center justify-center gap-2 group transition-all duration-300 shadow-xl shadow-[#D4AF37]/15"
            >
              <Link to="/login">
                Proceed to Sign In
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        )}

        {/* Footer legalities */}
        <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-8 border-t border-white/5 pt-6 w-full">
          Powered by MINDCAF Secure Suite
        </p>
      </motion.div>
    </div>
  );
}
