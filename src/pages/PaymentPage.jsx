// BEHAVIOR: Renders the payment gateway interface. Connects with CamPay API for USSD MTN MoMo/Orange Money pushes, supports transaction status polling, and outputs downloadable PDF receipts.
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
// BEHAVIOR: UI Icons representing security badges, phones, checkmarks, clocks, downloads, and loaders
import {
  Shield,
  ChevronLeft,
  Phone,
  CheckCircle2,
  Download,
  LayoutDashboard,
  X,
  AlertCircle,
  Info,
  Lock,
  Clock,
  Zap,
  HelpCircle,
  BadgeCheck,
  Loader2,
  Wifi
} from "lucide-react";
import Logo from "../app/components/shared/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "../app/components/ui/avatar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { toast } from "sonner";

// ─── COLOR_THEME Tokens ───────────────────────────────────────────────────────
// COLOR_THEME: Navy Blue base color for high trust brand identity
const NAVY = "#002147";
// COLOR_THEME: Gold accent color representing premium security and land value
const GOLD = "#D4AF37";
// COLOR_THEME: Light gold highlighting for subtle gradient stops
const GOLD_LIGHT = "#F0D675";
// COLOR_THEME: Muted gold tone for borders and subheadings
const GOLD_MUTED = "#B8943A";
const WHITE = "#ffffff";
const SURFACE = "#f4f6f9";
const MUTED = "#64748b";
// COLOR_THEME: Success indicator color
const SUCCESS_GREEN = "#16a34a";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatXAF = (n) =>
  n.toLocaleString("fr-CM", { minimumFractionDigits: 0 }) + " XAF";

const nowStr = () => {
  const d = new Date();
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
};

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function Tip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        // COLOR_THEME: Gold tooltip trigger icon color
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: GOLD, display: "flex" }}
      >
        <HelpCircle size={13} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            // COLOR_THEME: Tooltip styled in NAVY background and WHITE text
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: NAVY,
              color: WHITE,
              fontFamily: "Montserrat, sans-serif",
              fontSize: "11px",
              fontWeight: 400,
              lineHeight: 1.5,
              padding: "8px 12px",
              borderRadius: 8,
              width: 180,
              whiteSpace: "normal",
              zIndex: 100,
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              pointerEvents: "none",
            }}
          >
            {text}
            <div style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `5px solid ${NAVY}`,
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ─── MTN MoMo SVG logo ───────────────────────────────────────────────────────
function MtnLogo({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      {/* COLOR_THEME: MTN yellow brand background */}
      <rect width="56" height="56" rx="10" fill="#FFCB00" />
      <text x="28" y="24" textAnchor="middle" fill="#000000"
        fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="14">
        MTN
      </text>
      <rect x="8" y="29" width="40" height="16" rx="3" fill="#0057A8" />
      <text x="28" y="41" textAnchor="middle" fill="#FFCB00"
        fontFamily="Arial, sans-serif" fontWeight="800" fontSize="11">
        MoMo
      </text>
    </svg>
  );
}

// ─── Orange Money SVG logo ──────────────────────────────────────────────────
function OrangeLogo({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      {/* COLOR_THEME: Orange money brand background */}
      <rect width="56" height="56" rx="10" fill="#FF6600" />
      <circle cx="28" cy="22" r="9" fill="none" stroke="white" strokeWidth="3" />
      <text x="28" y="26" textAnchor="middle" fill="white"
        fontFamily="Arial, sans-serif" fontWeight="900" fontSize="10">
        OM
      </text>
      <text x="28" y="44" textAnchor="middle" fill="white"
        fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9">
        Orange Money
      </text>
    </svg>
  );
}

// ─── Trust strip ─────────────────────────────────────────────────────────────
function TrustStrip() {
  const items = [
    { icon: <Lock size={14} />, text: "256-bit SSL" },
    { icon: <Shield size={14} />, text: "Campay Secured" },
    { icon: <BadgeCheck size={14} />, text: "PCI-DSS Compliant" },
    { icon: <Zap size={14} />, text: "Instant Settlement" },
  ];
  return (
    <div className="flex items-center justify-center gap-6 flex-wrap" style={{ padding: "12px 0" }}>
      {items.map(({ icon, text }) => (
        <div key={text} className="flex items-center gap-1.5">
          {/* COLOR_THEME: Security details icons highlighted in Gold */}
          <span style={{ color: GOLD }}>{icon}</span>
          <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: "11px", color: MUTED, fontWeight: 500 }}>{text}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Sidebar tips panel ───────────────────────────────────────────────────────
function SidebarTips() {
  const tips = [
    {
      icon: <Phone size={18} />,
      title: "USSD Push",
      body: "After clicking Pay Now, you'll receive an automatic prompt on your phone — no need to dial anything.",
    },
    {
      icon: <Clock size={18} />,
      title: "Transaction Timeout",
      body: "The payment request expires in 5 minutes. If it times out, simply try again.",
    },
    {
      icon: <Shield size={18} />,
      title: "Your PIN is private",
      body: "TerraTrace and Campay will never ask for your mobile money PIN. Enter it only on your handset.",
    },
    {
      icon: <Info size={18} />,
      title: "Service fee",
      body: "A 10% service fee is applied to cover processing and administrative costs.",
    },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Payment Tips
      </p>
      {tips.map(({ icon, title, body }) => (
        <motion.div
          key={title}
          className="flex gap-3"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* COLOR_THEME: Tips icons in GOLD */}
          <div style={{ flexShrink: 0, color: GOLD, marginTop: 1 }}>{icon}</div>
          <div>
            <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "12px", fontWeight: 700, color: WHITE }}>{title}</p>
            <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginTop: 2 }}>{body}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── PDF receipt ──────────────────────────────────────────────────────────────
// BEHAVIOR: Generates and triggers download of a custom PDF receipt using jsPDF A4 template
function downloadReceipt(params) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const pad = 20;

  // COLOR_THEME: Top header band in PDF colored in navy RGB (0, 33, 71)
  doc.setFillColor(0, 33, 71);
  doc.rect(0, 0, W, 52, "F");

  // COLOR_THEME: Gold accent divider line in PDF RGB (212, 175, 55)
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 52, W, 2, "F");

  // Logo text in header
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Terra", pad, 26);
  doc.setTextColor(255, 255, 255);
  doc.text("Trace", pad + 28, 26);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("TRUST IN LAND", pad, 33);

  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("PAYMENT RECEIPT", W - pad, 26, { align: "right" });
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Official Document", W - pad, 33, { align: "right" });

  // COLOR_THEME: Status badge filled with green RGB (22, 163, 74)
  doc.setFillColor(22, 163, 74);
  doc.roundedRect(pad, 40, 40, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("✓  PAYMENT CONFIRMED", pad + 4, 45.5);

  // Section: Transaction Summary
  let y = 68;
  doc.setTextColor(0, 33, 71);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Transaction Summary", pad, y);

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(pad, y + 2, W - pad, y + 2);
  y += 12;

  const rows = [
    ["Reference ID", params.refId],
    ["Date & Time", params.timestamp],
    ["Payment Method", params.method === "orange" ? "Orange Money" : "MTN MoMo"],
    ["Phone Number", params.phone],
    ["Service", "TerraTrace Land Registry Service"],
    ["Amount", formatXAF(params.amount)],
    ["Service Fee (10%)", formatXAF(params.fee)],
    ["Total Charged", formatXAF(params.total), true],
  ];

  rows.forEach(([label, value, bold], i) => {
    const rowY = y + i * 11;
    if (i % 2 === 0) {
      doc.setFillColor(244, 246, 249);
      doc.rect(pad, rowY - 4.5, W - pad * 2, 11, "F");
    }
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(label, pad + 3, rowY);

    if (bold) {
      doc.setTextColor(212, 175, 55);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
    } else {
      doc.setTextColor(0, 33, 71);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(9);
    }
    doc.text(value, W - pad - 3, rowY, { align: "right" });
  });

  y += rows.length * 11 + 16;

  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(pad, y, W - pad, y);
  y += 10;

  // Footer
  doc.setFillColor(0, 33, 71);
  doc.rect(0, y, W, 40, "F");
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Secured by Campay  •  PCI-DSS Compliant  •  256-bit SSL Encryption", W / 2, y + 10, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("This is an automatically generated receipt. For support: support@terratrace.cm", W / 2, y + 18, { align: "center" });
  doc.setTextColor(100, 120, 140);
  doc.setFontSize(7);
  doc.text(`Generated on ${params.timestamp}`, W / 2, y + 26, { align: "center" });

  doc.save(`TerraTrace-Receipt-${params.refId}.pdf`);
}

// ─── PaymentPage Root Component ──────────────────────────────────────────────
export default function PaymentPage({ id: propId, isModal = false, onClose, onSuccess }) {
  const params = useParams();
  const id = propId || params.id;
  const navigate = useNavigate();
  const { user: rawUser } = useAuth();
  
  const [time, setTime] = useState(new Date());
  // BEHAVIOR: Screens can toggle between 'landing', 'payment', 'processing', 'success'
  const [screen, setScreen] = useState(isModal ? "payment" : "landing");
  const [appDetails, setAppDetails] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  const [selected, setSelected] = useState(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [paymentData, setPaymentData] = useState(null);
  // BEHAVIOR: 60-second cooldown timer controlling the USSD resend ability
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  const wrapperStyle = isModal 
    ? { position: "relative", width: "100%", background: "#ffffff", padding: "8px 0" }
    : { position: "fixed", inset: 0, overflowY: "auto", background: SURFACE };

  const processingWrapperStyle = isModal
    ? { position: "relative", background: `linear-gradient(160deg, ${NAVY} 0%, #001a38 100%)`, borderRadius: "24px", color: WHITE, padding: "20px 0" }
    : { position: "fixed", inset: 0 };
    
  const processingInnerStyle = isModal
    ? { padding: "12px 20px", display: "flex", flexDirection: "column", color: WHITE }
    : { minHeight: "100vh", background: `linear-gradient(160deg, ${NAVY} 0%, #001a38 100%)`, display: "flex", flexDirection: "column" };

  // Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Fetch transfer details on mount
  useEffect(() => {
    const fetchTransferDetails = async () => {
      try {
        // BACKEND_CONNECTION: GET /transfer/:id loads the land dossier and its associated notice fee details
        const res = await api.get(`/transfer/${id}`);
        if (res.data.success) {
          setAppDetails(res.data.data);
          // Pre-fill phone if sender phone exists
          if (res.data.data.sender?.phone) {
            const rawPhone = res.data.data.sender.phone.replace('+237', '').trim();
            setPhone(rawPhone);
          }
        }
      } catch (err) {
        toast.error("Failed to load application details.");
        if (isModal) {
          if (onClose) onClose();
        } else {
          navigate('/dashboard/applications');
        }
      } finally {
        setFetching(false);
      }
    };
    fetchTransferDetails();
  }, [id, navigate, isModal, onClose]);

  // Background status checker polling when in 'processing' screen
  useEffect(() => {
    if (screen !== "processing") return;
    
    let attempts = 0;
    let timerId;
    let isCancelled = false;
    
    const pollPaymentStatus = async () => {
      if (isCancelled) return;
      
      attempts++;
      
      if (attempts > 30) {
        toast.error("Payment verification is taking too long. You can upload payment proof.");
        return; // Stop polling
      }
      
      try {
        // BACKEND_CONNECTION: GET /transfer/:id/check-payment polls transaction verification state on the backend
        const response = await api.get(`/transfer/${id}/check-payment`);
        if (response.data.success && response.data.data.status === 'Payment_Verified') {
          if (!isCancelled) {
            toast.success("Payment verified automatically!");
            setScreen("success");
          }
          return;
        }
      } catch (err) {
        console.warn("Polling payment check failed:", err);
      }
      
      if (!isCancelled) {
        let delay = 2000;
        if (attempts > 10) {
          delay = 10000;
        } else if (attempts > 3) {
          delay = 5000;
        }
        timerId = setTimeout(pollPaymentStatus, delay);
      }
    };
    
    pollPaymentStatus();

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [screen, id]);

  const user = rawUser ? {
    role: rawUser.role,
    name: `${rawUser.firstName} ${rawUser.lastName}`,
    avatar: rawUser.profilePic === 'default-profile.png' 
      ? 'http://localhost:5001/assets/default-profile.png' 
      : (rawUser.profilePic?.startsWith('http') ? rawUser.profilePic : `http://localhost:5001/${rawUser.profilePic || ''}`)
  } : null;

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f6f9] space-y-4">
        <Loader2 className="w-10 h-10 text-[var(--terra-navy)] animate-spin" />
        <p className="font-semibold text-gray-500 font-['Montserrat']">Loading secure payment gate...</p>
      </div>
    );
  }

  const baseAmount = appDetails?.feeNotice?.amount || 150000;
  const serviceFee = Math.round(baseAmount * 0.10);
  const totalAmount = baseAmount + serviceFee;

  // Handles pay-fee collect trigger (USSD Push)
  const handlePayNow = async () => {
    if (!selected) {
      setError("Please select a payment method.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setError("Enter a valid 9-digit phone number.");
      return;
    }
    setError("");
    setPaying(true);

    try {
      // BACKEND_CONNECTION: POST /transfer/:id/pay-fee initiates CamPay payment collection request
      const res = await api.post(`/transfer/${id}/pay-fee`, {
        phone: digits,
        operator: selected
      });
      if (res.data.success) {
        setPaymentData({
          method: selected,
          phone: `+237 ${digits}`,
          amount: baseAmount,
          fee: serviceFee,
          total: totalAmount,
          refId: res.data.data.reference || `TT-${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp: nowStr()
        });
        setScreen("processing");
        // BEHAVIOR: Starts 60-second cooldown timer to prevent spamming USSD calls too quickly
        setResendCountdown(60);
        toast.info("USSD Push sent to your mobile phone!");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to initiate transaction. Please verify operator and balance.");
    } finally {
      setPaying(false);
    }
  };

  // Handles resending USSD payment requests
  const handleResendUSSD = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      const digits = phone.replace(/\D/g, "");
      // BACKEND_CONNECTION: POST /transfer/:id/pay-fee re-triggers CamPay collection request
      const res = await api.post(`/transfer/${id}/pay-fee`, {
        phone: digits,
        operator: selected
      });
      if (res.data.success) {
        setResendCountdown(60);
        setPaymentData(prev => ({
          ...prev,
          refId: res.data.data.reference || prev.refId,
          timestamp: nowStr()
        }));
        toast.success("USSD payment prompt resent successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to resend USSD prompt. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // Handles manual status verification check when clicking "I HAVE PAID"
  const handleVerifyPaidStatus = async () => {
    setVerifying(true);
    try {
      // BACKEND_CONNECTION: GET /transfer/:id/check-payment explicitly requests verification of payment status
      const response = await api.get(`/transfer/${id}/check-payment`);
      if (response.data.success && response.data.data.status === 'Payment_Verified') {
        toast.success("Payment verified successfully!");
        setScreen("success");
      } else {
        toast.warning("Payment check completed.", {
          description: "We haven't detected your payment yet. Ensure you authorized the USSD push and entered your PIN on your phone.",
        });
      }
    } catch (err) {
      toast.error("Status verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  // ─── NAV BAR COMPONENT (styled with user's color theme & matching dashboard look) ───
  const RenderNavbar = () => (
    // COLOR_THEME: Navbar has Navy gradient header with gold bottom border
    <div style={{ 
      background: `linear-gradient(135deg, ${NAVY} 0%, #001f42 100%)`, 
      padding: "12px 40px", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
      borderBottom: `2px solid ${GOLD}` 
    }}>
      <div className="flex items-center gap-6">
        <motion.button
          onClick={() => {
            if (screen === 'payment') setScreen('landing');
            else if (screen === 'processing') setScreen('payment');
            else navigate('/dashboard/applications');
          }}
          style={{ 
            background: "rgba(255,255,255,0.08)", 
            border: "1px solid rgba(255,255,255,0.18)", 
            borderRadius: 10, 
            padding: "8px 16px", 
            cursor: "pointer", 
            color: WHITE, 
            display: "flex", 
            alignItems: "center", 
            gap: 6, 
            fontFamily: "Montserrat, sans-serif", 
            fontSize: "12px", 
            fontWeight: 700 
          }}
          whileHover={{ background: "rgba(255,255,255,0.15)" }}
          whileTap={{ scale: 0.97 }}
        >
          <ChevronLeft size={15} /> BACK TO APP
        </motion.button>

        {/* Live Clock styled like dashboard TopNav */}
        <div className="hidden md:flex flex-col border-l border-white/20 pl-6">
          <span className="text-lg font-bold font-['Syne'] text-white">
            {formattedTime}
          </span>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">
            {formattedDate}
          </span>
        </div>

        {/* System Online badge styled like dashboard TopNav */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 border border-emerald-800 rounded-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Escrow Secure</span>
        </div>
      </div>

      <Logo variant="dark" className="h-10 w-auto" />

      {/* User profile styled like dashboard TopNav */}
      {user && (
        <div className="flex items-center gap-3 pl-6 border-l border-white/20">
          {/* COLOR_THEME: Gold ring around user avatar */}
          <Avatar className="w-10 h-10 ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-background">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-[#D4AF37] text-[#002147] font-semibold">
              {user.name ? user.name.split(" ").map((n) => n[0]).join("") : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-white leading-tight">
              {user.name}
            </span>
            <span className="text-[9px] text-[#D4AF37] font-black uppercase tracking-widest mt-0.5">
              {user.role}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {screen === "landing" && (
        <motion.div key="landing" style={{ position: "fixed", inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}>
          {/* COLOR_THEME: Landing page dark gradient background */}
          <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: `linear-gradient(145deg, ${NAVY} 0%, #001530 55%, #001030 100%)` }}>
            <motion.div className="flex flex-col items-center" style={{ maxWidth: 560, padding: "0 32px", textAlign: "center" }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
              <Logo variant="dark" className="h-16 w-auto mb-10" />

              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(30px,4vw,48px)", fontWeight: 600, color: WHITE, lineHeight: 1.15, letterSpacing: "0.01em", marginBottom: 20 }}>
                Secure Land Registry<br />
                {/* COLOR_THEME: Header highlighted with Gold */}
                <span style={{ color: GOLD }}>Escrow Fee Portal</span>
              </h1>
              <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "14px", fontWeight: 400, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 440, marginBottom: 40 }}>
                Proceed to pay the authorized deed registration fee of <span className="font-bold text-white">{formatXAF(baseAmount)}</span> plus platform administrative fees. Funds will be held securely in escrow until approved by MINDCAF LRO.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {["Orange Money", "MTN MoMo", "Instant Receipt", "Campay Secured"].map((f) => (
                  // COLOR_THEME: Features tags highlighted with translucent Gold background
                  <div key={f} style={{ background: "rgba(212,175,55,0.12)", border: `1px solid rgba(212,175,55,0.3)`, borderRadius: 24, padding: "6px 16px" }}>
                    <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: "11px", fontWeight: 600, color: GOLD }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* COLOR_THEME: Primary CTA button features Gold color gradient */}
              <motion.button
                onClick={() => setScreen("payment")}
                style={{
                  background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_MUTED} 100%)`,
                  color: NAVY,
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 800,
                  fontSize: "14px",
                  letterSpacing: "0.1em",
                  borderRadius: 14,
                  padding: "18px 48px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: `0 8px 32px rgba(212,175,55,0.35)`,
                }}
                whileHover={{ scale: 1.03, boxShadow: `0 12px 40px rgba(212,175,55,0.5)` }}
                whileTap={{ scale: 0.98 }}
              >
                PROCEED TO PAYMENT
              </motion.button>

              <div className="mt-8">
                <TrustStrip />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {screen === "payment" && (
        <motion.div key="payment" style={wrapperStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {!isModal && <RenderNavbar />}

          <div className={isModal ? "w-full max-w-lg mx-auto p-2" : "max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8"}>
            {/* Left Column: Tips */}
            {!isModal && (
              <div className="lg:col-span-1">
                {/* COLOR_THEME: Tips panel has custom Navy background */}
                <div className="sticky top-6 rounded-3xl p-6 shadow-sm" style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #00254d 100%)`, color: WHITE }}>
                  <SidebarTips />
                </div>
              </div>
            )}

            {/* Centre Column: Form */}
            <div className={isModal ? "w-full" : "lg:col-span-2 max-w-xl mx-auto w-full"}>
              <motion.div className="bg-white rounded-3xl overflow-hidden shadow-xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #002247 100%)`, padding: "24px 32px" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={16} color={GOLD} />
                    <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: 600, color: WHITE, letterSpacing: "0.02em" }}>Escrow Payment Form</span>
                  </div>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.02em" }}>
                    Dossier Ref: {id?.substring(0, 10).toUpperCase()} · Plot: {appDetails?.plot?.landCode || 'N/A'}
                  </p>
                </div>

                <div className="p-8">
                  {/* Amount Display */}
                  <div className="mb-6">
                    <label style={{ display: "flex", alignItems: "center", fontFamily: "Montserrat, sans-serif", fontSize: "11px", fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                      Payment Breakdown
                      <Tip text="Payment includes the notary fee amount plus a mandatory 10% platform administration fee." />
                    </label>
                    <div style={{ background: "rgba(212,175,55,0.06)", border: `1px solid rgba(212,175,55,0.25)`, borderRadius: 16, padding: "16px 20px" }} className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span style={{ color: MUTED, fontFamily: "Montserrat" }}>Base Notary Fee</span>
                        <span className="font-bold text-[#002147]" style={{ fontFamily: "Montserrat" }}>{formatXAF(baseAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span style={{ color: MUTED, fontFamily: "Montserrat" }}>Platform Administrative Fee (10%)</span>
                        <span className="font-bold text-[#002147]" style={{ fontFamily: "Montserrat" }}>{formatXAF(serviceFee)}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between items-center">
                        <span className="text-xs font-bold text-[#002147]" style={{ fontFamily: "Montserrat" }}>Total Escrow Amount</span>
                        <span className="text-xl font-bold text-[#D4AF37]" style={{ fontFamily: "Cormorant Garamond, serif" }}>{formatXAF(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Method Selection */}
                  <div className="mb-6">
                    <label style={{ display: "flex", alignItems: "center", fontFamily: "Montserrat, sans-serif", fontSize: "11px", fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                      Mobile Network Operator
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {["mtn", "orange"].map((id) => (
                        <motion.button
                          key={id}
                          type="button"
                          onClick={() => { setSelected(id); setError(""); }}
                          // COLOR_THEME: Conditional borders and shadows showing selected operator in Gold
                          style={{
                            background: selected === id ? "rgba(212,175,55,0.06)" : WHITE,
                            border: selected === id ? `2px solid ${GOLD}` : `2px solid rgba(0,33,71,0.1)`,
                            borderRadius: 14, padding: "16px 12px",
                            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                            boxShadow: selected === id ? `0 4px 16px rgba(212,175,55,0.15)` : `0 2px 8px rgba(0,33,71,0.04)`,
                            transition: "all 0.2s",
                          }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {id === "mtn" ? <MtnLogo /> : <OrangeLogo />}
                          <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: "11px", fontWeight: 700, color: selected === id ? NAVY : MUTED }}>
                            {id === "mtn" ? "MTN MoMo" : "Orange Money"}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Phone input */}
                  <div className="mb-8">
                    <label style={{ display: "flex", alignItems: "center", fontFamily: "Montserrat, sans-serif", fontSize: "11px", fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                      Handset Number
                    </label>
                    <div style={{ display: "flex", border: `2px solid rgba(0,33,71,0.1)`, borderRadius: 12, overflow: "hidden" }}>
                      {/* COLOR_THEME: Operator indicator has dark Navy background */}
                      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #003470 100%)`, padding: "0 16px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <Phone size={13} color={GOLD} />
                        <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: "14px", color: WHITE }}>+237</span>
                      </div>
                      <input
                        type="tel"
                        placeholder="6XX XXX XXX"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setError(""); }}
                        style={{
                          flex: 1, border: "none", outline: "none",
                          padding: "14px 16px",
                          fontFamily: "Montserrat, sans-serif", fontSize: "16px", fontWeight: 500,
                          color: NAVY, background: WHITE, letterSpacing: "0.06em",
                        }}
                      />
                    </div>
                  </div>

                  {/* Error messages */}
                  <AnimatePresence>
                    {error && (
                      <motion.div className="flex items-center gap-2" style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <AlertCircle size={14} color="#dc2626" />
                        <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "11px", color: "#dc2626", fontWeight: 500 }}>{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  {/* COLOR_THEME: Submit button uses gold gradient theme */}
                  <motion.button
                    type="button"
                    disabled={paying}
                    onClick={handlePayNow}
                    className="w-full flex items-center justify-center gap-3 disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_MUTED} 100%)`,
                      color: NAVY, fontFamily: "Montserrat, sans-serif", fontWeight: 800,
                      fontSize: "14px", letterSpacing: "0.1em",
                      borderRadius: 14, padding: "18px 24px",
                      border: "none", cursor: "pointer",
                      boxShadow: `0 6px 28px rgba(212,175,55,0.32)`,
                    }}
                    whileHover={{ scale: 1.01, boxShadow: `0 10px 36px rgba(212,175,55,0.48)` }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {paying ? "SENDING PROMPT..." : "PAY NOW"}
                  </motion.button>

                  <div className="mt-4">
                    <TrustStrip />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {screen === "processing" && paymentData && (
        <motion.div key="processing" style={processingWrapperStyle} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.4 }}>
          <div style={processingInnerStyle}>
            {!isModal && <RenderNavbar />}

            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyCenter: "center", padding: isModal ? "12px" : "32px 24px" }} className="flex-col justify-center text-center">
              <div style={{ maxWidth: 560, width: "100%" }} className={isModal ? "mx-auto" : "mx-auto mt-12"}>
                
                {/* Status Badge */}
                {/* COLOR_THEME: Yellow warning badge for pending USSD approval */}
                <motion.div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-5 py-1.5 mb-8" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <motion.div style={{ width: 8, height: 8, borderRadius: "50%", background: GOLD }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                  <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: "11px", fontWeight: 700, color: GOLD, letterSpacing: "0.1em" }}>AWAITING HANDSET AUTHORIZATION</span>
                </motion.div>

                {/* Animated loader */}
                <div className="flex justify-center mb-8">
                  <div style={{ position: "relative", width: 110, height: 110 }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} style={{ position: "absolute", inset: 0, border: `2px solid ${GOLD}`, borderRadius: "50%" }} initial={{ opacity: 0.7, scale: 0.7 }} animate={{ opacity: 0, scale: 1.5 }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }} />
                    ))}
                    {/* COLOR_THEME: Central circular logo box uses dark Navy and Gold border */}
                    <motion.div style={{ position: "absolute", inset: "14px", background: `linear-gradient(135deg, ${NAVY} 0%, #003470 100%)`, border: `3px solid ${GOLD}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
                      <Phone size={24} color={GOLD} />
                    </motion.div>
                  </div>
                </div>

                <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(32px,5vw,46px)", fontWeight: 600, color: WHITE, lineHeight: 1.1, marginBottom: 16 }}>
                  Check your phone
                </h1>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 420, margin: "0 auto 32px" }}>
                  A USSD push notification has been sent to <span style={{ color: GOLD, fontWeight: 700 }}>{paymentData.phone}</span>. Please enter your PIN on your mobile device to validate the escrow payment.
                </p>

                {/* Amount Recap */}
                {/* COLOR_THEME: Border colored with gold accent */}
                <div style={{ display: "inline-flex", gap: 32, background: "rgba(255,255,255,0.04)", border: `1px solid rgba(212,175,55,0.18)`, borderRadius: 16, padding: "16px 36px" }} className="mb-8 items-center">
                  <div className="text-left">
                    <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Total Charged</p>
                    <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", fontWeight: 700, color: GOLD }}>{formatXAF(paymentData.total)}</p>
                  </div>
                  <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.15)" }} />
                  <div className="text-left">
                    <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Mobile Carrier</p>
                    <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "13px", fontWeight: 700, color: WHITE, marginTop: 2 }}>
                      {paymentData.method === "orange" ? "Orange Money" : "MTN MoMo"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                  {/* COLOR_THEME: Verification action uses gold theme gradient */}
                  <motion.button
                    onClick={handleVerifyPaidStatus}
                    disabled={verifying}
                    className="flex items-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_MUTED} 100%)`,
                      color: NAVY, fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                      fontSize: "13px", letterSpacing: "0.08em",
                      borderRadius: 12, padding: "16px 36px",
                      border: "none", cursor: "pointer",
                      boxShadow: `0 6px 24px rgba(212,175,55,0.3)`,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    I HAVE PAID
                  </motion.button>
                  <motion.button
                    onClick={() => setScreen("payment")}
                    style={{
                      background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)",
                      fontFamily: "Montserrat, sans-serif", fontWeight: 600,
                      fontSize: "13px", letterSpacing: "0.06em",
                      borderRadius: 12, padding: "16px 28px",
                      border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                    whileHover={{ background: "rgba(255,255,255,0.12)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <X size={14} /> Cancel Transaction
                  </motion.button>
                </div>

                {/* Resend Cooldown Button */}
                <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
                  <motion.button
                    onClick={handleResendUSSD}
                    disabled={resendCountdown > 0 || resending}
                    className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      // COLOR_THEME: Button background changes dynamically based on active cooldown state
                      background: resendCountdown > 0 
                        ? "rgba(255,255,255,0.04)"
                        : `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_MUTED} 100%)`,
                      color: resendCountdown > 0 ? "rgba(255,255,255,0.4)" : NAVY,
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 700,
                      fontSize: "12px",
                      letterSpacing: "0.05em",
                      borderRadius: 12,
                      padding: "12px 24px",
                      border: resendCountdown > 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
                      cursor: "pointer",
                      boxShadow: resendCountdown > 0 ? "none" : `0 4px 16px rgba(212,175,55,0.2)`,
                    }}
                    whileHover={resendCountdown > 0 ? {} : { scale: 1.02 }}
                    whileTap={resendCountdown > 0 ? {} : { scale: 0.98 }}
                  >
                    {resending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wifi className="w-4 h-4" />
                    )}
                    {resendCountdown > 0 
                      ? `Resend ${paymentData.method === "orange" ? "Orange Money" : "MTN MoMo"} USSD in ${resendCountdown}s`
                      : `Resend ${paymentData.method === "orange" ? "Orange Money" : "MTN MoMo"} USSD to ${paymentData.phone}`}
                  </motion.button>
                </div>

              </div>
            </div>
          </div>
        </motion.div>
      )}

      {screen === "success" && paymentData && (
        <motion.div key="success" style={wrapperStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          {!isModal && <RenderNavbar />}

          <div style={{ display: "flex", alignItems: "center", justifyCenter: "center", padding: isModal ? "12px" : "48px 24px" }}>
            <div style={{ maxWidth: 600, width: "100%" }}>
              
              {/* Success Message Header */}
              <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* COLOR_THEME: Success icon wrapper uses soft green gradient background */}
                <motion.div style={{ display: "inline-flex", alignItems: "center", justifyCenter: "center", width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", marginBottom: 20, boxShadow: "0 8px 32px rgba(22,163,74,0.25)" }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }} className="flex justify-center items-center">
                  <CheckCircle2 size={48} color={SUCCESS_GREEN} strokeWidth={2} />
                </motion.div>
                <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(32px,4vw,46px)", fontWeight: 600, color: NAVY, letterSpacing: "0.01em", marginBottom: 8 }}>
                  Escrow Payment Verified!
                </h1>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "14px", color: MUTED, fontWeight: 500 }}>
                  Funds successfully deposited to escrow. dossier status has been updated.
                </p>
              </motion.div>

              {/* Amount Paid banner */}
              {/* COLOR_THEME: Success banner uses dark Navy gradient background */}
              <motion.div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #003470 100%)`, borderRadius: 20, padding: "24px 36px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 8px 32px rgba(0,33,71,0.25)" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Amount In Escrow</p>
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 700, color: GOLD, lineHeight: 1.1 }}>{formatXAF(paymentData.total)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Authorization Date</p>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "12px", fontWeight: 600, color: WHITE, marginTop: 4 }}>{paymentData.timestamp}</p>
                </div>
              </motion.div>

              {/* Transaction details card */}
              <motion.div style={{ background: WHITE, borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,33,71,0.06)", marginBottom: 24 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                {/* COLOR_THEME: Top decorative line on success card is gold gradient */}
                <div style={{ height: 4, background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)` }} />
                <div style={{ padding: "24px 28px" }}>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: "10px", fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                    Transaction Receipt Details
                  </p>
                  
                  {[
                    { label: "Reference ID", value: paymentData.refId },
                    { label: "Date & Time", value: paymentData.timestamp },
                    { label: "Payment Wallet", value: paymentData.method === "orange" ? "Orange Money" : "MTN MoMo" },
                    { label: "Phone", value: paymentData.phone },
                    { label: "Base Processing Fee", value: formatXAF(paymentData.amount) },
                    { label: "Surplus Platform Fee (10%)", value: formatXAF(paymentData.fee) },
                    { label: "Total Charged", value: formatXAF(paymentData.total), gold: true },
                    { label: "Escrow Status", value: "Verified & Locked", green: true },
                  ].map(({ label, value, gold, green }, i, arr) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(0,33,71,0.05)" : "none" }}>
                      <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: "12px", color: MUTED, fontWeight: 500 }}>{label}</span>
                      {/* COLOR_THEME: Table values use GOLD, SUCCESS_GREEN, or NAVY depending on field status */}
                      <span style={{
                        fontFamily: gold ? "Cormorant Garamond, serif" : "Montserrat, sans-serif",
                        fontSize: gold ? "18px" : "12px",
                        fontWeight: gold ? 700 : 600,
                        color: gold ? GOLD : green ? SUCCESS_GREEN : NAVY,
                      }}>{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div style={{ display: "flex", gap: 16, flexWrap: "wrap" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                {/* COLOR_THEME: Return to dashboard button has Navy background */}
                <motion.button
                  onClick={() => {
                    if (isModal) {
                      if (onSuccess) onSuccess();
                      if (onClose) onClose();
                    } else {
                      navigate('/dashboard/applications');
                    }
                  }}
                  style={{
                    flex: 1, minWidth: 200,
                    background: `linear-gradient(135deg, ${NAVY} 0%, #003470 100%)`,
                    color: WHITE, fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                    fontSize: "13px", letterSpacing: "0.08em",
                    borderRadius: 12, padding: "16px 24px",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyCenter: "center", gap: 8,
                    boxShadow: "0 6px 24px rgba(0,33,71,0.2)",
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LayoutDashboard size={16} /> GO TO DASHBOARD
                </motion.button>

                {/* COLOR_THEME: Download receipt button styled with gold border highlighting on hover */}
                <motion.button
                  onClick={() => downloadReceipt(paymentData)}
                  style={{
                    flex: 1, minWidth: 200,
                    background: WHITE, color: NAVY,
                    fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                    fontSize: "13px", letterSpacing: "0.06em",
                    borderRadius: 12, padding: "16px 24px",
                    border: `2px solid rgba(0,33,71,0.15)`, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyCenter: "center", gap: 8,
                    boxShadow: "0 2px 10px rgba(0,33,71,0.06)",
                  }}
                  whileHover={{ background: SURFACE, borderColor: GOLD }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download size={16} /> DOWNLOAD RECEIPT (PDF)
                </motion.button>
              </motion.div>

              <div className="mt-8">
                <TrustStrip />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
