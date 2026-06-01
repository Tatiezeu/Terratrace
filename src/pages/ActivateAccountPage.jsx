import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { ShieldCheck, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import api from "../utils/api";
import { Button } from "../app/components/ui/button";
import { toast } from "sonner";

export default function ActivateAccountPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const requestInitiated = useRef(false);

  // Resend Activation states
  const [resendEmail, setResendEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);

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
  }, [token]);

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

        {/* Footer legalities */}
        <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-8 border-t border-white/5 pt-6 w-full">
          Powered by MINDCAF Secure Suite
        </p>
      </motion.div>
    </div>
  );
}
