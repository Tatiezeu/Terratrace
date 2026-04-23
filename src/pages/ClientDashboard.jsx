import { useState } from "react";
import { mockLandPlots } from "../data/mockData";
import { LandPlotCard } from "../app/components/land/LandPlotCard";
import { LandPlotModal } from "../app/components/land/LandPlotModal";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Badge } from "../app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card";
import { Search, Map as MapIcon, Filter, LayoutList, X, MapPin, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LandCodeInfo } from "../app/components/shared/LandcodeInfo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../app/components/ui/dialog";

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

const LOCATIONS = [...new Set(mockLandPlots.map((p) => p.location.split(",")[1]?.trim()).filter(Boolean))];

export default function ClientDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterOwner, setFilterOwner] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState("grid"); // "grid" | "list"
  const [isRegionsExpanded, setIsRegionsExpanded] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [is360Open, setIs360Open] = useState(false);
  const [matterportPlot, setMatterportPlot] = useState(null);

  const filteredPlots = mockLandPlots.filter((plot) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      plot.landCode.toLowerCase().includes(q) ||
      plot.location.toLowerCase().includes(q) ||
      plot.owner.toLowerCase().includes(q) ||
      // match owner ID segment (3rd segment of land code)
      plot.landCode.split("-")[2]?.toLowerCase().includes(q);

    const matchLocation =
      filterLocation === "all" || plot.location.toLowerCase().includes(filterLocation.toLowerCase());

    const matchOwner =
      !filterOwner ||
      plot.owner.toLowerCase().includes(filterOwner.toLowerCase()) ||
      plot.landCode.split("-")[2]?.toLowerCase().includes(filterOwner.toLowerCase());

    return matchSearch && matchLocation && matchOwner;
  });

  const handleSeeMore = (plot) => {
    setSelectedPlot(plot);
    setIsModalOpen(true);
  };

  const handleView360 = (plot) => {
    setMatterportPlot(plot);
    setIs360Open(true);
  };

  const clearFilters = () => {
    setFilterLocation("all");
    setFilterOwner("");
    setSearchQuery("");
  };

  const activeFilterCount =
    (filterLocation !== "all" ? 1 : 0) + (filterOwner ? 1 : 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <section className="relative h-[280px] rounded-3xl overflow-hidden shadow-2xl">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200"
          alt="Land Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--terra-navy)]/90 via-[var(--terra-navy)]/70 to-transparent flex flex-col justify-center px-12 text-white">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold font-['Syne'] max-w-xl leading-tight"
          >
            Find Your Next Property <br />
            <span className="text-[var(--terra-emerald)]">Securely Verified</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/80 mt-4 max-w-md"
          >
            Access the official land registry of Cameroon. Transparent, immutable, and secure.
          </motion.p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search & Controls */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-[var(--terra-emerald)]" />
                <Input
                  placeholder="Search by land code, owner name, location, or owner ID…"
                  className="pl-12 h-12 border-2 focus-visible:ring-emerald-500 rounded-xl bg-card"
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className={`h-12 px-4 rounded-xl border-2 gap-2 relative ${showFilters ? "border-[var(--terra-emerald)] text-[var(--terra-emerald)]" : ""}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--terra-emerald)] text-white text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
                {/* View toggle */}
                <div className="flex border-2 border-border rounded-xl overflow-hidden h-12">
                  <button
                    onClick={() => setView("grid")}
                    className={`px-3 flex items-center gap-1.5 text-sm font-medium transition-colors ${view === "grid" ? "bg-[var(--terra-navy)] text-white" : "hover:bg-muted"}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Grid
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`px-3 flex items-center gap-1.5 text-sm font-medium transition-colors ${view === "list" ? "bg-[var(--terra-navy)] text-white" : "hover:bg-muted"}`}
                  >
                    <LayoutList className="w-4 h-4" />
                    List
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Filter by Region
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["all", ...LOCATIONS].map((loc) => (
                          <button
                            key={loc}
                            onClick={() => setFilterLocation(loc)}
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                              filterLocation === loc
                                ? "bg-[var(--terra-navy)] text-white border-[var(--terra-navy)]"
                                : "border-border hover:border-[var(--terra-navy)] hover:text-[var(--terra-navy)]"
                            }`}
                          >
                            {loc === "all" ? "All Regions" : loc}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="w-full md:w-64 space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" /> Filter by Landowner / Owner ID
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="Name or last 5 digits of CNI…"
                          value={filterOwner}
                          onChange={(e) => setFilterOwner(e.target.value)}
                          className="h-9 text-sm bg-white"
                        />
                      </div>
                    </div>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:text-red-600 gap-1 flex-shrink-0">
                        <X className="w-3 h-3" /> Clear all
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filteredPlots.length}</span> of {mockLandPlots.length} plots
            </p>
          </div>

          {/* GRID VIEW */}
          {view === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPlots.map((plot) => (
                <LandPlotCard
                  key={plot.id}
                  plot={plot}
                  onSeeMore={handleSeeMore}
                  onView360={handleView360}
                />
              ))}
            </div>
          )}

          {/* LIST VIEW */}
          {view === "list" && (
            <div className="space-y-3">
              {filteredPlots.map((plot) => (
                <motion.div
                  key={plot.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col md:flex-row h-[130px]"
                >
                  {/* Image */}
                  <div className="relative w-full md:w-40 flex-shrink-0 overflow-hidden group h-full">
                    <img
                      src={plot.image}
                      alt={plot.landCode}
                      className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                    />
                    {plot.matterportId && (
                      <button
                        onClick={() => handleView360(plot)}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
                      >
                        <div className="bg-white/20 backdrop-blur-sm border border-white/50 rounded-full px-2.5 py-1 text-white text-[10px] font-bold">
                          360°
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 px-4 py-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[var(--terra-navy)] dark:text-[var(--terra-emerald)] text-xs tracking-tight">{plot.landCode}</span>
                      <Badge className={
                        plot.status === "clear" ? "bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5 py-0 leading-4" :
                        plot.status === "disputed" ? "bg-red-100 text-red-700 border-0 text-[9px] px-1.5 py-0 leading-4" :
                        plot.status === "flagged" ? "bg-amber-100 text-amber-700 border-0 text-[9px] px-1.5 py-0 leading-4" :
                        "bg-blue-100 text-blue-700 border-0 text-[9px] px-1.5 py-0 leading-4"
                      }>
                        {plot.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>{plot.location}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] text-muted-foreground flex gap-3 flex-wrap">
                        <span className="font-bold text-foreground">{plot.owner}</span>
                        <span>{plot.area}m²</span>
                        <span className="text-[var(--terra-emerald)] font-bold">{plot.price.toLocaleString()} XAF</span>
                      </div>
                      <Button
                        onClick={() => handleSeeMore(plot)}
                        variant="outline"
                        className="flex-shrink-0 h-7 px-3 text-[11px] rounded-lg border hover:bg-[var(--terra-navy)] hover:text-white transition-colors"
                      >
                        See More
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}



          {filteredPlots.length === 0 && (
            <div className="text-center py-20 bg-card border-2 border-dashed border-border rounded-3xl">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold font-['Syne']">No plots found</h3>
              <p className="text-muted-foreground mt-2">
                Try adjusting your search or filters.
              </p>
              <Button onClick={clearFilters} variant="outline" className="mt-4 gap-2">
                <X className="w-4 h-4" /> Clear filters
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <LandCodeInfo />

          {/* Region Codes Card */}
          <Card className="border-purple-200 bg-purple-50/40 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-['Syne'] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                Region Codes
              </CardTitle>
              <p className="text-xs text-muted-foreground">The 10 regions of Cameroon and their codes</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {(isRegionsExpanded ? REGION_CODES : REGION_CODES.slice(0, 3)).map((r) => (
                  <div key={r.code} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.capital}</p>
                    </div>
                    <span className="font-mono font-black text-purple-600 text-sm bg-purple-100 px-2 py-0.5 rounded">{r.code}</span>
                  </div>
                ))}
              </div>
              <Button 
                variant="ghost" 
                className="w-full h-10 text-[11px] font-bold uppercase tracking-widest text-[var(--terra-navy)] hover:bg-[var(--terra-navy)]/5 transition-all flex items-center justify-center gap-2 border-t border-border/50 rounded-b-xl rounded-t-none"
                onClick={() => setIsRegionsExpanded(!isRegionsExpanded)}
              >
                {isRegionsExpanded ? (
                  <>View Less <X className="w-3 h-3" /></>
                ) : (
                  <>View More ({REGION_CODES.length - 3} +)</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* New to TerraTrace */}
          <div className="bg-gradient-to-br from-[var(--terra-navy)] to-blue-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/10">
            <h3 className="text-xl font-bold font-['Syne'] mb-4">New to TerraTrace?</h3>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              Our platform ensures every transaction is legally verified and
              recorded for immutable proof to prevent fraud and multi-selling.
            </p>
            <Button className="w-full bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white border-0 py-6 text-lg font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
              How it works
            </Button>
          </div>
        </div>
      </div>

      {/* Plot Detail Modal */}
      <LandPlotModal
        plot={selectedPlot}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* 360° Matterport View Modal */}
      <Dialog open={is360Open} onOpenChange={setIs360Open}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4">
            <DialogTitle className="font-['Syne'] flex items-center gap-2">
              <span className="text-[var(--terra-emerald)]">360°</span> Virtual Tour — {matterportPlot?.landCode}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {matterportPlot?.matterportId && (
              <iframe
                src={`https://my.matterport.com/show/?m=${matterportPlot.matterportId}`}
                className="w-full h-full border-0"
                allow="xr-spatial-tracking"
                title="360° Virtual Tour"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
