// BEHAVIOR: Renders the Client dashboard, enabling clients to search land plots, check region codes, and view Matterport tours.
import { useState, useMemo, useEffect } from "react";
// BEHAVIOR: Context hook for managing authentication state and triggers
import { useAuth } from "../context/AuthContext";
import { LandPlotCard } from "../app/components/land/LandPlotCard";
import { LandPlotModal } from "../app/components/land/LandPlotModal";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Badge } from "../app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card";
// BEHAVIOR: Lucide React icons matching dashboard states
import { 
  Search, 
  Map as MapIcon, 
  Filter, 
  LayoutList, 
  X, 
  MapPin, 
  User, 
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Timer,
  ChevronRight,
  Maximize2,
  Minimize2,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LandCodeInfo } from "../app/components/shared/LandcodeInfo";
import { TransferRequestModal } from "../app/components/land/TransferRequestModal";
import { cn } from "../app/components/ui/utils";
import { useQueryClient } from "@tanstack/react-query";
// BACKEND_CONNECTION: Custom hook querying the database for registered land plots
import { useLandPlots } from "../hooks/useLandData";
// BACKEND_CONNECTION: Custom hook querying user's transfer requests
import { useMyTransfers } from "../hooks/useTransferData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../app/components/ui/dialog";
import { logActivity } from "../utils/logger";
import { getValidMatterportId } from "../utils/matterport";

// BEHAVIOR: Map of region codes to names and capitals
const REGION_CODES = [
  { code: "01", name: "Adamaoua", capital: "Ngaoundéré" },
  { code: "02", name: "Centre", capital: "Yaoundé" },
  { code: "03", name: "East", capital: "Bertoua" },
  { code: "04", name: "Far North", capital: "Maroua" },
  { code: "05", name: "Littoral", capital: "Douala" },
  { code: "06", name: "North", capital: "Garoua" },
  { code: "07", name: "North West", capital: "Bamenda" },
  { code: "08", name: "West", capital: "Bafoussam" },
  { code: "09", name: "South", capital: "Ébolowa" },
  { code: "10", name: "South West", capital: "Buea" },
];

export default function ClientDashboard() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  // Refresh user profile if they are a Client to check if they have been upgraded to Landowner
  // BACKEND_CONNECTION: Automatically refresh user details on mount
  useEffect(() => {
    if (user && user.role === 'Client') {
      refreshUser();
    }
  }, []);

  // ─── Server state via TanStack Query (cached, deduped, stale-while-revalidate) ───
  // BACKEND_CONNECTION: Queries all land plots from server database
  const { data: plots = [], isFetching: plotsFetching, isLoading: plotsLoading } = useLandPlots();
  // BACKEND_CONNECTION: Queries user transfers list from server database
  const { data: transfers = [] } = useMyTransfers();
  const loading = plotsFetching;
  const showSkeletons = plotsLoading || (plotsFetching && plots.length === 0);

  // ─── UI state ────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterOwner, setFilterOwner] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState("grid");
  const [isRegionsExpanded, setIsRegionsExpanded] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [is360Open, setIs360Open] = useState(false);
  const [matterportPlot, setMatterportPlot] = useState(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!is360Open) {
      setIsMaximized(false);
    }
  }, [is360Open]);

  const handleSeeMore = (plot) => {
    setSelectedPlot(plot);
    setIsModalOpen(true);
    logActivity('Read', `User viewed details for Plot '${plot.landCode}'`);
  };

  const handleView360 = (plot) => {
    setMatterportPlot(plot);
    setIs360Open(true);
    logActivity('Read', `User viewed 360 virtual tour for Plot '${plot.landCode}'`);
  };

  const LOCATIONS = [...new Set(plots.map((p) => p.location?.split(",")[1]?.trim() || p.location?.trim()).filter(Boolean))];

  // BEHAVIOR: Filters loaded plots list based on search filters (cni, name, status, land code segments)
  const filteredPlots = plots.filter((plot) => {
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
      filterLocation === "all" ||
      plot.location.toLowerCase().includes(filterLocation.toLowerCase());

    const matchesOwner =
      !filterOwner ||
      ownerName.toLowerCase().includes(filterOwner.toLowerCase()) ||
      (ownerId && ownerId.toLowerCase().includes(filterOwner.toLowerCase()));

    return matchesSearch && matchesLocation && matchesOwner;
  });

  const getProgressPercentage = (status) => {
    switch(status) {
      case 'Pending_Verification': return 15;
      case 'Forwarded_to_Notary': return 25;
      case 'Under_Notary_Review': return 40;
      case 'Forwarded_to_LRO': return 60;
      case 'Public_Notice': return 75;
      case 'Under_Verification': return 90;
      case 'Completed': return 100;
      default: return 0;
    }
  };

  const STEPS = [
    { id: 1, name: "Verification" },
    { id: 2, name: "Notary Assignment" },
    { id: 3, name: "Legal Review" },
    { id: 4, name: "LRO Review" },
    { id: 5, name: "Public Notice" },
    { id: 6, name: "Final Audit" },
    { id: 7, name: "Authorized" }
  ];

  const getActiveStep = (status) => {
    switch (status) {
      case 'Pending_Verification': return 0;
      case 'Forwarded_to_Notary': return 1;
      case 'Under_Notary_Review': return 2;
      case 'Forwarded_to_LRO': return 3;
      case 'Public_Notice': return 4;
      case 'Under_Verification': return 5;
      case 'Completed': return 6;
      default: return 0;
    }
  };

  const ongoingTransfers = useMemo(() => {
    return (transfers || []).filter(t => {
      // Hide completed, rejected, or cancelled applications immediately
      return !['Completed', 'Rejected', 'Cancelled'].includes(t.status);
    });
  }, [transfers]);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <section className="relative h-[240px] rounded-3xl overflow-hidden shadow-xl">
        <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200" alt="Land" className="w-full h-full object-cover" />
        {/* COLOR_THEME: Uses gradient overlay of Terra Navy values */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--terra-navy)]/90 via-[var(--terra-navy)]/60 to-transparent flex flex-col justify-center px-12 text-white">
          {/* COLOR_THEME: Large Title uses Syne Font family */}
          <h1 className="text-4xl font-bold font-['Syne'] max-w-xl leading-tight">Secure Land Registry <br /><span className="text-[var(--terra-emerald)]">Cameroon Portal</span></h1>
          <p className="text-base text-white/80 mt-2 max-w-md">Verify, track, and transfer land property with blockchain-backed security.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Search by land code, location, or owner…" className="pl-12 h-11 border-2 rounded-xl bg-card" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex gap-2">
               <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={cn("h-11 rounded-xl gap-2", showFilters && "border-[var(--terra-emerald)]")}><Filter className="w-4 h-4" /> Filters</Button>
               <div className="flex border rounded-xl overflow-hidden h-11 bg-white dark:bg-slate-800 dark:border-white/10">
                  <button onClick={() => setView("grid")} className={cn("px-4 transition-all flex items-center justify-center", view === "grid" ? "bg-[var(--terra-navy)] text-white" : "hover:bg-muted text-muted-foreground")}><LayoutList className="w-4 h-4" /></button>
                  <button onClick={() => setView("list")} className={cn("px-4 transition-all flex items-center justify-center border-l", view === "list" ? "bg-[var(--terra-navy)] text-white" : "hover:bg-muted text-muted-foreground")}><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /></button>
               </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="p-5 bg-muted/40 rounded-2xl border space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Filter by Region</label>
                    <div className="flex flex-wrap gap-2">
                       {["all", ...LOCATIONS].map(loc => (
                         <Button key={loc} variant={filterLocation === loc ? "default" : "outline"} size="sm" onClick={() => setFilterLocation(loc)} className="rounded-full h-8 px-4 text-xs">{loc === 'all' ? 'All Regions' : loc}</Button>
                       ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="filterOwner" className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Owner ID or Name</label>
                      <Input
                        id="filterOwner"
                        placeholder="Enter owner name or ID..."
                        value={filterOwner}
                        onChange={(e) => setFilterOwner(e.target.value)}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div>
                      <label htmlFor="filterLandCode" className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Plot Number / Land Code</label>
                      <Input
                        id="filterLandCode"
                        placeholder="Enter plot land code..."
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

          {/* Skeletons rendering during backend fetching operations */}
          {showSkeletons ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {[1, 2, 3, 4].map(i => (
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
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPlots.map(plot => (
                <LandPlotCard key={plot._id} plot={plot} onSeeMore={handleSeeMore} onInitiateTransfer={(p) => { setSelectedPlot(p); setIsTransferOpen(true); }} onView360={handleView360} />
              ))}
            </div>
          ) : (
            <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white dark:bg-slate-800/60 dark:border dark:border-white/10">
              <div className="divide-y divide-border">
                {filteredPlots.map(plot => (
                  <div key={plot._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-all cursor-pointer" onClick={() => handleSeeMore(plot)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0">
                        {/* BACKEND_CONNECTION: Displays cover image served by backend assets or CDN URL */}
                        <img src={plot.coverImage ? `http://localhost:5001${plot.coverImage}` : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold font-mono text-sm">{plot.landCode}</p>
                        <p className="text-[10px] text-muted-foreground">{plot.location}</p>
                      </div>
                    </div>
                    {/* COLOR_THEME: Details button styled in Terra Emerald text */}
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1 text-[var(--terra-emerald)]">Details <ChevronRight className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <LandCodeInfo />
          {/* COLOR_THEME: Region widgets styled in soft purple border and background tints */}
          <Card className="border-purple-200 bg-purple-50/40 rounded-2xl overflow-hidden dark:border-purple-900/40 dark:bg-purple-950/20">
            <CardHeader className="pb-3">
               <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" /> Region Codes
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-border/50">
                  {REGION_CODES.slice(0, isRegionsExpanded ? 10 : 5).map(r => (
                    <div key={r.code} className="flex justify-between p-3 px-4 hover:bg-white dark:hover:bg-white/5 transition-colors">
                       <div className="flex flex-col">
                          <span className="text-sm font-semibold">{r.name}</span>
                          <span className="text-[10px] text-muted-foreground">{r.capital}</span>
                       </div>
                       {/* COLOR_THEME: Region badges styled in purple colors */}
                       <Badge className="bg-purple-100 text-purple-700 h-6 dark:bg-purple-900/30 dark:text-purple-400">{r.code}</Badge>
                    </div>
                  ))}
               </div>
               <button 
                 onClick={() => setIsRegionsExpanded(!isRegionsExpanded)}
                 className="w-full py-3 text-[11px] font-bold uppercase tracking-widest text-purple-600 hover:bg-purple-100/50 transition-colors flex items-center justify-center gap-2 border-t border-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/20 dark:border-purple-900/40"
               >
                 {isRegionsExpanded ? "Show Less" : "View All Regions"}
                 <ArrowRight className={cn("w-3 h-3 transition-transform", isRegionsExpanded ? "-rotate-90" : "rotate-90")} />
               </button>
            </CardContent>
          </Card>
        </div>
      </div>

      <TransferRequestModal plot={selectedPlot} open={isTransferOpen} onClose={() => { setIsTransferOpen(false); queryClient.invalidateQueries({ queryKey: ['transfers'] }); queryClient.invalidateQueries({ queryKey: ['land'] }); }} />
      
      <LandPlotModal
        plot={selectedPlot}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
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
            {/* COLOR_THEME: Dialog Title uses Syne Font family */}
            <DialogTitle className="flex items-center gap-2 font-['Syne']">
              {/* COLOR_THEME: Icon colored in Terra Emerald green */}
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
          <div className={cn("w-full", isMaximized ? "flex-1 h-full" : "aspect-video")}>
            {/* BACKEND_CONNECTION: Pulls external Matterport 360 tour for spatial maps review */}
            <iframe 
              src={`https://my.matterport.com/show/?m=${getValidMatterportId(matterportPlot?.matterportId, matterportPlot?.landCode)}`} 
              className="w-full h-full border-0" 
              allow="xr-spatial-tracking" 
              title="Matterport 360 Tour"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
