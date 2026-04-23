import { useState, useMemo } from "react";
import {
  MapPin, Calendar, Clock, Search, Filter, AlertCircle,
  ShieldCheck, Megaphone, ArrowRight, X, ChevronDown, Send
} from "lucide-react";
import { Card, CardContent } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import { Textarea } from "../app/components/ui/textarea";
import { Badge } from "../app/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "../app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../app/components/ui/select";
import { mockNotices } from "../data/mockData";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const ALL_REGIONS = ["All", ...new Set(mockNotices.map(n => n.region))];
const ALL_CATEGORIES = ["All", ...new Set(mockNotices.map(n => n.category))];

const statusColors = {
  active:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  expired: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function NoticeBoardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [objectionOpen, setObjectionOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [objectionMsg, setObjectionMsg] = useState("");

  const filteredNotices = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mockNotices.filter(n => {
      const matchesSearch = !q ||
        n.title.toLowerCase().includes(q) ||
        n.landCode.toLowerCase().includes(q) ||
        n.location.toLowerCase().includes(q);
      const matchesRegion   = regionFilter === "All"   || n.region   === regionFilter;
      const matchesCategory = categoryFilter === "All" || n.category === categoryFilter;
      return matchesSearch && matchesRegion && matchesCategory;
    });
  }, [searchQuery, regionFilter, categoryFilter]);

  const activeCount  = mockNotices.filter(n => n.status === "active").length;
  const expiredCount = mockNotices.filter(n => n.status === "expired").length;

  const openObjection = (notice) => {
    setSelectedNotice(notice);
    setObjectionMsg(`Dear LRO ${notice.lroName},\n\nI write to formally contest the land transfer notice (Plot: ${notice.landCode}) published on ${notice.publishedAt} on the TerraTrace platform.\n\nMy objection is based on the following grounds:\n[Please describe your objection here]\n\nI request that this matter be reviewed before any transfer is finalized.\n\nRespectfully,\n[Your Full Name]\n[CNI Number]\n[Contact]`);
    setObjectionOpen(true);
  };

  const handleSendObjection = () => {
    setObjectionOpen(false);
    toast.success("Objection submitted!", {
      description: `Your formal objection for plot ${selectedNotice?.landCode} has been sent to ${selectedNotice?.lroName}.`,
      duration: 5000,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRegionFilter("All");
    setCategoryFilter("All");
  };

  const activeFilterCount = (regionFilter !== "All" ? 1 : 0) + (categoryFilter !== "All" ? 1 : 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold font-['Syne'] text-[#002147] flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-[var(--terra-emerald)]" />
          Public Notice Board
        </h1>
        <p className="text-muted-foreground mt-1">
          Official land transfer, succession, and dispute notices across Cameroon's 10 regions.
        </p>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span><strong>{activeCount}</strong> Active</span></div>
          <div className="flex items-center gap-2 text-sm"><div className="w-2.5 h-2.5 rounded-full bg-gray-400" /><span><strong>{expiredCount}</strong> Expired</span></div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by plot number, title, or location..."
              className="pl-10 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Region filter */}
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-full md:w-48 h-11">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              {ALL_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48 h-11">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button variant="ghost" onClick={clearFilters} className="gap-2 text-muted-foreground h-11">
              <X className="w-4 h-4" /> Clear
            </Button>
          )}
        </div>

        {/* Active filters summary */}
        {(searchQuery || activeFilterCount > 0) && (
          <p className="text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{filteredNotices.length}</strong> of {mockNotices.length} notices
          </p>
        )}
      </div>

      {/* Notice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence>
          {filteredNotices.map((notice, index) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all group h-full flex flex-col">
                <div className="relative h-48">
                  <img src={notice.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4">
                    <Badge className={`${statusColors[notice.status]} border text-[10px] uppercase font-bold`}>
                      {notice.status}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex gap-2 mb-2">
                      <Badge className="bg-[var(--terra-emerald)] text-white border-0 text-[10px]">{notice.landCode}</Badge>
                      <Badge className="bg-white/20 text-white border-0 text-[10px]">{notice.category}</Badge>
                    </div>
                    <h3 className="text-white font-bold text-base leading-tight">{notice.title}</h3>
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{notice.publishedAt}</div>
                      <div className={`flex items-center gap-1 font-medium ${notice.status === "active" ? "text-red-500" : "text-gray-400"}`}>
                        <Clock className="w-3.5 h-3.5" />Expires: {notice.expiresAt}
                      </div>
                      <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{notice.location}</div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">{notice.description}</p>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-700 leading-snug">
                        <strong className="text-amber-800">LRO in charge:</strong> {notice.lroName}. File any objection before the expiry date.
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 mt-auto flex items-center justify-between border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Certified Notice</span>
                    </div>
                    {notice.status === "active" && (
                      <Button
                        variant="ghost"
                        className="text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openObjection(notice)}
                      >
                        File Objection <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredNotices.length === 0 && (
        <div className="text-center py-20 bg-muted/50 rounded-2xl border-2 border-dashed border-border">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold font-['Syne']">No notices found</h3>
          <p className="text-muted-foreground mt-2">Try a different search or filter combination.</p>
          <Button onClick={clearFilters} variant="outline" className="mt-4 gap-2">
            <X className="w-4 h-4" /> Clear all filters
          </Button>
        </div>
      )}

      {/* Objection Dialog */}
      <Dialog open={objectionOpen} onOpenChange={setObjectionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Syne'] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              File Formal Objection
            </DialogTitle>
            <DialogDescription>
              Plot: <span className="font-mono font-bold">{selectedNotice?.landCode}</span> · LRO: {selectedNotice?.lroName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1">
              <p className="font-bold text-red-800">⚠ Legal Notice</p>
              <p>Filing a false objection is an offense under Cameroon Land Law. Ensure your claim is legitimate before submitting.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Your Objection Message</Label>
              <Textarea
                value={objectionMsg}
                onChange={(e) => setObjectionMsg(e.target.value)}
                className="min-h-[200px] text-sm font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setObjectionOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendObjection}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <Send className="w-4 h-4" /> Submit Objection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
