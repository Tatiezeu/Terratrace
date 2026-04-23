import { useState, useMemo, useRef } from "react";
import { 
  Bell, 
  Search, 
  Send, 
  Reply, 
  Mail,
  ShieldCheck,
  FileCheck,
  Clock,
  X,
  CreditCard,
  Paperclip,
  Image as ImageIcon,
  CheckCircle2,
  ChevronDown,
  User as UserIcon,
  Trash2,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Badge } from "../app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../app/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
  DialogDescription
} from "../app/components/ui/dialog";
import { Label } from "../app/components/ui/label";
import { Textarea } from "../app/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../app/components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewMsgOpen, setIsNewMsgOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [targetMsg, setTargetMsg] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const newFileInputRef = useRef(null);
  const newScreenshotInputRef = useRef(null);

  // New Message State
  const [recipientCategory, setRecipientCategory] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [newMsgSubject, setNewMsgSubject] = useState("");
  const [newMsgBody, setNewMsgBody] = useState("");

  // Mocking the current user role for demonstration
  const currentUserRole = "landowner"; // Can be landlord, client, admin, lro, notary

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      sender: "Land Registry Office",
      role: "lro",
      type: "official",
      message: "Your application for Plot CM-234-56 has been approved for the investigation phase.",
      time: "2 hours ago",
      unread: true,
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=LRO",
      forRoles: ["client", "landowner", "admin"]
    },
    {
      id: 2,
      sender: "Notary Jean-Pierre",
      role: "notary",
      type: "private",
      message: "Please sign the transfer documents for the Koumassi site. I have uploaded them to the secure portal.",
      time: "5 hours ago",
      unread: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jean",
      forRoles: ["client", "landowner", "admin"]
    },
    {
      id: 3,
      sender: "System Payment Portal",
      role: "system",
      type: "payment",
      message: "Invoice #INV-2024-089 for Land Survey Fee (Plot CM-234) is ready. Amount: 75,000 XAF.",
      time: "1 day ago",
      unread: false,
      avatar: "",
      forRoles: ["admin", "client", "landowner"]
    },
    {
      id: 4,
      sender: "Ousmanou Bello",
      role: "client",
      type: "private",
      message: "Hello Officer, I have uploaded my payment receipt for Plot 7890. Please verify.",
      time: "3 hours ago",
      unread: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bello",
      forRoles: ["notary", "admin", "lro"]
    }
  ]);

  const recipientOptions = {
    lro: [
      { id: "lro-1", name: "Registry Office (Littoral)" },
      { id: "lro-2", name: "Inspector Mohamadou" }
    ],
    notary: [
      { id: "not-1", name: "Maître André Fotso" },
      { id: "not-2", name: "Maître Jean-Pierre" }
    ],
    client: [
      { id: "cli-1", name: "John Doe" },
      { id: "cli-2", name: "Ousmanou Bello" }
    ]
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = n.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           n.sender.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = n.forRoles.includes(currentUserRole);
      const matchesTab = activeTab === "all" || 
                        (activeTab === "unread" && n.unread) || 
                        (activeTab === "payment" && n.type === "payment") ||
                        (activeTab === "official" && n.type === "official");
      
      return matchesSearch && matchesRole && matchesTab;
    });
  }, [searchQuery, activeTab, currentUserRole, notifications]);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    toast.success("Marked as read");
  };

  const handleReplyClick = (msg) => {
    setTargetMsg(msg);
    setReplyText(`Regarding message from ${msg.sender}: \n\nI have received your notification and I am following up on the requirements...`);
    setIsReplyOpen(true);
  };

  const sendReply = () => {
    const newMsg = {
      id: Date.now(),
      sender: "You (Reply)",
      role: currentUserRole,
      type: "private",
      message: replyText,
      time: "Just now",
      unread: false,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=You",
      forRoles: [targetMsg.role]
    };
    setNotifications([newMsg, ...notifications]);
    toast.success("Reply sent successfully!");
    setIsReplyOpen(false);
    setAttachment(null);
  };

  const handleCreateNewMsg = () => {
    if (!selectedRecipient || !newMsgBody) {
      toast.error("Please select a recipient and enter a message.");
      return;
    }
    const recipient = recipientOptions[recipientCategory].find(r => r.id === selectedRecipient);
    const newMsg = {
      id: Date.now(),
      sender: `To: ${recipient.name}`,
      role: recipientCategory,
      type: "official",
      message: `${newMsgSubject ? `[${newMsgSubject}] ` : ""}${newMsgBody}`,
      time: "Just now",
      unread: false,
      avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${recipient.name}`,
      forRoles: [currentUserRole]
    };
    setNotifications([newMsg, ...notifications]);
    toast.success("Message sent successfully!");
    setIsNewMsgOpen(false);
    setNewMsgSubject("");
    setNewMsgBody("");
    setAttachment(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setAttachment(file);
  };

  const tabs = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "official", label: "Official" },
    { id: "payment", label: "Payment Instructions", roles: ["client", "landowner", "admin"] },
  ].filter(t => !t.roles || t.roles.includes(currentUserRole));

  return (
    <div className="space-y-8 pb-12 overflow-y-auto h-full pr-6 dark:bg-[#002147] dark:text-gray-100 p-6 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Syne'] text-[#002147] dark:text-[var(--terra-emerald)]">Messages & Reports</h1>
          <p className="text-muted-foreground mt-1 text-base">
            Communication hub for portal role: <span className="font-bold text-[var(--terra-emerald)] capitalize">{currentUserRole}</span>
          </p>
        </div>
        
        {/* NEW MESSAGE DIALOG */}
        <Dialog open={isNewMsgOpen} onOpenChange={setIsNewMsgOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white gap-2 h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20">
              <Send className="w-4 h-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-['Syne']">Compose New Message</DialogTitle>
              <DialogDescription>Select a recipient category and officer to start communication.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 uppercase text-xs font-bold tracking-widest opacity-70">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient Category</Label>
                  <Select onValueChange={(v) => { setRecipientCategory(v); setSelectedRecipient(""); }}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lro">Registry Officer (LRO)</SelectItem>
                      <SelectItem value="notary">Notary Officer</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Recipient Name</Label>
                  < Select disabled={!recipientCategory} onValueChange={setSelectedRecipient}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Select Name" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipientCategory && recipientOptions[recipientCategory].map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={newMsgSubject} onChange={(e) => setNewMsgSubject(e.target.value)} placeholder="e.g. Plot Document Upload" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="msg-body">Message</Label>
                <Textarea id="msg-body" value={newMsgBody} onChange={(e) => setNewMsgBody(e.target.value)} placeholder="Write your message..." className="min-h-[120px] rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold opacity-60 uppercase">Attachments</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="rounded-lg h-9 gap-2 border-dashed border-2 hover:bg-blue-50 dark:hover:bg-blue-900/40 dark:border-blue-800/50 dark:text-blue-200 transition-all active:scale-95"
                    onClick={() => newFileInputRef.current?.click()}
                  >
                    <Paperclip className="w-4 h-4 text-blue-500 group-hover:rotate-12 transition-transform" />
                    File
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="rounded-lg h-9 gap-2 border-dashed border-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 dark:border-emerald-800/50 dark:text-emerald-200 transition-all active:scale-95"
                    onClick={() => newScreenshotInputRef.current?.click()}
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    Screenshot
                  </Button>
                  <input type="file" ref={newFileInputRef} onChange={handleFileChange} className="hidden" />
                  <input type="file" ref={newScreenshotInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
                {attachment && !isReplyOpen && (
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/40 p-2.5 rounded-xl text-xs text-emerald-700 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-800/50 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-bold truncate max-w-[200px]">{attachment.name}</span>
                    <button onClick={() => setAttachment(null)} className="ml-auto p-1 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            <DialogFooter>
              <Button onClick={handleCreateNewMsg} className="bg-[var(--terra-emerald)] text-white h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/20">
                Send Notification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex p-1 bg-muted rounded-xl w-full md:w-auto overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? "bg-white dark:bg-emerald-500 text-[var(--terra-navy)] dark:text-white shadow-sm font-bold" 
                  : "text-muted-foreground hover:text-foreground dark:hover:text-emerald-400"
              }`}
            >
              {tab.label}
              {tab.id === "unread" && notifications.filter(n => n.unread).length > 0 && (
                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block" />
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search messages..." 
            className="pl-10 h-10 rounded-xl bg-white border-0 shadow-sm" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Notifications List */}
      <Card className="border-none shadow-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((n, i) => (
                <motion.div 
                  key={n.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-6 flex gap-4 transition-all hover:bg-white dark:hover:bg-white/10 group ${n.unread ? "bg-emerald-50/30 dark:bg-emerald-900/20 ring-1 ring-inset ring-emerald-500/20" : ""}`}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-sm shrink-0">
                      <AvatarImage src={n.avatar} />
                      <AvatarFallback className="bg-[var(--terra-navy)] text-white text-xs">
                        {n.role.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {n.unread && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-bold">1</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#002147] dark:text-gray-100 group-hover:text-[var(--terra-emerald)] transition-colors">{n.sender}</span>
                        <Badge variant="outline" className={`text-[10px] h-4 uppercase font-bold border-0 ${
                          n.type === 'payment' ? 'bg-amber-100 text-amber-700' :
                          n.role === 'lro' ? 'bg-emerald-100 text-emerald-700' :
                          n.role === 'notary' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {n.type === 'payment' ? 'Payment' : n.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {n.time}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                      {n.message}
                    </p>
                    <div className="pt-3 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                      <Button onClick={() => handleReplyClick(n)} variant="outline" size="sm" className="h-8 text-[11px] font-bold gap-2 rounded-lg border-[var(--terra-emerald)] text-[var(--terra-emerald)] hover:bg-emerald-50">
                        <Reply className="w-3 h-3" />
                        Reply
                      </Button>
                      <Button onClick={() => markAsRead(n.id)} variant="ghost" size="sm" className={`h-8 text-[11px] rounded-lg ${!n.unread ? 'hidden' : ''}`}>
                         Mark as Read
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredNotifications.length === 0 && (
              <div className="py-20 text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-bold font-['Syne'] text-[#002147]">No notifications here</p>
                <p className="text-sm">You have no messages in the "{tabs.find(t=>t.id===activeTab)?.label}" category.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* REPLY DIALOG */}
      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-[#002147]">
              <Reply className="w-5 h-5 text-emerald-500" />
              Reply to {targetMsg?.sender}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/30 p-3 rounded-lg border text-xs text-muted-foreground italic">
              "{targetMsg?.message}"
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Your Response</Label>
              <Textarea 
                value={replyText} 
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[150px] rounded-xl border-border focus:ring-emerald-500" 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Attachments</Label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="rounded-lg h-9 gap-2 border-dashed border-2 hover:bg-blue-50 dark:hover:bg-blue-900/40 dark:border-blue-800/50 dark:text-blue-200 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4 text-blue-500" />
                  Upload Document
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="rounded-lg h-9 gap-2 border-dashed border-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 dark:border-emerald-800/50 dark:text-emerald-200 transition-all"
                  onClick={() => newScreenshotInputRef.current?.click()}
                >
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  Attach Image
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <input type="file" ref={newScreenshotInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
              {attachment && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/40 p-2.5 rounded-xl text-xs text-emerald-700 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-800/50 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-bold truncate max-w-[200px]">{attachment.name}</span>
                  <button onClick={() => setAttachment(null)} className="ml-auto p-1 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setIsReplyOpen(false)}>Cancel</Button>
            <Button onClick={sendReply} className="bg-[var(--terra-navy)] text-white gap-2 h-11 px-8 rounded-xl">
               Send Reply <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
