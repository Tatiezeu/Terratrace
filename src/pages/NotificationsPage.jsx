import { useState, useMemo, useRef, useEffect } from "react";
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
  Archive,
  ArchiveRestore,
  ArrowRight,
  Download,
  FileText,
  ExternalLink,
  Plus
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
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { cn } from "../app/components/ui/utils";

export default function NotificationsPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewMsgOpen, setIsNewMsgOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [targetMsg, setTargetMsg] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const replyFileInputRef = useRef(null);
  
  const [notifications, setNotifications] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [recipientRole, setRecipientRole] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [newMsgSubject, setNewMsgSubject] = useState("");
  const [newMsgBody, setNewMsgBody] = useState("");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [notifRes, sentRes, userRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/sent'),
        api.get('/users/recipients')
      ]);
      if (notifRes.data.success) setNotifications(notifRes.data.data);
      if (sentRes.data.success) setSentNotifications(sentRes.data.data);
      if (userRes.data.success) setUsers(userRes.data.data);
    } catch (err) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const displayList = useMemo(() => {
    if (activeTab === "sent") return sentNotifications;
    return notifications;
  }, [activeTab, notifications, sentNotifications]);

  const filteredNotifications = useMemo(() => {
    return displayList.filter(n => {
      const matchesSearch = 
        n.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.sender ? `${n.sender.firstName} ${n.sender.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
        (n.recipient ? `${n.recipient.firstName} ${n.recipient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) : false);
      
      let matchesTab = true;
      if (activeTab === "unread") matchesTab = n.status === "unread";
      else if (activeTab === "archived") matchesTab = n.status === "archived";
      else if (activeTab === "official") matchesTab = n.type === "unblock_request";
      else if (activeTab === "all") matchesTab = n.status !== "archived";
      
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab, displayList]);

  const handleAction = async (id, action, value) => {
    try {
      if (action === 'status') {
        await api.patch(`/notifications/${id}/status`, { status: value });
        const msg = value === 'archived' ? "Notification archived" : 
                    value === 'read' && activeTab === 'archived' ? "Notification unarchived" : 
                    `Notification marked as ${value}`;
        toast.success(msg);
      } else if (action === 'delete') {
        await api.delete(`/notifications/${id}`);
        toast.success("Notification deleted");
      }
      fetchAll();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications');
      toast.success("All notifications cleared");
      setNotifications([]);
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  };

  const handleDownload = async (path) => {
    try {
      const fileName = path.split('/').pop();
      const response = await fetch(`http://localhost:5001${path}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error("Download failed");
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (attachments.length + files.length > 5) {
      toast.error("Maximum 5 attachments allowed");
      return;
    }
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleReplyClick = (msg) => {
    setTargetMsg(msg);
    setReplyText("");
    setAttachments([]);
    setIsReplyOpen(true);
  };

  const sendReply = async () => {
    if (!replyText.trim() && attachments.length === 0) {
        toast.error("Please enter a message or attach a file");
        return;
    }
    try {
      const formData = new FormData();
      formData.append('recipientId', targetMsg.sender?._id || targetMsg.recipient?._id);
      formData.append('title', `Re: ${targetMsg.title}`);
      formData.append('message', replyText);
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      await api.post('/notifications/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Reply sent");
      setIsReplyOpen(false);
      setReplyText("");
      setAttachments([]);
      fetchAll();
    } catch (err) {
      toast.error("Failed to send reply");
    }
  };

  const handleCreateNewMsg = async () => {
    if (!selectedRecipientId || !newMsgBody || !newMsgSubject) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('recipientId', selectedRecipientId);
      formData.append('title', newMsgSubject);
      formData.append('message', newMsgBody);
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      await api.post('/notifications/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success("Message sent successfully!");
      setIsNewMsgOpen(false);
      setNewMsgSubject("");
      setNewMsgBody("");
      setSelectedRecipientId("");
      setAttachments([]);
      fetchAll();
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const tabs = [
    { id: "all", label: "Inbox" },
    { id: "unread", label: "Unread" },
    { id: "sent", label: "Sent" },
    { id: "official", label: "Alerts" },
    { id: "archived", label: "Archived" },
  ];

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 pb-12 overflow-y-auto h-full pr-6 dark:bg-[#002147] dark:text-gray-100 p-6 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Syne'] text-[#002147] dark:text-[var(--terra-emerald)]">Communication Hub</h1>
          <p className="text-muted-foreground mt-1 text-base">
            Securely exchange messages and multi-document attachments.
          </p>
        </div>
        
        <div className="flex gap-3">
          {activeTab !== 'sent' && (
            <Button variant="outline" onClick={clearAll} className="gap-2 rounded-xl h-11 px-5 border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Clear Inbox
            </Button>
          )}

          <Dialog open={isNewMsgOpen} onOpenChange={(val) => { setIsNewMsgOpen(val); if(!val) setAttachments([]); }}>
            <DialogTrigger asChild>
              <Button className="bg-[var(--terra-emerald)] hover:bg-emerald-600 text-white gap-2 h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20">
                <Send className="w-4 h-4" /> New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-['Syne']">Compose New Message</DialogTitle>
                <DialogDescription>Attach up to 5 documents or images.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase opacity-70">Role Filter</Label>
                    <Select onValueChange={(v) => { setRecipientRole(v); setSelectedRecipientId(""); }}>
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Landowner">Landowner</SelectItem>
                        <SelectItem value="LRO">Registry Officer</SelectItem>
                        <SelectItem value="Notary">Notary Officer</SelectItem>
                        <SelectItem value="Client">Client</SelectItem>
                        <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase opacity-70">Recipient</Label>
                    <Select onValueChange={setSelectedRecipientId} value={selectedRecipientId}>
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue placeholder="Select User" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => !recipientRole || u.role === recipientRole).map(u => (
                          <SelectItem key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.role})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase opacity-70">Subject</Label>
                  <Input value={newMsgSubject} onChange={(e) => setNewMsgSubject(e.target.value)} placeholder="Subject" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase opacity-70">Message</Label>
                  <Textarea value={newMsgBody} onChange={(e) => setNewMsgBody(e.target.value)} placeholder="Your message..." className="min-h-[100px] rounded-xl" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase opacity-70">Attachments ({attachments.length}/5)</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="w-3 h-3 shrink-0" />
                          <span className="text-xs truncate">{file.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeAttachment(i)} className="h-6 w-6 text-red-500">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {attachments.length < 5 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => fileInputRef.current.click()}
                        className="w-full border-dashed rounded-xl h-10 gap-2 text-xs"
                      >
                        <Plus className="w-3 h-3" /> Add File
                      </Button>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateNewMsg} className="bg-[var(--terra-emerald)] text-white h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/20">
                  Send Now
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
              {tab.id === "unread" && notifications.filter(n => n.status === "unread").length > 0 && (
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
              {filteredNotifications.map((n) => (
                <motion.div 
                  key={n._id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "p-6 flex gap-4 transition-all hover:bg-white dark:hover:bg-white/10 group",
                    n.status === 'unread' && activeTab !== 'sent' ? "bg-emerald-50/30 dark:bg-emerald-900/20 ring-1 ring-inset ring-emerald-500/20" : ""
                  )}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-sm shrink-0">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${(n.sender || n.recipient)?.lastName}`} />
                      <AvatarFallback className="bg-[var(--terra-navy)] text-white text-xs">
                        {(n.sender || n.recipient)?.firstName?.[0]}{(n.sender || n.recipient)?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#002147] dark:text-gray-100 group-hover:text-[var(--terra-emerald)] transition-colors text-sm">
                          {activeTab === 'sent' ? `To: ${n.recipient?.firstName} ${n.recipient?.lastName}` : n.sender ? `${n.sender.firstName} ${n.sender.lastName}` : "System"}
                        </span>
                        <Badge variant="outline" className={`text-[9px] h-3.5 uppercase font-bold border-0 ${
                          n.type === 'unblock_request' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {n.type === 'unblock_request' ? 'Alert' : 'Message'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(n.createdAt)}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[var(--terra-navy)] dark:text-emerald-400">{n.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                      {n.message}
                    </p>

                    {/* Multiple Attachments List */}
                    {n.attachments && n.attachments.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {n.attachments.map((path, idx) => (
                          <div key={idx} className="inline-flex items-center gap-2 p-2 bg-muted/50 rounded-xl border border-border transition-all hover:border-[var(--terra-emerald)]">
                            <div className="p-1.5 bg-white dark:bg-slate-800 rounded shadow-sm">
                              {path.match(/\.(jpg|jpeg|png|gif)$/i) ? <ImageIcon className="w-4 h-4 text-emerald-500" /> : <FileText className="w-4 h-4 text-blue-500" />}
                            </div>
                            <span className="text-[10px] font-bold truncate max-w-[120px]">{path.split('/').pop()}</span>
                            <div className="flex gap-1 ml-1">
                              <a href={`http://localhost:5001${path}`} target="_blank" className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-colors" title="View"><ExternalLink className="w-3.5 h-3.5" /></a>
                              <button onClick={() => handleDownload(path)} className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors" title="Download"><Download className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                      {activeTab !== 'sent' && (
                        <Button onClick={() => handleReplyClick(n)} variant="outline" size="sm" className="h-8 text-[11px] font-bold gap-2 rounded-lg border-[var(--terra-emerald)] text-[var(--terra-emerald)] hover:bg-emerald-50">
                          <Reply className="w-3 h-3" /> Reply
                        </Button>
                      )}
                      
                      {n.status === 'unread' && activeTab !== 'sent' && (
                        <Button onClick={() => handleAction(n._id, 'status', 'read')} variant="ghost" size="sm" className="h-8 text-[11px] rounded-lg">Mark as Read</Button>
                      )}
                      
                      {n.status !== 'archived' && activeTab !== 'sent' && (
                        <Button onClick={() => handleAction(n._id, 'status', 'archived')} variant="ghost" size="sm" className="h-8 text-[11px] rounded-lg"><Archive className="w-3 h-3 mr-1" /> Archive</Button>
                      )}

                      {n.status === 'archived' && (
                        <Button onClick={() => handleAction(n._id, 'status', 'read')} variant="ghost" size="sm" className="h-8 text-[11px] rounded-lg text-emerald-600 hover:bg-emerald-50">
                           <ArchiveRestore className="w-3 h-3 mr-1" /> Unarchive
                        </Button>
                      )}

                      <Button onClick={() => handleAction(n._id, 'delete')} variant="ghost" size="sm" className="h-8 text-[11px] rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredNotifications.length === 0 && (
              <div className="py-20 text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-bold font-['Syne'] text-[#002147]">No messages here</p>
                <p className="text-sm">Your {activeTab} folder is currently empty.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* REPLY DIALOG */}
      <Dialog open={isReplyOpen} onOpenChange={(val) => { setIsReplyOpen(val); if(!val) setAttachments([]); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-[#002147]">
              <Reply className="w-5 h-5 text-emerald-500" />
              Reply to {(targetMsg?.sender || targetMsg?.recipient)?.firstName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/30 p-3 rounded-lg border text-xs text-muted-foreground italic line-clamp-2">"{targetMsg?.message}"</div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Your Response</Label>
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your reply..." className="min-h-[150px] rounded-xl border-border focus:ring-emerald-500" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase opacity-70">Attachments ({attachments.length}/5)</Label>
              <div className="grid grid-cols-2 gap-2">
                {attachments.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border">
                    <span className="text-[10px] truncate max-w-[100px]">{file.name}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeAttachment(i)} className="h-5 w-5 text-red-500"><X className="w-3 h-3" /></Button>
                  </div>
                ))}
                {attachments.length < 5 && (
                  <Button type="button" variant="outline" onClick={() => replyFileInputRef.current.click()} className="border-dashed rounded-xl h-10 gap-2 text-xs col-span-2"><Plus className="w-3 h-3" /> Add Attachment</Button>
                )}
              </div>
              <input type="file" ref={replyFileInputRef} className="hidden" multiple onChange={handleFileChange} />
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => { setIsReplyOpen(false); setAttachments([]); }}>Cancel</Button>
            <Button onClick={sendReply} className="bg-[var(--terra-navy)] text-white gap-2 h-11 px-8 rounded-xl">Send Reply <ArrowRight className="w-4 h-4" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
