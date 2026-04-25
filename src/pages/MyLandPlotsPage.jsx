import { useState } from "react";
import { mockLandPlots } from "../data/mockData";
import { LandPlotCard } from "../app/components/land/LandPlotCard";
import { LandPlotModal } from "../app/components/land/LandPlotModal";
import { TransferRequestModal } from "../app/components/land/TransferRequestModal";
import { useEffect, useMemo } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext"; // Assuming AuthContext exists

export default function MyLandPlotsPage() {
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const { user } = useAuth();
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyPlots = async () => {
      try {
        const response = await api.get('/land/my-plots');
        if (response.data.success) {
          setPlots(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch my plots:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyPlots();
  }, []);

  // Filter based on land code owner segment as requested
  const myPlots = useMemo(() => {
    if (!user) return plots;
    
    // If SuperAdmin, they should also see State Land (ownerId 00000)
    const isSuperAdmin = user.role === 'SuperAdmin';
    const ownerIdFromCNI = user.cniNumber ? user.cniNumber.slice(-5).padStart(5, '0') : null;
    
    return plots.filter(plot => {
      const plotOwnerId = plot.landCode.split('-')[2];
      if (isSuperAdmin && plotOwnerId === '00000') return true;
      return plotOwnerId === ownerIdFromCNI;
    });
  }, [plots, user]);

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
