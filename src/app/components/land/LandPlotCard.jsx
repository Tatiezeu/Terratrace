// BEHAVIOR: Renders a card displaying land plot metrics, status badge, cover image, 360 tour option, and buttons to initiate transfers.
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
// BEHAVIOR: Lucide React icons representing action points
import { MapPin, Shield, Eye, Lock, RefreshCw, Send, CheckCircle2, AlertTriangle } from "lucide-react";
// BEHAVIOR: Framer Motion for entrance animations
import { motion } from "motion/react";
// BEHAVIOR: Classname merger utility
import { cn } from "../ui/utils";
// BEHAVIOR: Auth hook to check current user roles and ownership
import { useAuth } from "../../../context/AuthContext";
// BACKEND_CONNECTION: Axios API helper for REST requests
import api from "../../../utils/api";
// BEHAVIOR: Toast notifications
import { toast } from "sonner";
// BEHAVIOR: Cache invalidator client
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

// BEHAVIOR: Resolves visual label and Tailwind color class for plot states
const getStatusConfig = (status) => {
  switch (status) {
    case "clear":
    case "cleared":
      return {
        label: "Clear",
        // COLOR_THEME: Muted green for safe/clear plots
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0",
      };
    case "under_transfer":
    case "under_review":
    case "pending":
      return {
        label: "Processing",
        // COLOR_THEME: Processing/blue color accents
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0",
      };
    case "disputed":
      return {
        label: "Disputed",
        // COLOR_THEME: Alert/red highlights for disputes
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0",
      };
    case "flagged":
      return {
        label: "State Land",
        // COLOR_THEME: Amber color highlighting government-owned lands
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0",
      };
    case "blocked":      
      return {        
        label: "Blocked",        
        // COLOR_THEME: Deep red styling for administrative blocks
        className: "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300 border border-red-300",      
      };
    case "transferred":
        return {
          label: "Transferred",
          // COLOR_THEME: Purple accent for final transferred status
          className: "bg-purple-100 text-purple-700 border-purple-200",
        };
    default:
        return {
            label: status,
            // COLOR_THEME: Fallback gray color style
            className: "bg-muted text-muted-foreground border-0",
        };
  }
};

// BEHAVIOR: Renders the individual Land Plot item representation
export function LandPlotCard({ plot, onSeeMore, onInitiateTransfer, onView360 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const statusConfig = getStatusConfig(plot.status);

  // BEHAVIOR: Evaluates ownership: checks if user ID matches owner, or if admin is checking root/unassigned plots
  const isOwner = user && (
    plot.owner?._id === user._id || 
    plot.owner === user._id || 
    (user.role === 'Admin' && plot.landCode?.split('-')[2] === '00000')
  );
  // BEHAVIOR: Determines if the plot belongs to the government/state (identifier 00050)
  const isPublic = plot.landType === "00050";

  // BACKEND_CONNECTION: POST /notifications/unblock-request - Requests an administrator to unblock the plot
  const handleUnblockRequest = () => {
    api.post('/notifications/unblock-request', { plotId: plot._id, plotCode: plot.landCode })
      .then(() => {
        toast.success("Request sent to Admin");
        // BEHAVIOR: Invalidates cached queries to force list updates in background
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['transfers'] });
      })
      .catch(err => {
        console.error("Unblock req error:", err);
        toast.error(err.response?.data?.message || "Failed to send request");
      });
  };

  // BACKEND_CONNECTION: POST /transfer/plot/:id/undispute - Requests LRO to resolve the plot dispute status
  const handleUndisputeRequest = () => {
    const message = prompt("Please enter your justification to lift the dispute:");
    if (!message) return;
    api.post(`/transfer/plot/${plot._id}/undispute`, { message })
      .then(() => {
        toast.success("Undispute request sent to Land Registry Officer");
        // BEHAVIOR: Invalidates cached queries to trigger dashboard sync
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['transfers'] });
      })
      .catch(err => toast.error("Failed to send request"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* BEHAVIOR: Image layout wrapper */}
      <div className="relative h-56 overflow-hidden bg-muted">
        {/* BACKEND_CONNECTION: Displays cover image served by backend assets or CDN URL */}
        <img
          src={plot.coverImage?.startsWith('http') ? plot.coverImage : `http://localhost:5001${plot.coverImage || '/assets/images/plots/default-plot.jpg'}`}
          alt={plot.landCode}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* BEHAVIOR: Render 360 tour button for plot virtual tour */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onView360 && onView360(plot);
          }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.1 }}
          // COLOR_THEME: Black overlay background with white text styling
          className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black tracking-wider uppercase rounded-full px-2.5 py-1.5 shadow-lg border border-white/20 z-10 cursor-pointer"
        >
          <Eye className="w-3 h-3 text-[#D4AF37]" /> 360° View
        </motion.button>

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
            {/* COLOR_THEME: Uses Terra Navy styling for important code tags */}
            <p className="text-base font-bold font-mono text-[var(--terra-navy)] mt-0.5 break-all">{plot.landCode}</p>
          </div>
          {/* COLOR_THEME: Verified stamp green background and border */}
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
            {!isOwner && plot.owner && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  const ownerId = typeof plot.owner === 'object' ? plot.owner._id || plot.owner.id : plot.owner;
                  if (!ownerId) {
                    toast.error("Landowner details not found");
                    return;
                  }
                  const regionMap = {
                    "01": "Adamaoua",
                    "02": "Centre",
                    "03": "East",
                    "04": "Far North",
                    "05": "Littoral",
                    "06": "North",
                    "07": "North West",
                    "08": "West",
                    "09": "South",
                    "10": "South West"
                  };
                  const segments = (plot.landCode || "").split("-");
                  const regionName = regionMap[segments[1]] || "Unknown Region";
                  const subject = `Inquiry regarding Land Plot ${plot.landCode}`;
                  const body = `Hello, I would like to inquire about your land plot (Code: ${plot.landCode}) located in ${regionName}.`;
                  navigate(`/dashboard/notifications?recipientId=${ownerId}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                Contact Now
              </Button>
            )}
            {/* BEHAVIOR: Render administrative state-togglers only for Admin role */}
            {user?.role === 'Admin' && (
              <Button
                onClick={() => {
                  // BEHAVIOR: Cycles plot status through specific states on Admin click
                  const nextMap = { 'cleared': 'blocked', 'blocked': isPublic ? 'flagged' : 'cleared', 'flagged': 'blocked', 'transferred': 'cleared' };
                  const newStatus = nextMap[plot.status] || 'cleared';
                  // BACKEND_CONNECTION: PATCH /land/:id/status - Admin forces a status override in the database
                  api.patch(`/land/${plot._id}/status`, { status: newStatus })
                    .then(() => {
                      toast.success(`Status updated to ${newStatus}`);
                      // BEHAVIOR: Invalidation triggers server data reload
                      queryClient.invalidateQueries({ queryKey: ['land'] });
                      queryClient.invalidateQueries({ queryKey: ['land', 'my-plots'] });
                    });
                }}
                variant="ghost" size="icon" className="shrink-0 border border-border"
              >
                {/* COLOR_THEME: Updates icon color dynamically based on state (blocked red vs cleared green) */}
                <RefreshCw className={cn("w-4 h-4", plot.status === 'blocked' ? "text-red-500" : "text-emerald-500")} />
              </Button>
            )}
          </div>

          {/* BEHAVIOR: Workflow actions based on the specific plot status */}
          {plot.status === "blocked" ? (
            <div className="space-y-2">
              {/* COLOR_THEME: Blocked banner red background styling */}
              <Button disabled className="w-full bg-red-100 text-red-700 border-red-200"><Lock className="w-4 h-4 mr-2" /> Blocked</Button>
              {isOwner && <Button onClick={handleUnblockRequest} variant="outline" className="w-full text-xs font-bold border-red-200 text-red-600 hover:bg-red-50">Send Unblock Request</Button>}
            </div>
          ) : plot.status === "disputed" ? (
            <div className="space-y-2">
              {/* COLOR_THEME: Disputed alert deep red background styling */}
              <Button disabled className="w-full bg-red-600 text-white"><AlertTriangle className="w-4 h-4 mr-2" /> DISPUTED</Button>
              {isOwner && <Button onClick={handleUndisputeRequest} variant="outline" className="w-full text-xs font-bold border-red-400 text-red-700 hover:bg-red-50">Submit Undispute Request</Button>}
            </div>
          ) : plot.status === "transferred" ? (
            <div className="space-y-2">
              {/* COLOR_THEME: Purple background for Transferred badge */}
              <Button disabled className="w-full bg-purple-100 text-purple-700 border-purple-200"><CheckCircle2 className="w-4 h-4 mr-2" /> Transferred</Button>
              {isOwner && <Button onClick={handleUnblockRequest} variant="outline" className="w-full text-xs font-bold border-purple-200 text-purple-600 hover:bg-purple-50">Request Activation</Button>}
            </div>
          ) : (
            // BEHAVIOR: Prevents Land Registry Officers and Notaries from initiating client transfers
            !(user?.role === 'LRO' || user?.role === 'Notary') && (
              <Button
                onClick={() => onInitiateTransfer(plot)}
                disabled={
                  isOwner || 
                  ['under_review', 'pending', 'under_transfer', 'Public_Notice'].includes(plot.status) ||
                  (plot.lastTransferDate && (new Date() - new Date(plot.lastTransferDate) < 365 * 24 * 60 * 60 * 1000) && plot.status === 'transferred')
                }
                // COLOR_THEME: Navy for government direct grants, Emerald green for client-to-client transfers
                className={cn("w-full text-white", isPublic ? "bg-[var(--terra-navy)] hover:bg-blue-900" : "bg-[var(--terra-emerald)] hover:bg-emerald-600")}
              >
                {isOwner ? (
                  <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Your Property</span>
                ) : (new Date() - new Date(plot.lastTransferDate) < 365 * 24 * 60 * 60 * 1000 && plot.status === 'transferred') ? (
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight"><Lock className="w-3 h-3" /> Resale Locked (1yr)</span>
                ) : (isPublic ? "Direct Grant" : "Initiate Transfer")}
              </Button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
