// BEHAVIOR: Renders the public land plots directory page, letting clients explore, filter, search, and view 360 virtual tours.
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import api from "../utils/api";
import { LandPlotCard } from "../app/components/land/LandPlotCard";
import { SpinnerLoader } from "../app/components/shared/SpinnerLoader";
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
  Maximize2,
  Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
// BACKEND_CONNECTION: Custom hook querying the database for all registered land plots
import { useLandPlots } from "../hooks/useLandData";
import { logActivity } from "../utils/logger";
import { cn } from "../app/components/ui/utils";
import { getValidMatterportId, getMatterportUrl } from "../utils/matterport";

export default function LandPlotsPage() {
  // ─── Server state via TanStack Query (cached, deduped) ────────────────────
  // BACKEND_CONNECTION: Fetches land plots from DB
  const { data: plots = [], isLoading: loading } = useLandPlots();

  // ─── UI state ─────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [filterOwner, setFilterOwner] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [is360Open, setIs360Open] = useState(false);
  const [matterportPlot, setMatterportPlot] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    const query = searchParams.get("search") || location.state?.searchPlot || "";
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams, location]);

  useEffect(() => {
    if (!is360Open) {
      setIsMaximized(false);
    }
  }, [is360Open]);

  // ─── Derive priceRange max from cached plots data ────────────────────────
  const maxPrice = useMemo(() => {
    if (!plots.length) return 100000000;
    return Math.max(...plots.map(p => p.price || 0));
  }, [plots]);
  const [priceRange, setPriceRange] = useState([0, 100000000]);

  // BEHAVIOR: Filters land plots locally based on search terms (land code, location, owner details) and price boundaries
  const filteredPlots = useMemo(() => {
    return plots.filter((plot) => {
      const q = searchQuery.toLowerCase();
      
      // Extract owner name
      let ownerName = "";
      if (plot.owner) {
        if (typeof plot.owner === "object") {
          ownerName = `${plot.owner.firstName || ""} ${plot.owner.lastName || ""}`.trim();
        } else if (typeof plot.owner === "string") {
          ownerName = plot.owner;
        }
      }
      
      // Extract owner ID
      let ownerId = "";
      if (plot.owner && typeof plot.owner === "object") {
        ownerId = plot.owner._id || plot.owner.id || "";
      } else if (plot.owner && typeof plot.owner === "string" && plot.owner.match(/^[0-9a-fA-F]{24}$/)) {
        ownerId = plot.owner;
      }

      const matchesSearch =
        !q ||
        plot.landCode.toLowerCase().includes(q) ||
        plot.location.toLowerCase().includes(q) ||
        ownerName.toLowerCase().includes(q) ||
        (ownerId && ownerId.toLowerCase().includes(q)) ||
        (plot.landCode.split("-")[2]?.toLowerCase().includes(q));

      const matchesLocation =
        selectedLocation === "All" ||
        plot.location.toLowerCase().includes(selectedLocation.toLowerCase());

      const matchesPrice =
        plot.price >= priceRange[0] && plot.price <= priceRange[1];

      const matchesOwner =
        !filterOwner ||
        ownerName.toLowerCase().includes(filterOwner.toLowerCase()) ||
        (ownerId && ownerId.toLowerCase().includes(filterOwner.toLowerCase()));

      return matchesSearch && matchesLocation && matchesPrice && matchesOwner;
    });
  }, [searchQuery, selectedLocation, priceRange, filterOwner, plots]);

  const ALL_LOCATIONS = useMemo(() => ["All", ...new Set(plots.map((p) => p.location.split(",")[1]?.trim() || p.location))], [plots]);
  const MAX_PRICE = useMemo(() => plots.length > 0 ? Math.max(...plots.map((p) => p.price)) : 100000000, [plots]);
  const MIN_PRICE = 0;

  const activeFilterCount =
    (selectedLocation !== "All" ? 1 : 0) +
    (priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE ? 1 : 0) +
    (filterOwner.trim() !== "" ? 1 : 0);

  const clearFilters = () => {
    setSelectedLocation("All");
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setSearchQuery("");
    setFilterOwner("");
  };

  const handleSeeMore = (plot) => {
    setSelectedPlot(plot);
    setIsModalOpen(true);
    logActivity('Read', `User viewed details for Plot '${plot.landCode}'`);
  };

  const handleInitiateTransfer = (plot) => {
    setSelectedPlot(plot);
    setIsTransferModalOpen(true);
  };

  const handleView360 = (plot) => {
    setMatterportPlot(plot);
    setIs360Open(true);
    logActivity('Read', `User viewed 360 virtual tour for Plot '${plot.landCode}'`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        {/* COLOR_THEME: Header title uses Syne Font family */}
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
              // COLOR_THEME: Filter badge count colored in Terra Emerald green
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
                        // COLOR_THEME: Selected location button uses Terra Navy background, unselected uses transparent border
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
                      {/* COLOR_THEME: Price labels use Terra Emerald green style */}
                      <span className="text-[var(--terra-emerald)]">{priceRange[0].toLocaleString()} XAF</span>
                      <span className="text-[var(--terra-emerald)]">{priceRange[1].toLocaleString()} XAF</span>
                    </div>
                    {/* Min slider */}
                    <div className="relative h-6 flex items-center">
                      <div className="absolute w-full h-2 bg-muted rounded-full" />
                      {/* COLOR_THEME: Range active selector track styled in Terra Emerald */}
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
                        // COLOR_THEME: Slider handles styled with Terra Navy background fill
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
                        // COLOR_THEME: Slider handles styled with Terra Navy background fill
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
                
                {/* Additional Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Owner Name or ID
                    </p>
                    <Input
                      placeholder="Enter owner name or ID..."
                      value={filterOwner}
                      onChange={(e) => setFilterOwner(e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Plot Number / Land Code
                    </p>
                    <Input
                      placeholder="Enter land code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 rounded-xl"
                    />
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
      {/* BEHAVIOR: Renders skeleton loading grid if fetching data from the database */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlots.map((plot) => (
            <LandPlotCard
              key={plot._id || plot.id}
              plot={plot}
              onSeeMore={handleSeeMore}
              onInitiateTransfer={handleInitiateTransfer}
              onView360={handleView360}
            />
          ))}
        </div>
      )}

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
        <DialogContent 
          className={cn(
            "p-0 overflow-hidden transition-all duration-300 ease-in-out flex flex-col",
            isMaximized 
              ? "max-w-none w-[96vw] h-[92vh] rounded-2xl" 
              : "max-w-4xl w-full rounded-2xl"
          )}
        >
          <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center justify-between">
            {/* COLOR_THEME: Header Title uses Syne Font family */}
            <DialogTitle className="flex items-center gap-2 font-['Syne']">
              {/* COLOR_THEME: Uses Terra Emerald text style */}
              <Eye className="w-5 h-5 text-[var(--terra-emerald)]" />
              360° Virtual Tour — {matterportPlot?.landCode}
            </DialogTitle>
            <Button
              onClick={() => setIsMaximized(!isMaximized)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground mr-6 shrink-0"
              title={isMaximized ? "Restore view" : "Maximize view"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </DialogHeader>
          <div
            className={cn("w-full overflow-hidden", isMaximized ? "flex-1 min-h-0" : "aspect-video")}
            style={isMaximized ? { height: 'calc(92vh - 72px)' } : {}}
          >
            {/* BACKEND_CONNECTION: Pulls Matterport 3D scan iframe data */}
            <iframe
              key={isMaximized ? 'matterport-max' : 'matterport-normal'}
              src={getMatterportUrl(matterportPlot?.matterportId, matterportPlot?.landCode, false)}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; xr-spatial-tracking; clipboard-write; webvr; accelerometer; gyroscope"
              allowFullScreen
              referrerPolicy="no-referrer"
              title="Matterport 360 Tour"
            />
          </div>
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
