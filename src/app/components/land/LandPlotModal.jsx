import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { MapPin, Calendar, User, Ruler, DollarSign, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { TransferStatusPipeline } from "../transfer/TransferStatusPipeline";
import { BlockchainBadge } from "../shared/BlockchainBadge";

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
  if (!plot) return null;

  const statusConfig = getStatusConfig(plot.status);

  return (
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
            {plot.matterportId && <TabsTrigger value="360">360° View</TabsTrigger>}
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
                        <p className="font-semibold text-foreground">{record.owner}</p>
                        <Badge variant="outline" className="text-xs">
                          {record.transferType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
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

          {plot.matterportId && (
            <TabsContent value="360" className="mt-6">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                <iframe
                  src={`https://my.matterport.com/show/?m=${plot.matterportId}`}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="xr-spatial-tracking"
                  title="360° Virtual Tour"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Interactive 360° virtual tour powered by Matterport
              </p>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
