import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { MapPin, Calendar, User, Ruler, DollarSign, Database, Maximize2, Minimize2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { TransferStatusPipeline } from "../transfer/TransferStatusPipeline";
import { BlockchainBadge } from "../shared/BlockchainBadge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "../ui/button";
import { toast } from "sonner";

import { getValidMatterportId } from "../../../utils/matterport";

// BEHAVIOR: Resolves visual label and Tailwind color class for plot states
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

export function LandPlotModal({ plot, open, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [is360Maximized, setIs360Maximized] = useState(false);

  if (!plot) return null;

  const effectiveMatterportId = getValidMatterportId(plot.matterportId, plot.landCode);
  const statusConfig = getStatusConfig(plot.status);

  const isOwner = user && (
    plot.owner?._id === user._id || 
    plot.owner === user._id || 
    (user.role === 'Admin' && plot.landCode?.split('-')[2] === '00000')
  );

  return (
    <>
      {/* 360 Fullscreen Overlay — portaled to document.body to fill exact main workspace area */}
      {is360Maximized && createPortal(
        <div className="fixed top-0 right-0 bottom-0 left-0 md:left-64 z-[999999] bg-[#090D14] flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                360° Virtual Tour — <span style={{ color: '#D4AF37' }}>{plot.landCode}</span>
              </h3>
              <p className="text-xs text-white/50">{plot.location}</p>
            </div>
            <button
              onClick={() => setIs360Maximized(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#002147] hover:brightness-110 text-xs font-bold transition-all shadow-lg">
              <Minimize2 size={15} /> Exit Fullscreen
            </button>
          </div>
          <div className="flex-1 mt-4 rounded-2xl overflow-hidden border border-white/10 bg-black">
            <iframe
              src={`https://my.matterport.com/show/?m=${effectiveMatterportId}`}
              className="w-full h-full border-0"
              allow="xr-spatial-tracking"
              title="360° Virtual Tour Fullscreen"
            />
          </div>
        </div>,
        document.body
      )}

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">

          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold font-['Syne']">
                  {plot.landCode}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4" />
                  {plot.location}
                </DialogDescription>
                <div className="mt-3">
                  <BlockchainBadge />
                </div>
              </div>
              <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
            </div>
          </DialogHeader>

          {/* Transfer Status Pipeline */}
          {plot.status === "under_transfer" && (
            <div className="mb-4">
              <TransferStatusPipeline status="notary_verified" />
            </div>
          )}

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">Ownership History</TabsTrigger>
              <TabsTrigger value="360">360° View</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              {/* Image */}
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={plot.coverImage?.startsWith('http') ? plot.coverImage : `http://localhost:5001${plot.coverImage || '/assets/images/plots/default-plot.jpg'}`}
                  alt={plot.landCode}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[var(--terra-emerald)]/10">
                      <Ruler className="w-5 h-5 text-[var(--terra-emerald)]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Area</p>
                      <p className="text-lg font-semibold">{plot.area}m²</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[var(--terra-emerald)]/10">
                      <DollarSign className="w-5 h-5 text-[var(--terra-emerald)]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-lg font-semibold">
                        {plot.price.toLocaleString()} XAF
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[var(--terra-navy)]/10">
                      <User className="w-5 h-5 text-[var(--terra-navy)] dark:text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Owner</p>
                      <p className="text-lg font-semibold">
                        {plot.landType === '00050' ? 'Government of Cameroon' : (typeof plot.owner === 'object' ? `${plot.owner?.firstName} ${plot.owner?.lastName}` : (plot.owner || 'Unknown'))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[var(--terra-navy)]/10">
                      <Database className="w-5 h-5 text-[var(--terra-navy)] dark:text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Land Category</p>
                      <p className="text-lg font-semibold">
                        {plot.landType === '00050' ? 'Public (State Land)' : 'Private Land'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[var(--terra-navy)]/10">
                      <MapPin className="w-5 h-5 text-[var(--terra-navy)] dark:text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">GPS Coordinates</p>
                      <p className="text-sm font-mono">
                        {plot.coordinates?.lat?.toFixed(4) || 0}, {plot.coordinates?.lng?.toFixed(4) || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* GPS Boundaries Note */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">GPS Boundaries:</span>{" "}
                  Full boundary coordinates available in cadastral survey plans. Contact
                  Land Registry Officer for detailed survey maps.
                </p>
              </div>

              {!isOwner && plot.owner && (
                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={() => {
                      const ownerId = typeof plot.owner === 'object' ? plot.owner._id || plot.owner.id : plot.owner;
                      if (!ownerId) {
                        toast.error("Landowner details not found");
                        return;
                      }
                      const regionMap = {
                        "01": "Adamaoua", "02": "Centre", "03": "East", "04": "Far North", "05": "Littoral",
                        "06": "North", "07": "North West", "08": "West", "09": "South", "10": "South West"
                      };
                      const segments = (plot.landCode || "").split("-");
                      const regionName = regionMap[segments[1]] || "Unknown Region";
                      const subject = `Inquiry regarding Land Plot ${plot.landCode}`;
                      const body = `Hello, I would like to inquire about your land plot (Code: ${plot.landCode}) located in ${regionName}.`;
                      navigate(`/dashboard/notifications?recipientId=${ownerId}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                      onClose && onClose();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl h-11 px-6 shadow-md"
                  >
                    Contact Landowner
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-6">
              {plot.ownershipHistory && plot.ownershipHistory.length > 0 ? (
                <div className="space-y-3">
                  {plot.ownershipHistory.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-[var(--terra-navy)]/10 flex-shrink-0">
                        <Calendar className="w-5 h-5 text-[var(--terra-navy)] dark:text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">
                            {typeof record.owner === 'object' 
                              ? `${record.owner?.firstName} ${record.owner?.lastName}` 
                              : (record.owner || 'Previous Owner')}
                          </p>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 border-emerald-100">
                            {record.transferType?.replace('_', ' ') || 'Transfer'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Owner from {record.acquiredDate ? new Date(record.acquiredDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' }) : "Initial Registration"} 
                          {" till "} 
                          {new Date(record.transferDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-tighter opacity-70">
                          Archive Ref: {record.previousLandCode || "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No ownership history available
                </p>
              )}
            </TabsContent>

            <TabsContent value="360" className="mt-6">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border group">
                <iframe
                  src={`https://my.matterport.com/show/?m=${effectiveMatterportId}`}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="xr-spatial-tracking"
                  title="360° Virtual Tour"
                />
                <button
                  onClick={() => setIs360Maximized(true)}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-semibold shadow-lg backdrop-blur-sm transition-all border border-white/20">
                  <Maximize2 size={13} /> Maximize Screen View
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Interactive 360° virtual tour powered by Matterport
              </p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
