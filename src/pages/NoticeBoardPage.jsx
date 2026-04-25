import { useState, useMemo } from "react";
import {
  MapPin, Calendar, Clock, Search, Filter, AlertCircle,
  ShieldCheck, Megaphone, ArrowRight, X, ChevronDown, Send, Eye, Timer
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
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import api from "../utils/api";
import { useEffect } from "react";
import { cn } from "../app/components/ui/utils";
import { useAuth } from "../context/AuthContext";

export default function NoticeBoardPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [objectionOpen, setObjectionOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [objectionMsg, setObjectionMsg] = useState("");
  const [countdownOpen, setCountdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transfer/public-notices');
      if (res.data.success) setNotices(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch public notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const filteredNotices = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return notices.filter(n => {
      const title = `Public Notice: Plot ${n.plot.landCode}`;
      const location = n.plot.location;
      const matchesSearch = !q || title.toLowerCase().includes(q) || n.plot.landCode.toLowerCase().includes(q) || location.toLowerCase().includes(q);
      const matchesRegion = regionFilter === "All" || location.toLowerCase().includes(regionFilter.toLowerCase());
      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, regionFilter, notices]);

  const openObjection = (notice) => {
    setSelectedNotice(notice);
    setObjectionMsg(`Dear LRO ${notice.lro?.firstName} ${notice.lro?.lastName},\n\nI write to formally contest the land transfer notice (Plot: ${notice.plot.landCode}) published on the TerraTrace platform.\n\nMy objection is based on the following grounds:\n[Please describe your objection here]\n\nI request that this matter be reviewed before any transfer is finalized.`);
    setObjectionOpen(true);
  };

  const handleSendObjection = async () => {
    try {
      await api.post(`/transfer/${selectedNotice._id}/objection`, { reason: objectionMsg });
      toast.success("Objection submitted successfully!");
      setObjectionOpen(false);
    } catch (err) {
      toast.error("Failed to submit objection");
    }
  };

  const getDaysLeft = (endDate) => {
    const diff = new Date(endDate) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
          <div className="flex items-center gap-2 text-sm"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span><strong>{notices.length}</strong> Active Notices</span></div>
        </div>
      </div>

      {/* Search + Filters omitted for brevity, keeping existing structure */}
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
          </div>

          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-full md:w-48 h-11">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Regions</SelectItem>
              {["Centre", "Littoral", "West", "South", "North"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence>
          {filteredNotices.map((notice, index) => (
            <motion.div
              key={notice._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all group h-full flex flex-col">
                <div className="relative h-48">
                  <img src={notice.plot.coverImage ? `http://localhost:5001${notice.plot.coverImage}` : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4">
                    <Badge className={cn(
                      "border text-[10px] uppercase font-bold",
                      new Date(notice.publicNotice.endDate) < new Date() 
                        ? "bg-red-100 text-red-700 border-red-200" 
                        : "bg-emerald-100 text-emerald-700 border-emerald-200"
                    )}>
                      {new Date(notice.publicNotice.endDate) < new Date() ? "EXPIRED NOTICE" : "ACTIVE NOTICE"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex gap-2 mb-2">
                      <Badge className="bg-[var(--terra-emerald)] text-white border-0 text-[10px]">{notice.plot.landCode}</Badge>
                      <Badge className="bg-white/20 text-white border-0 text-[10px]">{notice.transferType?.replace('_', ' ') || "TRANSFER"}</Badge>
                    </div>
                    <h3 className="text-white font-bold text-base leading-tight">Land Transfer Verification Protocol</h3>
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(notice.publicNotice.startDate).toLocaleDateString()}</div>
                      <div className={cn(
                        "flex items-center gap-1 font-medium",
                        new Date(notice.publicNotice.endDate) < new Date() ? "text-red-500" : "text-emerald-600"
                      )}>
                        <Clock className="w-3.5 h-3.5" />Expires: {new Date(notice.publicNotice.endDate).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{notice.plot.location}</div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      "The land in question is about to be transferred from {notice.sender.firstName} {notice.sender.lastName} to {notice.receiver?.firstName} {notice.receiver?.lastName}."
                    </p>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-700 leading-snug">
                        <strong className="text-amber-800">LRO in charge:</strong> {notice.lro?.firstName} {notice.lro?.lastName}. File any objection before the expiry date.
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 mt-auto flex items-center justify-between border-t gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Certified Notice</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => { setSelectedNotice(notice); setCountdownOpen(true); }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={new Date(notice.publicNotice.endDate) < new Date() || notice.receiver?._id === user?._id}
                        className="text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 disabled:opacity-30"
                        onClick={() => openObjection(notice)}
                      >
                        File Objection <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
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

      {/* Countdown Dialog */}
      <Dialog open={countdownOpen} onOpenChange={setCountdownOpen}>
        <DialogContent className="max-w-md p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-['Syne'] text-center text-2xl">Notice Period</DialogTitle>
            <DialogDescription className="text-center">
              Time remaining for public opposition of Plot {selectedNotice?.plot?.landCode}
            </DialogDescription>
          </DialogHeader>

          <CountdownDisplay targetDate={selectedNotice?.publicNotice?.endDate} />

          <Button onClick={() => setCountdownOpen(false)} className="w-full bg-[var(--terra-navy)] hover:bg-[#003d7a] text-white h-12 rounded-xl text-sm font-bold uppercase tracking-widest">
            Close View
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CountdownDisplay({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!targetDate) return;

    const calculateTime = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, percentage: 0, isExpired: true };
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      // Default to 30 days for progress calculation, or actual duration if larger
      const maxDuration = 30 * 24 * 60 * 60 * 1000;
      const percentage = Math.min(100, (distance / maxDuration) * 100);

      return { days, hours, minutes, seconds, percentage, isExpired: false };
    };

    // Initial calculation
    setTimeLeft(calculateTime());

    const timer = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return <div className="h-48 flex items-center justify-center"><Timer className="animate-spin text-muted-foreground" /></div>;

  const { isExpired } = timeLeft;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-4">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/10" />
          <circle 
            cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" 
            strokeDasharray="289" 
            strokeDashoffset={289 - (289 * timeLeft.percentage) / 100} 
            strokeLinecap="round" 
            className={`${isExpired ? 'text-red-500' : 'text-[var(--terra-emerald)]'} transition-all duration-1000`} 
          />
        </svg>
        <div className={`flex flex-col items-center ${!isExpired && 'animate-pulse'}`}>
          <Timer className={`w-6 h-6 mb-1 ${isExpired ? 'text-red-500' : 'text-[var(--terra-emerald)]'}`} />
          {timeLeft.days > 0 ? (
            <>
              <span className="text-4xl font-black text-[#002147]">{timeLeft.days}</span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Days Left</span>
            </>
          ) : (
            <>
              <span className="text-3xl font-black text-[#002147]">{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hrs : Min : Sec</span>
            </>
          )}
        </div>
      </div>

      <div className="w-full space-y-4">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>Expires: {new Date(targetDate).toLocaleString()}</span>
          <span className={isExpired ? 'text-red-500' : 'text-emerald-500'}>{isExpired ? 'EXPIRED' : 'ACTIVE'}</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${isExpired ? 'bg-red-500' : 'bg-[var(--terra-emerald)]'}`} 
            style={{ width: `${timeLeft.percentage}%` }} 
          />
        </div>
        <p className="text-xs text-center text-muted-foreground italic">
          {isExpired ? 'The notice period has ended. No more objections can be filed.' : 'Any objections must be filed before the countdown reaches zero.'}
        </p>
      </div>
    </div>
  );
}
