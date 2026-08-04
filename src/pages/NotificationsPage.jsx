// BEHAVIOR: Internal messaging center for Terratrace users. Allows sending text + file attachments, filtering by roles, replying, archiving, and clearing messages.
import { useState, useMemo, useRef, useEffect } from "react";
// BEHAVIOR: Navigation & Action Icons (Paperclip, Trash, Archive, Reply, Download)
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
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
// BACKEND_CONNECTION: Hooks query notifications, sent notifications, and potential messaging partners from database.
import { useNotifications, useSentNotifications, useRecipients } from "../hooks/useNotificationsData";

export default function NotificationsPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewMsgOpen, setIsNewMsgOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [targetMsg, setTargetMsg] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);
  const [clearedNotifIds, setClearedNotifIds] = useState([]);
  const fileInputRef = useRef(null);
  const replyFileInputRef = useRef(null);
  
  const queryClient = useQueryClient();

  // ─── Server state via TanStack Query ─────────────────────────────────────────
  // BACKEND_CONNECTION: useNotifications fetches inbox notifications
  const { data: notifications = [] } = useNotifications();
  // BACKEND_CONNECTION: useSentNotifications fetches sent messages
  const { data: sentNotifications = [] } = useSentNotifications();
  // BACKEND_CONNECTION: useRecipients fetches list of officers & clients for selection dropdown
  const { data: users = [] } = useRecipients();

  // BEHAVIOR: Loads cleared notification IDs from localStorage on mount
  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`cleared_inbox_notifications_${currentUser._id || currentUser.id}`);
      setClearedNotifIds(saved ? JSON.parse(saved) : []);
    }
  }, [currentUser]);

  // BEHAVIOR: Prefills compose message dialog if recipientId, subject, or body are in query params
  useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    const recipientId = qParams.get("recipientId");
    const subject = qParams.get("subject");
    const body = qParams.get("body");

    if (recipientId && users.length > 0) {
      const recipientUser = users.find(u => u._id === recipientId || u.id === recipientId);
      if (recipientUser) {
        setRecipientRole(recipientUser.role);
        setSelectedRecipientId(recipientId);
        if (subject) setNewMsgSubject(subject);
        if (body) setNewMsgBody(body);
        setIsNewMsgOpen(true);
        // Clear query parameters from URL so that opening the page doesn't keep popping the dialog
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.search, users, navigate, location.pathname]);

  const [recipientRole, setRecipientRole] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [newMsgSubject, setNewMsgSubject] = useState("");
  const [newMsgBody, setNewMsgBody] = useState("");

  // BEHAVIOR: Filters display list by inbox vs. sent active tabs and local hidden exclusions
  const displayList = useMemo(() => {
    if (activeTab === "sent") return sentNotifications;
    return notifications.filter(n => !clearedNotifIds.includes(n._id));
  }, [activeTab, notifications, sentNotifications, clearedNotifIds]);

  // BEHAVIOR: Filters display items by search string and category type
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

  // BEHAVIOR: Handler executing status updates (read, archived) or direct deletion
  const handleAction = async (id, action, value) => {
    try {
      if (action === 'status') {
        // BACKEND_CONNECTION: PATCH /notifications/:id/status updates the message state
        await api.patch(`/notifications/${id}/status`, { status: value });
        const msg = value === 'archived' ? "Notification archived" : 
                    value === 'read' && activeTab === 'archived' ? "Notification unarchived" : 
                    `Notification marked as ${value}`;
        toast.success(msg);
      } else if (action === 'delete') {
        // BACKEND_CONNECTION: DELETE /notifications/:id deletes database row
        await api.delete(`/notifications/${id}`);
        toast.success("Notification deleted");
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'sent'] });
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleClearAll = () => {
    setClearAllConfirmOpen(true);
  };

  // BEHAVIOR: Excludes all notifications matching current inbox from local display only
  const executeClearAll = () => {
    const idsToClear = notifications
      .filter(n => n.status !== 'archived')
      .map(n => n._id);
    const updated = [...new Set([...clearedNotifIds, ...idsToClear])];
    setClearedNotifIds(updated);
    if (currentUser) {
      localStorage.setItem(`cleared_inbox_notifications_${currentUser._id || currentUser.id}`, JSON.stringify(updated));
    }
    toast.success("Inbox cleared from view (frontend only)");
    setClearAllConfirmOpen(false);
  };

  // BEHAVIOR: Downloads notification attachment files in a separate tab
  const handleDownload = async (path) => {
    try {
      // BACKEND_CONNECTION: GET server assets via direct relative download path
      window.open(`http://localhost:5001${path}`, '_blank');
    } catch (err) {
      toast.error("Download failed");
    }
  };

  // BEHAVIOR: Handles selected local files loading check
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

  // BEHAVIOR: Prepares reply context targeting sender of selected message
  const handleReplyClick = (msg) => {
    setTargetMsg(msg);
    setReplyText("");
    setAttachments([]);
    setIsReplyOpen(true);
  };

  // BEHAVIOR: Sends reply message, uploading attachments as Multipart Form data
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

      // BACKEND_CONNECTION: POST /notifications/send with multipart/form-data header
      await api.post('/notifications/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Reply sent");
      setIsReplyOpen(false);
      setReplyText("");
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'sent'] });
    } catch (err) {
      toast.error("Failed to send reply");
    }
  };

  // BEHAVIOR: Formulates new message form variables into a Multipart payload and posts to server
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

      // BACKEND_CONNECTION: POST /notifications/send submitting new dialogue with attachments
      await api.post('/notifications/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success("Message sent successfully!");
      setIsNewMsgOpen(false);
      setNewMsgSubject("");
      setNewMsgBody("");
      setSelectedRecipientId("");
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'sent'] });
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
    // COLOR_THEME: Main page wrapper background is #002147 for dark mode
    <div className="space-y-8 pb-12 overflow-y-auto h-full pr-6 dark:bg-[#002147] dark:text-gray-100 p-6 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-8 gap-4">
        <div>
          {/* COLOR_THEME: Header highlighted with var(--terra-emerald) */}
          <h1 className="text-3xl font-bold font-['Syne'] text-[#002147] dark:text-[var(--terra-emerald)]">Communication Hub</h1>
          <p className="text-muted-foreground mt-1 text-base">
            Securely exchange messages and multi-document attachments.
          </p>
        </div>
        
        <div className="flex gap-3">
          {activeTab !== 'sent' && (
            // COLOR_THEME: Clear Inbox button uses light red styling highlights
            <Button variant="outline" onClick={handleClearAll} className="gap-2 rounded-xl h-11 px-5 border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Clear Inbox
            </Button>
          )}

          <Dialog open={isNewMsgOpen} onOpenChange={(val) => { setIsNewMsgOpen(val); if(!val) setAttachments([]); }}>
            <DialogTrigger asChild>
              {/* COLOR_THEME: New Message CTA uses emerald background palette */}
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
                        <SelectItem value="Admin">Admin</SelectItem>
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
                {/* COLOR_THEME: Primary message send button highlighted in Emerald */}
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
            /* COLOR_THEME: Selection buttons utilize dynamic background highlights including emerald & navy combinations */
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
                /* COLOR_THEME: Unread notifications highlighted with soft green ring border & background */
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
                      {/* BACKEND_CONNECTION: Profile pictures fetched dynamically from backend upload folders */}
                      <AvatarImage src={(() => {
                        const targetUser = activeTab === 'sent' ? n.recipient : n.sender;
                        if (!targetUser) return "https://api.dicebear.com/7.x/avataaars/svg?seed=System";
                        if (!targetUser.profilePic) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.firstName}`;
                        
                        if (targetUser.profilePic === 'default-profile.png') {
                          return 'http://localhost:5001/assets/default-profile.png';
                        }
                        
                        const isAbsolute = targetUser.profilePic.startsWith('http') || targetUser.profilePic.startsWith('data:');
                        let avatarUrl = isAbsolute ? targetUser.profilePic : `http://localhost:5001/${targetUser.profilePic.startsWith('/') ? targetUser.profilePic.substring(1) : targetUser.profilePic}`;
                        
                        if (avatarUrl.includes("cloudinary.com") && avatarUrl.includes("/image/upload/")) {
                          avatarUrl = avatarUrl.replace("/image/upload/", "/image/upload/c_thumb,g_face,w_200,h_200/");
                        }
                        return avatarUrl;
                      })()} />
                      {/* COLOR_THEME: Avatar fallback matches primary navy styling */}
                      <AvatarFallback className="bg-[var(--terra-navy)] text-white text-xs">
                        {(activeTab === 'sent' ? n.recipient : n.sender)?.firstName?.[0] || "S"}{(activeTab === 'sent' ? n.recipient : n.sender)?.lastName?.[0] || "Y"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {/* COLOR_THEME: Hover text utilizes emerald variable */}
                        <span className="font-bold text-[#002147] dark:text-gray-100 group-hover:text-[var(--terra-emerald)] transition-colors text-sm">
                          {activeTab === 'sent' ? `To: ${n.recipient?.firstName} ${n.recipient?.lastName}` : n.sender ? `${n.sender.firstName} ${n.sender.lastName}` : "System"}
                        </span>
                        {/* COLOR_THEME: Badges styled using alert/info background overlays */}
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
                    {/* COLOR_THEME: Subject header colored in Primary Navy/Emerald */}
                    <p className="text-sm font-bold text-[var(--terra-navy)] dark:text-emerald-400">{n.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                      {n.message}
                    </p>

                    {/* COLOR_THEME: Attachment item border turns emerald on hover */}
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
                      {/* COLOR_THEME: Reply CTA button borders and text color are emerald themed */}
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

                      {/* COLOR_THEME: Delete action is colored in red */}
                      <Button onClick={() => handleAction(n._id, 'delete')} variant="ghost" size="sm" className="h-8 text-[11px] rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredNotifications.length === 0 && (
              <div className="py-20 text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                {/* COLOR_THEME: Inner empty text styled with Navy color */}
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
            {/* COLOR_THEME: Action submit button styled in Navy #002147 */}
            <Button onClick={sendReply} className="bg-[var(--terra-navy)] text-white gap-2 h-11 px-8 rounded-xl">Send Reply <ArrowRight className="w-4 h-4" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CLEAR ALL NOTIFICATIONS CONFIRMATION DIALOG */}
      <Dialog open={clearAllConfirmOpen} onOpenChange={setClearAllConfirmOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
          <div className="bg-red-500 p-6 flex flex-col items-center text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold font-['Syne']">Clear Communications</DialogTitle>
            <DialogDescription className="text-white/80 mt-1">This will hide your inbox messages from view.</DialogDescription>
          </div>
          <div className="p-8">
            <p className="text-center text-gray-600 dark:text-gray-300 font-medium">
              Are you sure you want to clear your inbox view?
            </p>
            <p className="text-center text-xs text-muted-foreground mt-2 px-4 dark:text-gray-400">
              This is a frontend-only action. Your messages remain in the database and will no longer appear in your inbox on this device. Sent messages and archived items are unaffected.
            </p>
          </div>
          <DialogFooter className="p-6 bg-muted/30 border-t flex gap-3">
            <Button variant="ghost" onClick={() => setClearAllConfirmOpen(false)} className="flex-1 rounded-xl h-11">No, Keep Messages</Button>
            <Button onClick={executeClearAll} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 font-bold shadow-lg shadow-red-500/20">
              Yes, Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
