import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { LandPlotCard } from "../app/components/land/LandPlotCard";
import { LandPlotModal } from "../app/components/land/LandPlotModal";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Badge } from "../app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card";
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
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LandCodeInfo } from "../app/components/shared/LandcodeInfo";
import { TransferRequestModal } from "../app/components/land/TransferRequestModal";
import api from "../utils/api";
import { cn } from "../app/components/ui/utils";
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

export default function ClientDashboard() {
  const { user } = useAuth();
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
  const [plots, setPlots] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [plotsRes, transfersRes] = await Promise.all([
        api.get('/land'),
        api.get('/transfer/my-transfers')
      ]);
      
      if (plotsRes.data.success) setPlots(plotsRes.data.data);
      if (transfersRes.data.success) setTransfers(transfersRes.data.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('land-updated', fetchData);
    return () => window.removeEventListener('land-updated', fetchData);
  }, []);

  const LOCATIONS = [...new Set(plots.map((p) => p.location?.split(",")[1]?.trim()).filter(Boolean))];

  const filteredPlots = plots.filter((plot) => {
    const q = searchQuery.toLowerCase();
    const ownerName = plot.owner ? `${plot.owner.firstName} ${plot.owner.lastName}` : "";
    const matchSearch = !q || plot.landCode.toLowerCase().includes(q) || plot.location.toLowerCase().includes(q) || ownerName.toLowerCase().includes(q) || plot.landCode.split("-")[2]?.toLowerCase().includes(q);
    const matchLocation = filterLocation === "all" || plot.location.toLowerCase().includes(filterLocation.toLowerCase());
    const matchOwner = !filterOwner || ownerName.toLowerCase().includes(filterOwner.toLowerCase()) || plot.landCode.split("-")[2]?.toLowerCase().includes(filterOwner.toLowerCase());
    return matchSearch && matchLocation && matchOwner;
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
      <section className="relative h-[240px] rounded-3xl overflow-hidden shadow-xl">
        <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200" alt="Land" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--terra-navy)]/90 via-[var(--terra-navy)]/60 to-transparent flex flex-col justify-center px-12 text-white">
          <h1 className="text-4xl font-bold font-['Syne'] max-w-xl leading-tight">Secure Land Registry <br /><span className="text-[var(--terra-emerald)]">Cameroon Portal</span></h1>
          <p className="text-base text-white/80 mt-2 max-w-md">Verify, track, and transfer land property with blockchain-backed security.</p>
        </div>
      </section>

      {/* Ongoing Transfers Tracker */}
      {ongoingTransfers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-['Syne'] flex items-center gap-2"><Timer className="w-5 h-5 text-[var(--terra-emerald)]" /> Real-time Application Tracking</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ongoingTransfers
              .filter(t => t.sender?._id === user?._id)
              .map(transfer => {
                const activeStep = getActiveStep(transfer.status);
              return (
                <Card key={transfer._id} className="border-none shadow-sm bg-white overflow-hidden rounded-2xl group transition-all hover:shadow-md">
                  <CardHeader className="bg-muted/30 py-3 px-6 border-b">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold text-[#002147]">{transfer.plot?.landCode}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Dossier ID: {transfer._id.substring(0, 8)}</span>
                           <Badge variant="outline" className="text-[8px] border-blue-200 text-blue-600 bg-blue-50/50 py-0 h-4">
                              {transfer.isSubdivision ? "SUB PORTION" : "FULL PORTION"}
                           </Badge>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase border-emerald-200 text-emerald-700 bg-emerald-50 h-6 px-2">
                        {transfer.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                     <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-muted-foreground font-medium">Overall Progress</span>
                           <span className="font-bold text-[var(--terra-emerald)]">{getProgressPercentage(transfer.status)}%</span>
                        </div>
                        <div className="w-full bg-muted h-3 rounded-full overflow-hidden border p-0.5">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${getProgressPercentage(transfer.status)}%` }}
                             className="h-full bg-gradient-to-r from-[var(--terra-navy)] to-[var(--terra-emerald)] rounded-full shadow-sm"
                           />
                        </div>
                     </div>

                     <div className="flex justify-between relative px-2">
                        {STEPS.map((step, i) => (
                           <div key={i} className="flex flex-col items-center gap-2 z-10">
                              <div className={cn(
                                 "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500",
                                 i <= activeStep ? "bg-[var(--terra-emerald)] text-white shadow-lg shadow-emerald-500/20" : "bg-muted text-muted-foreground border border-dashed"
                              )}>
                                 {i < activeStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                              </div>
                              <span className={cn(
                                 "text-[9px] font-bold uppercase tracking-tighter text-center",
                                 i <= activeStep ? "text-[#002147]" : "text-muted-foreground"
                              )}>{step.name}</span>
                           </div>
                        ))}
                        {/* Connecting Line */}
                        <div className="absolute top-3 left-6 right-6 h-[1px] bg-muted -z-0" />
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
                          className="absolute top-3 left-6 h-[2px] bg-emerald-500/30 -z-0"
                        />
                     </div>

                     <div className="flex items-center justify-between pt-4 border-t text-[10px] text-muted-foreground bg-muted/20 -mx-6 -mb-6 px-6 py-3">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                              {transfer.transferType === 'direct_grant' ? 'G' : 'N'}
                           </div>
                           <span>
                              {transfer.transferType === 'direct_grant' 
                                ? "Direct Registry Application" 
                                : `${transfer.notary?.firstName || "Assigning"} ${transfer.notary?.lastName || "Notary..."}`}
                           </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-full border">
                           <Clock className="w-3 h-3 text-amber-500" />
                           <span className="font-medium">Last Update: {new Date(transfer.updatedAt).toLocaleDateString()}</span>
                        </div>
                     </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Search by land code, location, or owner…" className="pl-12 h-11 border-2 rounded-xl bg-card" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex gap-2">
               <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={cn("h-11 rounded-xl gap-2", showFilters && "border-[var(--terra-emerald)]")}><Filter className="w-4 h-4" /> Filters</Button>
               <div className="flex border rounded-xl overflow-hidden h-11 bg-white">
                  <button onClick={() => setView("grid")} className={cn("px-4 transition-all flex items-center justify-center", view === "grid" ? "bg-[var(--terra-navy)] text-white" : "hover:bg-muted text-muted-foreground")}><LayoutList className="w-4 h-4" /></button>
                  <button onClick={() => setView("list")} className={cn("px-4 transition-all flex items-center justify-center border-l", view === "list" ? "bg-[var(--terra-navy)] text-white" : "hover:bg-muted text-muted-foreground")}><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /></button>
               </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="p-4 bg-muted/40 rounded-2xl border flex flex-wrap gap-2">
                   {["all", ...LOCATIONS].map(loc => (
                     <Button key={loc} variant={filterLocation === loc ? "default" : "outline"} size="sm" onClick={() => setFilterLocation(loc)} className="rounded-full h-8 px-4 text-xs">{loc === 'all' ? 'All Regions' : loc}</Button>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPlots.map(plot => (
                <LandPlotCard key={plot._id} plot={plot} onSeeMore={setSelectedPlot} onInitiateTransfer={(p) => { setSelectedPlot(p); setIsTransferOpen(true); }} onView360={(p) => { setMatterportPlot(p); setIs360Open(true); }} />
              ))}
            </div>
          ) : (
            <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white">
              <div className="divide-y divide-border">
                {filteredPlots.map(plot => (
                  <div key={plot._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-all cursor-pointer" onClick={() => setSelectedPlot(plot)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0">
                        <img src={plot.coverImage ? `http://localhost:5001${plot.coverImage}` : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold font-mono text-sm">{plot.landCode}</p>
                        <p className="text-[10px] text-muted-foreground">{plot.location}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1 text-[var(--terra-emerald)]">Details <ChevronRight className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <LandCodeInfo />
          <Card className="border-purple-200 bg-purple-50/40 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
               <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" /> Region Codes
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-border/50">
                  {REGION_CODES.slice(0, isRegionsExpanded ? 10 : 5).map(r => (
                    <div key={r.code} className="flex justify-between p-3 px-4 hover:bg-white transition-colors">
                       <div className="flex flex-col">
                          <span className="text-sm font-semibold">{r.name}</span>
                          <span className="text-[10px] text-muted-foreground">{r.capital}</span>
                       </div>
                       <Badge className="bg-purple-100 text-purple-700 h-6">{r.code}</Badge>
                    </div>
                  ))}
               </div>
               <button 
                 onClick={() => setIsRegionsExpanded(!isRegionsExpanded)}
                 className="w-full py-3 text-[11px] font-bold uppercase tracking-widest text-purple-600 hover:bg-purple-100/50 transition-colors flex items-center justify-center gap-2 border-t border-purple-100"
               >
                 {isRegionsExpanded ? "Show Less" : "View All Regions"}
                 <ArrowRight className={cn("w-3 h-3 transition-transform", isRegionsExpanded ? "-rotate-90" : "rotate-90")} />
               </button>
            </CardContent>
          </Card>
        </div>
      </div>

      <TransferRequestModal plot={selectedPlot} open={isTransferOpen} onClose={() => { setIsTransferOpen(false); fetchData(); }} />
      
      <Dialog open={is360Open} onOpenChange={setIs360Open}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl">
          <div className="aspect-video w-full">
            {matterportPlot?.matterportId && <iframe src={`https://my.matterport.com/show/?m=${matterportPlot.matterportId}`} className="w-full h-full border-0" allow="xr-spatial-tracking" />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
