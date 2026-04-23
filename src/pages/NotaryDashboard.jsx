import { useState } from "react";
import { 
  Gavel, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Search, 
  Filter, 
  FileSignature, 
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Badge } from "../app/components/ui/badge";
import { Input } from "../app/components/ui/input";
import { VerificationModal } from "../app/components/notary/VerificationModal";
import { mockTransferRequests } from "../data/mockData";

export default function NotaryDashboard() {
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filterRequests = (requests) => {
    const q = searchQuery.toLowerCase();
    if (!q) return requests;
    return requests.filter(r =>
      r.landCode.toLowerCase().includes(q) ||
      r.buyerName.toLowerCase().includes(q) ||
      r.transferType.toLowerCase().includes(q)
    );
  };

  const pendingRequests = filterRequests(mockTransferRequests.filter(r => r.status === "pending"));
  const ongoingRequests = filterRequests(mockTransferRequests.filter(r => ["notary_verified","fee_pending","site_visit","published"].includes(r.status)));

  const handleVerify = (id) => {
    setSelectedRequestId(id);
    setIsVerifyOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Syne']">Notary Officer Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Chamber of Notaries - Jurisdiction: Douala I
          </p>
        </div>
        <div className="flex gap-3">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 px-4 py-2">
            <ShieldCheck className="w-4 h-4 mr-2" />
            License Active: 2026/001
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Queue */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-bold font-['Syne']">Verification Queue</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, buyer, type..."
                  className="pl-10 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex flex-col p-4 rounded-xl border border-border hover:border-emerald-500/50 hover:bg-accent/5 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[var(--terra-navy)]/10 flex items-center justify-center">
                          <FileSignature className="w-6 h-6 text-[var(--terra-navy)] dark:text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">New Transfer Request</p>
                          <h4 className="font-bold text-lg mt-0.5">{request.landCode}</h4>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-0">Awaiting Review</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 py-4 border-y border-border">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-muted">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">Buyer: {request.buyerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-muted">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm text-muted-foreground">Submitted: 2 hours ago</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                            DOC
                          </div>
                        ))}
                        <span className="ml-4 text-xs text-muted-foreground self-center">+2 more docs</span>
                      </div>
                      <Button 
                        onClick={() => handleVerify(request.id)}
                        className="bg-[var(--terra-emerald)] hover:bg-emerald-600 gap-2"
                      >
                        Start Verification
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ongoing Cases */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold font-['Syne']">Ongoing Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ongoingRequests.map((request) => (
                  <div key={request.id} className="p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="secondary" className="text-[10px] py-0 px-2 uppercase">
                        {request.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">ID: #99{request.id}</span>
                    </div>
                    <p className="font-bold font-mono text-sm">{request.landCode}</p>
                    <p className="text-xs text-muted-foreground mt-1">Buyer: {request.buyerName}</p>
                    
                    <div className="w-full bg-border h-1.5 rounded-full mt-4 overflow-hidden">
                      <div 
                        className="bg-[var(--terra-emerald)] h-full transition-all duration-1000" 
                        style={{ width: request.status === "published" ? "80%" : "40%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legal Resources */}
        <div className="space-y-6">
          <Card className="bg-[var(--terra-navy)] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Gavel className="w-24 h-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-bold font-['Syne']">Legal Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-white/10 border border-white/10">
                <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  NEW REGULATION
                </p>
                <p className="text-sm font-medium">Updated 2026 Land Transfer Act (Section 4.2)</p>
                <p className="text-xs text-white/50 mt-1">Mandatory digital witness signatures required for all deeds.</p>
              </div>
              <Button variant="secondary" className="w-full">View Legal Library</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold font-['Syne']">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "John Doe", type: "Deed Signing", time: "09:00 AM" },
                { name: "Alice Smith", type: "Doc Review", time: "11:30 AM" },
                { name: "Robert Ngollo", type: "Inheritance", time: "02:15 PM" },
              ].map((apt, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-semibold">{apt.name}</p>
                    <p className="text-[10px] text-muted-foreground">{apt.type}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] tabular-nums">{apt.time}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <VerificationModal 
        requestId={selectedRequestId}
        open={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
      />
    </div>
  );
}
