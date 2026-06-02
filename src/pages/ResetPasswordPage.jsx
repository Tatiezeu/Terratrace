import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, ShieldAlert, Eye, EyeOff, Loader2, KeyRound, Lock, CheckCircle2, XCircle } from "lucide-react";
import api from "../utils/api";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract token from query params
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status and feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasTokenError, setHasTokenError] = useState(false);

  // Dynamic Password Validation Criteria
  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const metCount = Object.values(criteria).filter(Boolean).length;
  const strengthPercentage = (metCount / 4) * 100;

  useEffect(() => {
    if (!token) {
      setHasTokenError(true);
      toast.error("Invalid Request", {
        description: "No secure reset token was provided in the link. Please check your email again.",
      });
    }
  }, [token]);

  const getStrengthColor = () => {
    if (metCount === 0) return "bg-gray-600";
    if (metCount <= 2) return "bg-red-500";
    if (metCount === 3) return "bg-amber-500";
    return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
  };

  const getStrengthLabel = () => {
    if (password.length === 0) return "Password Strength";
    if (metCount <= 2) return "Weak Password";
    if (metCount === 3) return "Medium Strength";
    return "Strong & Secure";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Error submitting request", {
        description: "Your session token is missing. Please request a new link.",
      });
      return;
    }

    if (metCount < 4) {
      toast.error("Password too weak", {
        description: "Please fulfill all security criteria to protect your registry account.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mismatch", {
        description: "Confirm password does not match your new password.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password,
      });

      if (response.data.success) {
        setIsSuccess(true);
        toast.success("Security Update Complete", {
          description: "Your password has been successfully updated in our secure database.",
        });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to update your password. Token might have expired.";
      toast.error("Reset Failed", {
        description: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001833] flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Montserrat']">
      {/* Premium background glowing shapes */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 relative z-10 text-center">
        <h1 className="text-3xl font-bold font-['Syne'] text-white tracking-wide">
          Terra<span className="text-[#D4AF37]">Trace</span>
        </h1>
        <p className="text-[10px] text-emerald-400 font-semibold tracking-[4px] uppercase mt-1">
          Digital Land Registry
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="reset-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
          >
            {/* Title / Icon section */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-16 h-16 bg-[#D4AF37]/15 border border-[#D4AF37]/35 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#D4AF37]/10">
                <KeyRound className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h2 className="text-2xl font-bold font-['Syne'] text-white mb-2">
                Establish New Credentials
              </h2>
              <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
                Choose a highly secure, unique password to safe-guard your land registry profile.
              </p>
            </div>

            {hasTokenError ? (
              <div className="flex flex-col items-center py-6 text-center">
                <ShieldAlert className="w-12 h-12 text-red-400 mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-white mb-2">Missing or Expired Token</h3>
                <p className="text-gray-400 text-xs mb-6 px-4">
                  The link you clicked appears to be invalid or expired. Password reset tokens are single-use and valid for exactly 1 hour.
                </p>
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 font-bold"
                >
                  Return to Portal Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs font-bold text-white uppercase tracking-widest opacity-80">
                      New Password
                    </Label>
                    <span className="text-[10px] text-gray-400">Min 8 chars</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="pl-10 pr-10 py-6 bg-white/5 border-white/10 text-white placeholder-gray-500 rounded-xl focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Widget */}
                {password.length > 0 && (
                  <div className="space-y-3 bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-300">{getStrengthLabel()}</span>
                      <span className="text-[10px] text-gray-400">{metCount} of 4 criteria</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getStrengthColor()}`}
                        style={{ width: `${strengthPercentage}%` }}
                      />
                    </div>

                    {/* Criteria List */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {criteria.length ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        )}
                        <span className={criteria.length ? "text-emerald-400" : "text-gray-400"}>
                          8+ Characters
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {criteria.uppercase ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        )}
                        <span className={criteria.uppercase ? "text-emerald-400" : "text-gray-400"}>
                          Uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {criteria.number ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        )}
                        <span className={criteria.number ? "text-emerald-400" : "text-gray-400"}>
                          One Number
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {criteria.special ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        )}
                        <span className={criteria.special ? "text-emerald-400" : "text-gray-400"}>
                          Special character
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm Password input */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-white uppercase tracking-widest opacity-80">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="pl-10 pr-10 py-6 bg-white/5 border-white/10 text-white placeholder-gray-500 rounded-xl focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Passwords do not match
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || metCount < 4 || password !== confirmPassword}
                  className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#001833] rounded-xl py-6 font-bold shadow-lg shadow-[#D4AF37]/15 transition-all mt-4 flex items-center justify-center gap-2 group disabled:opacity-40 disabled:hover:bg-[#D4AF37]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating Registry Access...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            {/* Back to Login option */}
            <div className="mt-6 text-center border-t border-white/5 pt-4">
              <Link
                to="/login"
                className="text-xs text-gray-400 hover:text-white transition-colors font-medium"
              >
                ← Back to Registry Portal Login
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 text-center flex flex-col items-center"
          >
            {/* Animated green shield with premium hover and entry */}
            <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>

            <h2 className="text-2xl font-bold font-['Syne'] text-white mb-3">
              Password Restored
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-8 max-w-sm px-2">
              Your new security credentials have been deployed. You can now use your updated password to log back into the system.
            </p>

            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 font-bold flex items-center justify-center gap-2"
            >
              Enter Protected Portal
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
