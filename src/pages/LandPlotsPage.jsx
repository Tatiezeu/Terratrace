import { useState, useMemo, useEffect } from "react";
import { mockLandPlots, mockOfficers } from "../data/mockData";
import api from "../utils/api";
import { LandPlotCard } from "../app/components/land/LandPlotCard";
import { LandPlotModal } from "../app/components/land/LandPlotModal";
import { TransferRequestModal } from "../app/components/land/TransferRequestModal";
import { Input } from "../app/components/ui/input";
import { Button } from "../app/components/ui/button";
import { Badge } from "../app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../app/components/ui/dialog";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function LandPlotsPage() {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 100000000]); // Temporary default
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [is360Open, setIs360Open] = useState(false);
  const [matterportPlot, setMatterportPlot] = useState(null);

  useEffect(() => {
    const fetchPlots = async () => {
      try {
        const response = await api.get('/land');
        if (response.data.success) {
          setPlots(response.data.data);
          // Update price range if plots exist
          if (response.data.data.length > 0) {
            const max = Math.max(...response.data.data.map(p => p.price));
            setPriceRange([0, max]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch plots:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlots();
  }, []);

  const filteredPlots = useMemo(() => {
    return plots.filter((plot) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        plot.landCode.toLowerCase().includes(q) ||
        plot.location.toLowerCase().includes(q) ||
        (plot.landType === '00050' ? 'government of cameroon'.includes(q) : (plot.owner ? `${plot.owner.firstName} ${plot.owner.lastName}`.toLowerCase().includes(q) : false));

      const matchesLocation =
        selectedLocation === "All" ||
        plot.location.includes(selectedLocation);

      const matchesPrice =
        plot.price >= priceRange[0] && plot.price <= priceRange[1];

      return matchesSearch && matchesLocation && matchesPrice;
    });
  }, [searchQuery, selectedLocation, priceRange, plots]);

  const ALL_LOCATIONS = useMemo(() => ["All", ...new Set(plots.map((p) => p.location.split(",")[1]?.trim() || p.location))], [plots]);
  const MAX_PRICE = useMemo(() => plots.length > 0 ? Math.max(...plots.map((p) => p.price)) : 100000000, [plots]);
  const MIN_PRICE = 0;

  const activeFilterCount =
    (selectedLocation !== "All" ? 1 : 0) +
    (priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE ? 1 : 0);

  const clearFilters = () => {
    setSelectedLocation("All");
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setSearchQuery("");
  };

  const handleSeeMore = (plot) => {
    setSelectedPlot(plot);
    setIsModalOpen(true);
  };

  const handleInitiateTransfer = (plot) => {
    setSelectedPlot(plot);
    setIsTransferModalOpen(true);
  };

  const handleView360 = (plot) => {
    setMatterportPlot(plot);
    setIs360Open(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-['Syne']">Land Registry Exploration</h1>
        <p className="text-muted-foreground mt-1 text-base">
          Browse and verify all registered land plots across Cameroon.
        </p>
      </div>

      {/* Search + Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by land code, location, or owner name..."
              className="pl-10 h-12 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            className="h-12 px-5 rounded-xl gap-2 relative"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--terra-emerald)] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" onClick={clearFilters} className="h-12 gap-2 text-muted-foreground">
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Expandable Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border border-border rounded-xl p-5 bg-card space-y-5">
                {/* Location Filter */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setSelectedLocation(loc)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                          selectedLocation === loc
                            ? "bg-[var(--terra-navy)] text-white border-[var(--terra-navy)]"
                            : "border-border hover:border-[var(--terra-navy)] hover:bg-muted"
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Slider */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Price Range (XAF)
                  </p>
                  <div className="space-y-3 px-1">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-[var(--terra-emerald)]">{priceRange[0].toLocaleString()} XAF</span>
                      <span className="text-[var(--terra-emerald)]">{priceRange[1].toLocaleString()} XAF</span>
                    </div>
                    {/* Min slider */}
                    <div className="relative h-6 flex items-center">
                      <div className="absolute w-full h-2 bg-muted rounded-full" />
                      <div
                        className="absolute h-2 bg-[var(--terra-emerald)] rounded-full"
                        style={{
                          left: `${(priceRange[0] / MAX_PRICE) * 100}%`,
                          right: `${100 - (priceRange[1] / MAX_PRICE) * 100}%`,
                        }}
                      />
                      <input
                        type="range"
                        min={MIN_PRICE}
                        max={MAX_PRICE}
                        step={500000}
                        value={priceRange[0]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val < priceRange[1]) setPriceRange([val, priceRange[1]]);
                        }}
                        className="absolute w-full appearance-none bg-transparent cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                          [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:bg-[var(--terra-navy)] [&::-webkit-slider-thumb]:shadow-md
                          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                          [&::-webkit-slider-thumb]:cursor-grab h-2"
                      />
                      <input
                        type="range"
                        min={MIN_PRICE}
                        max={MAX_PRICE}
                        step={500000}
                        value={priceRange[1]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val > priceRange[0]) setPriceRange([priceRange[0], val]);
                        }}
                        className="absolute w-full appearance-none bg-transparent cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                          [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:bg-[var(--terra-navy)] [&::-webkit-slider-thumb]:shadow-md
                          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                          [&::-webkit-slider-thumb]:cursor-grab h-2"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>0 XAF</span>
                      <span>{MAX_PRICE.toLocaleString()} XAF</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filters summary */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span>Showing <strong className="text-foreground">{filteredPlots.length}</strong> of {plots.length} plots</span>
            {selectedLocation !== "All" && (
              <Badge variant="outline" className="gap-1">
                <MapPin className="w-3 h-3" /> {selectedLocation}
                <button onClick={() => setSelectedLocation("All")}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {(priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE) && (
              <Badge variant="outline" className="gap-1">
                {priceRange[0].toLocaleString()} – {priceRange[1].toLocaleString()} XAF
                <button onClick={() => setPriceRange([MIN_PRICE, MAX_PRICE])}><X className="w-3 h-3" /></button>
              </Badge>
            )}
          </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlots.map((plot) => (
          <LandPlotCard
            key={plot.id}
            plot={plot}
            onSeeMore={handleSeeMore}
            onInitiateTransfer={handleInitiateTransfer}
            onView360={handleView360}
          />
        ))}
      </div>

      {filteredPlots.length === 0 && (
        <div className="text-center py-20 bg-card border-2 border-dashed border-border rounded-3xl">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold font-['Syne']">No plots found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
          <Button onClick={clearFilters} variant="outline" className="mt-4 gap-2">
            <X className="w-4 h-4" /> Clear filters
          </Button>
        </div>
      )}

      {/* Matterport 360° Dialog */}
      <Dialog open={is360Open} onOpenChange={setIs360Open}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b">
            <DialogTitle className="flex items-center gap-2 font-['Syne']">
              <Eye className="w-5 h-5 text-[var(--terra-emerald)]" />
              360° Virtual Tour — {matterportPlot?.landCode}
            </DialogTitle>
          </DialogHeader>
          {matterportPlot?.matterportId ? (
            <div className="aspect-video w-full">
              <iframe
                src={`https://my.matterport.com/show/?m=${matterportPlot.matterportId}`}
                className="w-full h-full"
                allowFullScreen
                title="Matterport 360 Tour"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Eye className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-semibold">No virtual tour available</p>
              <p className="text-sm mt-1">This plot does not have a 360° scan yet.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
