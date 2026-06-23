import { useState, useMemo, useEffect } from "react";
import { LandPlotCard } from "../app/components/land/LandPlotCard";
import { LandPlotModal } from "../app/components/land/LandPlotModal";
import { TransferRequestModal } from "../app/components/land/TransferRequestModal";
import { useAuth } from "../context/AuthContext";
import { useMyLandPlots } from "../hooks/useLandData";
import { logActivity } from "../utils/logger";

export default function MyLandPlotsPage() {
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const { user, refreshUser } = useAuth();

  // Refresh user profile if they are a Client to check if they have been upgraded to Landowner
  useEffect(() => {
    if (user && user.role === 'Client') {
      refreshUser();
    }
  }, []);

  // ─── Server state via TanStack Query (cached, deduped) ────────────────────
  const { data: plots = [], isLoading } = useMyLandPlots();

  // Filter based on land code owner segment as requested
  const myPlots = useMemo(() => {
    if (!user) return [];
    if (user.role === 'Client') return [];
    
    // If Admin, they should also see State Land (ownerId 00000)
    const isAdmin = user.role === 'Admin';
    const ownerIdFromCNI = user.cniNumber ? user.cniNumber.slice(-5).padStart(5, '0') : null;
    
    return plots.filter(plot => {
      const plotOwnerId = plot.landCode.split('-')[2];
      if (isAdmin && plotOwnerId === '00000') return true;
      return plotOwnerId === ownerIdFromCNI;
    });
  }, [plots, user]);

  const handleSeeMore = (plot) => {
    setSelectedPlot(plot);
    setIsModalOpen(true);
    logActivity('Read', `User viewed details for Plot '${plot.landCode}'`);
  };

  const handleInitiateTransfer = (plot) => {
    setSelectedPlot(plot);
    setIsTransferModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-['Syne']">My Land Portfolio</h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Manage your registered land assets and track ongoing transfer requests.
        </p>
      </div>

      {isLoading && myPlots.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4 space-y-4">
              <div className="h-56 bg-muted rounded-lg animate-pulse" />
              <div className="space-y-3">
                <div className="h-5 w-1/3 bg-muted rounded-md animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded-md animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-9 w-24 bg-muted rounded-lg animate-pulse" />
                <div className="h-9 w-24 bg-muted rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPlots.map((plot) => (
              <LandPlotCard
                key={plot._id || plot.id}
                plot={plot}
                onSeeMore={handleSeeMore}
                onInitiateTransfer={handleInitiateTransfer}
              />
            ))}
          </div>

          {myPlots.length === 0 && (
            <div className="text-center py-20 bg-card border border-border rounded-2xl">
              <p className="text-muted-foreground">You don't have any registered land plots yet.</p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <LandPlotModal
        plot={selectedPlot}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      <TransferRequestModal
        plot={selectedPlot}
        open={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </div>
  );
}
