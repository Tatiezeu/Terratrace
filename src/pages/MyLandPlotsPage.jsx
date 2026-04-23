import { useState } from "react";
import { mockLandPlots } from "../data/mockData";
import { LandPlotCard } from "../app/components/land/LandPlotCard";
import { LandPlotModal } from "../app/components/land/LandPlotModal";
import { TransferRequestModal } from "../app/components/land/TransferRequestModal";

export default function MyLandPlotsPage() {
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // In a real app, this would be filtered by the logged-in user's ID
  const myPlots = mockLandPlots.filter(plot => 
    plot.status === "under_transfer" || plot.landCode === "10005-D1-54321-001"
  );

  const handleSeeMore = (plot) => {
    setSelectedPlot(plot);
    setIsModalOpen(true);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myPlots.map((plot) => (
          <LandPlotCard
            key={plot.id}
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
