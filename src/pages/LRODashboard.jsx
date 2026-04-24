import { useState, useMemo, useEffect } from "react";
import api from "../utils/api";
import {
  Building2, MapPin, Users, FileCheck, Search, Bell,
  ArrowUpRight, CheckCircle2, XCircle, Clock, AlertTriangle,
  ShieldAlert, ChevronRight, X, List
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Badge } from "../app/components/ui/badge";
import { Input } from "../app/components/ui/input";
import { RegisterLandownerModal } from "../app/components/lro/RegisterLandownerModal";
import { PublishNoticeModal } from "../app/components/lro/PublishNoticeModal";
import { LandApprovalModal } from "../app/components/lro/LandApprovalModal";
import { mockLandPlots } from "../data/mockData";
import { motion, AnimatePresence } from "motion/react";

const statusConfig = {
  clear:          { label: "Clear",          color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> },
  disputed:       { label: "Disputed",       color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500",     icon: <XCircle className="w-6 h-6 text-red-500" /> },
  under_transfer: { label: "Under Transfer", color: "bg-blue-100 text-blue-700 border-blue-200",           dot: "bg-blue-500",    icon: <Clock className="w-6 h-6 text-blue-500" /> },
  flagged:        { label: "Flagged",        color: "bg-amber-100 text-amber-700 border-amber-200",        dot: "bg-amber-500",   icon: <AlertTriangle className="w-6 h-6 text-amber-500" /> },
};

export default function LRODashboard() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState(null);
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlots = async () => {
    try {
        const response = await api.get('/land');
        if (response.data.success) {
            setPlots(response.data.data);
        }
    } catch (err) {
        console.error("Failed to fetch plots:", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  const filteredPlots = useMemo(() => {
    return plots.filter((plot) => {
      const q = searchQuery.toLowerCase();
      const ownerName = plot.owner ? `${plot.owner.firstName} ${plot.owner.lastName}` : "";
      const matchesSearch =
        !q ||
        plot.landCode.toLowerCase().includes(q) ||
        plot.location.toLowerCase().includes(q) ||
        ownerName.toLowerCase().includes(q);
      const matchesStatus = !activeStatusFilter || plot.status === activeStatusFilter || (activeStatusFilter === 'clear' && plot.status === 'cleared');
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, activeStatusFilter, plots]);

  const statusCounts = useMemo(() => ({
    clear:          plots.filter(p => p.status === "clear" || p.status === "cleared").length,
    disputed:       plots.filter(p => p.status === "disputed").length,
    under_transfer: plots.filter(p => p.status === "under_transfer").length,
    flagged:        plots.filter(p => p.status === "flagged").length,
  }), [plots]);

  const stats = [
    { label: "Pending Inspections",  value: "12",  icon: <Clock className="w-5 h-5 text-blue-500" />,    color: "blue" },
    { label: "Active Public Notices", value: "45", icon: <Bell className="w-5 h-5 text-amber-500" />,    color: "amber" },
    { label: "Completed Surveys",    value: "128",  icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, color: "emerald" },
    { label: "Opposition Claims",    value: "3",    icon: <ShieldAlert className="w-5 h-5 text-red-500" />, color: "red" },
  ];

  const handleOpenApproval = (plot) => {
    setSelectedPlot(plot);
    setIsApprovalOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Syne']">Registry Officer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Managing Littoral Region Cadastral Operations</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsRegisterOpen(true)} className="bg-[var(--terra-emerald)] hover:bg-emerald-600 border-0 gap-2">
            <Users className="w-4 h-4" /> Register Landowner
          </Button>
          <Button onClick={() => setIsPublishOpen(true)} variant="outline" className="gap-2">
            <Bell className="w-4 h-4" /> Publish Notice
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => stat.label === "Opposition Claims" ? setActiveStatusFilter("disputed") : null}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-${stat.color}-50`}>{stat.icon}</div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Status Filter Cards */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Filter by Status</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setActiveStatusFilter(activeStatusFilter === key ? null : key)}
              className={`group flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                activeStatusFilter === key
                  ? `${cfg.color} border-current shadow-lg scale-[1.02]`
                  : "bg-card border-border hover:border-current hover:scale-[1.01]"
              }`}
            >
              <div className={`p-2 rounded-lg ${activeStatusFilter === key ? "bg-white/50" : "bg-muted"}`}>
                {cfg.icon}
              </div>
              <div>
                <p className="font-bold text-sm">{cfg.label}</p>
                <p className="text-xl font-black">{statusCounts[key]}</p>
              </div>
              {activeStatusFilter === key && <List className="w-4 h-4 ml-auto opacity-60" />}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter label */}
      <AnimatePresence>
        {activeStatusFilter && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing all <strong className="text-foreground">{statusConfig[activeStatusFilter]?.label}</strong> plots</span>
            <button onClick={() => setActiveStatusFilter(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border rounded-full px-2 py-0.5">
              <X className="w-3 h-3" /> Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registry Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl font-bold font-['Syne']">
              {activeStatusFilter ? `${statusConfig[activeStatusFilter]?.label} Plots` : "Regional Registry"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {activeStatusFilter ? `${filteredPlots.length} records found` : "All registered land plots in your jurisdiction"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, location, owner..."
                className="pl-10 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && (
              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setSearchQuery("")}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredPlots.map((plot) => (
                <RegistryItem key={plot.id} plot={plot} onApprove={handleOpenApproval} />
              ))}
            </AnimatePresence>

            {filteredPlots.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No plots match your criteria</p>
                <Button variant="ghost" className="mt-2 text-xs" onClick={() => { setSearchQuery(""); setActiveStatusFilter(null); }}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <RegisterLandownerModal open={isRegisterOpen} onClose={() => { setIsRegisterOpen(false); fetchPlots(); }} />
      <PublishNoticeModal open={isPublishOpen} onClose={() => setIsPublishOpen(false)} />
      <LandApprovalModal open={isApprovalOpen} plot={selectedPlot} onClose={() => setIsApprovalOpen(false)} />
    </div>
  );
}

function RegistryItem({ plot, onApprove }) {
  const cfg = statusConfig[plot.status] || statusConfig.clear;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent/5 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
          <img 
            src={plot.coverImage?.startsWith('http') ? plot.coverImage : `http://localhost:5001${plot.coverImage || '/assets/images/plots/default-plot.jpg'}`} 
            alt="" 
            className="w-full h-full object-cover shadow-sm group-hover:scale-110 transition-transform" 
          />
        </div>
        <div>
          <p className="font-bold font-mono text-sm group-hover:text-[var(--terra-emerald)] transition-colors">{plot.landCode}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3" /> {plot.location}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Owner: <span className="font-semibold text-foreground">{plot.owner ? `${plot.owner.firstName} ${plot.owner.lastName}` : "Unknown"}</span></p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right hidden md:block">
          <p className="text-xs text-muted-foreground">Area</p>
          <p className="text-sm font-bold">{plot.area} m²</p>
        </div>
        <Badge className={`${cfg.color} border text-[10px] px-2 py-0.5 capitalize flex items-center gap-1`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </Badge>
        <Button 
          variant="ghost" 
          size="icon" 
          className="group-hover:bg-white group-hover:shadow-md border h-9 w-9 text-muted-foreground hover:text-[var(--terra-emerald)] hover:border-[var(--terra-emerald)] transition-all"
          onClick={() => onApprove(plot)}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
}
