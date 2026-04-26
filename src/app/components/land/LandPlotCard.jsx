import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { MapPin, Shield, Eye, Lock, RefreshCw, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../ui/utils";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";
import { toast } from "sonner";

const getStatusConfig = (status) => {
  switch (status) {
    case "clear":
    case "cleared":
      return {
        label: "Clear",
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0",
      };
    case "under_transfer":
    case "under_review":
    case "pending":
      return {
        label: "Processing",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0",
      };
    case "disputed":
      return {
        label: "Disputed",
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0",
      };
    case "flagged":
      return {
        label: "State Land",
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0",
      };
    case "blocked":      
      return {        
        label: "Blocked",        
        className: "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300 border border-red-300",      
      };
    case "transferred":
        return {
          label: "Transferred",
          className: "bg-purple-100 text-purple-700 border-purple-200",
        };
    default:
        return {
            label: status,
            className: "bg-muted text-muted-foreground border-0",
        };
  }
};

export function LandPlotCard({ plot, onSeeMore, onInitiateTransfer, onView360 }) {
  const { user } = useAuth();
  const statusConfig = getStatusConfig(plot.status);

  const isOwner = user && (
    plot.owner?._id === user._id || 
    plot.owner === user._id || 
    (user.role === 'SuperAdmin' && plot.landCode?.split('-')[2] === '00000')
  );
  const isPublic = plot.landType === "00050";

  const handleUnblockRequest = () => {
    api.post('/notifications/unblock-request', { plotId: plot._id, plotCode: plot.landCode })
      .then(() => toast.success("Request sent to Super Admin"))
      .catch(err => {
        console.error("Unblock req error:", err);
        toast.error(err.response?.data?.message || "Failed to send request");
      });
  };

  const handleUndisputeRequest = () => {
    const message = prompt("Please enter your justification to lift the dispute:");
    if (!message) return;
    api.post(`/transfer/plot/${plot._id}/undispute`, { message })
      .then(() => toast.success("Undispute request sent to Land Registry Officer"))
      .catch(err => toast.error("Failed to send request"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="relative h-56 overflow-hidden bg-muted">
        <img
          src={plot.coverImage?.startsWith('http') ? plot.coverImage : `http://localhost:5001${plot.coverImage || '/assets/images/plots/default-plot.jpg'}`}
          alt={plot.landCode}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {plot.matterportId && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onView360 && onView360(plot);
            }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.1 }}
            className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black tracking-wider uppercase rounded-full px-2.5 py-1.5 shadow-lg border border-white/20 z-10"
          >
            <Eye className="w-3 h-3" /> 360°
          </motion.button>
        )}

        <div className="absolute top-4 left-4">
          <Badge className={cn("font-semibold", statusConfig.className)}>
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Land Code</p>
            <p className="text-base font-bold font-mono text-[var(--terra-navy)] mt-0.5 break-all">{plot.landCode}</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 ml-2 flex-shrink-0">
            <Shield className="w-3 h-3 text-emerald-600" fill="currentColor" />
            <span className="text-[10px] font-semibold text-emerald-700 uppercase">VERIFIED</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4" />
          <span>{plot.location}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-border">
          <div><p className="text-xs text-muted-foreground">Area</p><p className="text-sm font-semibold">{plot.area}m²</p></div>
          <div><p className="text-xs text-muted-foreground">Price</p><p className="text-sm font-semibold">{plot.price.toLocaleString()} XAF</p></div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Button onClick={() => onSeeMore(plot)} variant="outline" className="flex-1">See More</Button>
            {user?.role === 'SuperAdmin' && (
              <Button
                onClick={() => {
                  const nextMap = { 'cleared': 'blocked', 'blocked': isPublic ? 'flagged' : 'cleared', 'flagged': 'blocked', 'transferred': 'cleared' };
                  const newStatus = nextMap[plot.status] || 'cleared';
                  api.patch(`/land/${plot._id}/status`, { status: newStatus })
                    .then(() => { toast.success(`Status updated to ${newStatus}`); window.dispatchEvent(new CustomEvent('land-updated')); });
                }}
                variant="ghost" size="icon" className="shrink-0 border border-border"
              >
                <RefreshCw className={cn("w-4 h-4", plot.status === 'blocked' ? "text-red-500" : "text-emerald-500")} />
              </Button>
            )}
          </div>

          {plot.status === "blocked" ? (
            <div className="space-y-2">
              <Button disabled className="w-full bg-red-100 text-red-700 border-red-200"><Lock className="w-4 h-4 mr-2" /> Blocked</Button>
              {isOwner && <Button onClick={handleUnblockRequest} variant="outline" className="w-full text-xs font-bold border-red-200 text-red-600 hover:bg-red-50">Send Unblock Request</Button>}
            </div>
          ) : plot.status === "disputed" ? (
            <div className="space-y-2">
              <Button disabled className="w-full bg-red-600 text-white"><AlertTriangle className="w-4 h-4 mr-2" /> DISPUTED</Button>
              {isOwner && <Button onClick={handleUndisputeRequest} variant="outline" className="w-full text-xs font-bold border-red-400 text-red-700 hover:bg-red-50">Submit Undispute Request</Button>}
            </div>
          ) : plot.status === "transferred" ? (
            <div className="space-y-2">
              <Button disabled className="w-full bg-purple-100 text-purple-700 border-purple-200"><CheckCircle2 className="w-4 h-4 mr-2" /> Transferred</Button>
              {isOwner && <Button onClick={handleUnblockRequest} variant="outline" className="w-full text-xs font-bold border-purple-200 text-purple-600 hover:bg-purple-50">Request Activation</Button>}
            </div>
          ) : (
            <Button
              onClick={() => onInitiateTransfer(plot)}
              disabled={
                isOwner || 
                ['under_review', 'pending', 'under_transfer', 'Public_Notice'].includes(plot.status) ||
                (plot.lastTransferDate && (new Date() - new Date(plot.lastTransferDate) < 365 * 24 * 60 * 60 * 1000) && plot.status === 'transferred')
              }
              className={cn("w-full text-white", isPublic ? "bg-[var(--terra-navy)] hover:bg-blue-900" : "bg-[var(--terra-emerald)] hover:bg-emerald-600")}
            >
              {isOwner ? (
                <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Your Property</span>
              ) : (new Date() - new Date(plot.lastTransferDate) < 365 * 24 * 60 * 60 * 1000 && plot.status === 'transferred') ? (
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight"><Lock className="w-3 h-3" /> Resale Locked (1yr)</span>
              ) : (isPublic ? "Direct Grant" : "Initiate Transfer")}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
