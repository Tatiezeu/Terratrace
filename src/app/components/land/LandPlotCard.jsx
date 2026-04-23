import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { MapPin, Shield, Eye } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../ui/utils";

const getStatusConfig = (status) => {
  switch (status) {
    case "clear":
      return {
        label: "Clear",
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0",
      };
    case "under_transfer":
      return {
        label: "Under Transfer",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0",
      };
    case "disputed":
      return {
        label: "Disputed",
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0",
      };
    default:
        return {
            label: status,
            className: "bg-muted text-muted-foreground border-0",
        };
  }
};

export function LandPlotCard({ plot, onSeeMore, onInitiateTransfer, onView360 }) {
  const statusConfig = getStatusConfig(plot.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden bg-muted">
        <img
          src={plot.image}
          alt={plot.landCode}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Floating 360° badge — always visible, gently animated */}
        {plot.matterportId && (
          <motion.button
            onClick={() => onView360 && onView360(plot)}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.1 }}
            className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black tracking-wider uppercase rounded-full px-2.5 py-1.5 shadow-lg border border-white/20"
            aria-label="View 360°"
          >
            <Eye className="w-3 h-3" />
            360°
          </motion.button>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <Badge className={cn("font-semibold", statusConfig.className)}>
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Land Code */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Land Code
            </p>
            <p className="text-base font-bold font-mono text-[var(--terra-navy)] dark:text-[var(--terra-emerald)] mt-0.5 break-all">
              {plot.landCode}
            </p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 ml-2 flex-shrink-0">
            <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" />
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              VERIFIED
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4" />
          <span>{plot.location}</span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground">Area</p>
            <p className="text-sm font-semibold text-foreground">{plot.area}m²</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-sm font-semibold text-foreground">
              {plot.price.toLocaleString()} XAF
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={() => onSeeMore(plot)}
            variant="outline"
            className="w-full"
          >
            See More
          </Button>

          {plot.status === "clear" && onInitiateTransfer && (
            <Button
              onClick={() => onInitiateTransfer(plot)}
              className="w-full bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white"
            >
              Initiate Transfer
            </Button>
          )}

          {plot.status === "disputed" && (
            <Button disabled className="w-full" variant="destructive">
              Transfer Blocked - Dispute Active
            </Button>
          )}

          {plot.status === "under_transfer" && (
            <Button disabled className="w-full" variant="secondary">
              Transfer In Progress
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
