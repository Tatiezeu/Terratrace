import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Plus, Trash2, Send, FolderOpen, FileText, Settings2,
  ChevronLeft, Paperclip, MessageSquare, Edit2,
  File, Image, Loader2, ArrowLeft, Bot, Eye, Download
} from 'lucide-react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const uid = () => Math.random().toString(36).slice(2, 11);
const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => {
  const dd = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - dd) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return dd.toLocaleDateString();
};

// Prints or opens a clean proposal summary layout
function handleDownloadSummary(project) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Project Proposal Summary — ${project.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fafafa; }
          .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
          .logo { font-weight: bold; color: #002147; font-size: 24px; }
          .logo span { color: #D4AF37; }
          h1 { font-size: 28px; margin: 10px 0; color: #0f172a; }
          p.desc { font-size: 14px; color: #64748b; line-height: 1.6; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #D4AF37; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; margin-bottom: 12px; font-weight: bold; }
          .card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #f1f5f9; margin-bottom: 10px; font-size: 13px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .meta-item { font-size: 13px; }
          .meta-label { font-weight: bold; color: #475569; display: block; margin-bottom: 3px; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Terra<span>Trace</span></div>
            <h1>Project Proposal Summary</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Project Details</div>
            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Project Name</span>
                <strong>${project.name}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-label">Category / Emoji</span>
                <strong>${project.emoji || '📁'} Project</strong>
              </div>
            </div>
            <div class="meta-item">
              <span class="meta-label">Project Goal Description</span>
              <p class="desc">${project.description || 'No goal description configured.'}</p>
            </div>
          </div>

          <div class="section">
            <div class="section-title">AI Directives & Instructions</div>
            ${project.instructionsList && project.instructionsList.length > 0 ? 
              project.instructionsList.map(ins => `
                <div class="card">
                  <p style="margin:0; line-height:1.5;">"${ins.text}"</p>
                </div>
              `).join('') : `
                <div class="card" style="color:#64748b; font-style:italic;">No AI directives assigned yet.</div>
              `
            }
          </div>

          <div class="footer">
            TerraTrace Cameroon © 2026 — Verified Land Registry Platform.
          </div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ── Inline markdown renderer ───────────────────────────────────────────────
function renderMd(text, navigate, project) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={li}>
        {parts.map((p, pi) => {
          if (p.startsWith('**') && p.endsWith('**')) {
            return <strong key={pi} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
          }
          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
          const linkParts = [];
          let lastIndex = 0;
          let match;
          while ((match = linkRegex.exec(p)) !== null) {
            const [, linkText, url] = match;
            if (match.index > lastIndex) linkParts.push(p.slice(lastIndex, match.index));

            if (url === '#download-summary') {
              linkParts.push(
                <button key={match.index} onClick={() => handleDownloadSummary(project)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#D4AF37] text-[#002147] hover:brightness-105 active:scale-95 transition-all inline-flex items-center gap-1 mx-1">
                  <Download size={10} />Download Summary
                </button>
              );
            } else {
              linkParts.push(
                <a key={match.index} href={url}
                  className="text-[#D4AF37] underline underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    if (url.startsWith('/dashboard')) {
                      const urlObj = new URL(url, window.location.origin);
                      navigate(urlObj.pathname, { state: { search: urlObj.searchParams.get('search') || '' } });
                    } else {
                      window.open(url, '_blank', 'noopener');
                    }
                  }}>
                  {linkText}
                </a>
              );
            }
            lastIndex = match.index + match[0].length;
          }
          if (lastIndex < p.length) linkParts.push(p.slice(lastIndex));
          return linkParts.length > 0 ? <span key={pi}>{linkParts}</span> : <span key={pi}>{p}</span>;
        })}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ user, size = 28 }) {
  const initials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : '?';
  if (user?.profilePic && user.profilePic !== 'default-profile.png') {
    return <img src={user.profilePic} alt={initials} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[#002147]"
      style={{ width: size, height: size, background: '#D4AF37', fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

// ── File kind icon ─────────────────────────────────────────────────────────────
function FileIcon({ kind }) {
  if (kind === 'image') return <Image size={14} className="text-blue-400" />;
  if (kind === 'pdf') return <File size={14} className="text-red-400" />;
  return <FileText size={14} className="text-amber-400" />;
}

// ── File Preview Modal ────────────────────────────────────────────────────────
function FilePreviewModal({ file, onClose }) {
  const handleViewExternal = () => {
    if (!file.url) return;
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(`
        <html>
          <head><title>File Preview — ${file.name}</title></head>
          <body style="margin:0; background:#0f172a; display:flex; align-items:center; justify-center; height:100vh;">
            ${file.kind === 'image' 
              ? `<img src="${file.url}" style="max-width:100%; max-height:100%; object-fit:contain; margin:auto;" />`
              : `<iframe src="${file.url}" style="width:100%; height:100%; border:none;"></iframe>`
            }
          </body>
        </html>
      `);
      newTab.document.close();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[300] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl p-6 text-center"
        style={{ background: '#001830', border: '1px solid rgba(212,175,55,0.2)' }}>
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80"><X size={16} /></button>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/30">
          <FileIcon kind={file.kind} />
        </div>
        <h4 className="text-sm font-bold text-white mb-1 truncate">{file.name}</h4>
        <p className="text-[11px] text-white/40 mb-4">{file.size} · Uploaded: {fmtDate(file.uploadedAt)}</p>

        {file.kind === 'image' ? (
          <div className="w-full h-48 overflow-hidden rounded-xl bg-white/5 border border-white/5 mb-6 flex items-center justify-center cursor-pointer"
            onClick={handleViewExternal}>
            <img src={file.url} alt="preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-24 rounded-xl bg-white/5 border border-white/5 mb-6 flex flex-col items-center justify-center text-xs text-white/30 cursor-pointer"
            onClick={handleViewExternal}>
            <FileText size={20} className="mb-1 text-[#D4AF37]/60" />
            <span>Click to View Actual File Content</span>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors">
            Close
          </button>
          <button onClick={handleViewExternal}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#D4AF37] text-[#002147] flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-95 transition-all">
            <Download size={12} />Open In New Tab
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Project Chat View ─────────────────────────────────────────────────────────
function ProjectChatView({ project, chat, onBack, onAddMessage, authUser, isLightMode, onUpdateChatTitle }) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [chatTitle, setChatTitle] = useState(chat.title || 'New Chat');
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat?.messages?.length, isTyping]);

  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    if (!chatTitle.trim() || chatTitle === chat.title) return;
    try {
      await api.put(`/projects/${project._id}/chats/${chat._id}`, { title: chatTitle.trim() });
      onUpdateChatTitle(chat._id, chatTitle.trim());
    } catch (err) {
      console.error("Failed to rename project chat:", err);
    }
  };

  const handleSend = async () => {
    if (isTyping) return;
    const text = input.trim();
    if (!text && pendingFiles.length === 0) return;

    const userMsg = { id: uid(), role: 'user', content: text, attachments: pendingFiles, createdAt: new Date() };
    onAddMessage(chat._id, userMsg, null);
    setInput('');
    setPendingFiles([]);
    setIsTyping(true);

    try {
      await api.post(`/projects/${project._id}/chats/${chat._id}/messages`, { role: 'user', content: text });

      const history = [...(chat.messages || []), userMsg].slice(-16).map(m => ({
        role: m.role === 'user' || m.role === 'client' ? 'user' : 'model',
        content: m.content || '',
      }));

      const res = await api.post('/chatbot/chat', {
        messages: history,
        projectName: project.name,
        projectDescription: project.description,
        projectInstructions: project.instructionsList?.map(i => i.text).join('\n') || project.instructions || '',
      });

      const botReplyText = res.data.reply || '';
      const botMsg = { id: uid(), role: 'model', content: botReplyText, createdAt: new Date() };

      await api.post(`/projects/${project._id}/chats/${chat._id}/messages`, { role: 'model', content: botReplyText });
      onAddMessage(chat._id, null, botMsg);
    } catch (err) {
      onAddMessage(chat._id, null, { id: uid(), role: 'model', content: '⚠️ AI temporarily unavailable. Please try again.', createdAt: new Date() });
    } finally {
      setIsTyping(false);
    }
  };

  const handleFile = (e) => {
    const files = Array.from(e.target.files || []);
    const attached = files.map(f => ({
      id: uid(), name: f.name,
      size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
      kind: f.type.startsWith('image/') ? 'image' : f.type === 'application/pdf' ? 'pdf' : f.name.match(/\.docx?$/i) ? 'doc' : 'other',
    }));
    setPendingFiles(prev => [...prev, ...attached]);
    e.target.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: isLightMode ? '1px solid #E6E3DB' : '1px solid rgba(212,175,55,0.08)' }}>
        <button onClick={onBack} className={`p-1.5 rounded-lg transition-colors ${isLightMode ? 'text-[#2D2B2A] hover:bg-black/10' : 'text-white/40 hover:text-white/80'}`}>
          <ArrowLeft size={15} />
        </button>
        <Bot size={15} className="text-[#D4AF37]" />
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              value={chatTitle}
              onChange={e => setChatTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
              onBlur={handleSaveTitle}
              className={`text-sm font-semibold bg-transparent border-b border-[#D4AF37] outline-none ${isLightMode ? 'text-[#2D2B2A]' : 'text-white'}`}
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-semibold truncate ${isLightMode ? 'text-[#2D2B2A]' : 'text-white'}`}>{chat.title}</span>
              <button onClick={() => setIsEditingTitle(true)} className="text-white/40 hover:text-[#D4AF37] p-0.5" title="Rename Chat">
                <Edit2 size={12} />
              </button>
            </div>
          )}
          <div className={`text-[10px] flex items-center gap-1 ${isLightMode ? 'text-[#666259]' : 'text-white/30'}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Project: {project.name}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
        {(!chat.messages || chat.messages.length === 0) && (
          <div className="text-center py-10">
            <Bot size={28} className="mx-auto mb-3 text-[#D4AF37]/30" />
            <p className={`text-sm ${isLightMode ? 'text-[#666259]' : 'text-white/30'}`}>Start conversation about <span className="text-[#D4AF37] font-medium">{project.name}</span></p>
          </div>
        )}
        {(chat.messages || []).map((msg) => {
          const isUser = msg.role === 'user' || msg.role === 'client';
          return (
            <div key={msg._id || msg.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
              {isUser
                ? <div className="w-6.5 h-6.5 rounded-full bg-[#002147] border border-[#D4AF37]/40 flex items-center justify-center text-[10px] font-bold text-[#D4AF37]" style={{ width: 26, height: 26 }}>
                    {authUser?.firstName?.charAt(0) || 'U'}
                  </div>
                : <div className="w-6.5 h-6.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0" style={{ width: 26, height: 26 }}><Bot size={13} className="text-[#D4AF37]" /></div>
              }
              <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {msg.attachments?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {msg.attachments.map(f => (
                      <div key={f.id || f._id} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] ${isLightMode ? 'bg-[#E6E3DB] text-[#2D2B2A]' : 'bg-white/5 border border-white/10 text-white/60'}`}>
                        <FileIcon kind={f.kind} />{f.name}
                      </div>
                    ))}
                  </div>
                )}
                {msg.content && (
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isUser
                    ? 'text-[#002147] rounded-tr-sm font-medium'
                    : isLightMode
                    ? 'text-[#2D2B2A] bg-white border border-[#E6E3DB] rounded-tl-sm'
                    : 'text-white/90 bg-white/5 border border-white/5 rounded-tl-sm'}`}
                    style={isUser ? { background: '#D4AF37', maxWidth: 'fit-content' } : {}}>
                    {msg.content}
                  </div>
                )}
                <span className={`text-[9px] px-1 ${isLightMode ? 'text-[#8C877D]' : 'text-white/20'}`}>{fmtTime(msg.createdAt || new Date())}</span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2.5">
            <div className="w-6.5 h-6.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center" style={{ width: 26, height: 26 }}>
              <Bot size={13} className="text-[#D4AF37]" />
            </div>
            <div className={`flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm ${isLightMode ? 'bg-white border border-[#E6E3DB]' : 'bg-white/5'}`}>
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {pendingFiles.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {pendingFiles.map(f => (
            <div key={f.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px]"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}>
              <FileIcon kind={f.kind} />{f.name}
              <button onClick={() => setPendingFiles(p => p.filter(x => x.id !== f.id))} className="ml-0.5 hover:text-red-400">
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <div className={`flex items-end gap-2 rounded-2xl px-3 py-2 ${
          isLightMode ? 'bg-white border border-[#D5D0C8]' : 'bg-white/5 border border-[#D4AF37]/20'
        }`}>
          <input ref={fileRef} type="file" className="hidden" multiple onChange={handleFile} accept="image/*,.pdf,.doc,.docx,.txt" />
          <button onClick={() => fileRef.current?.click()} disabled={isTyping} className={`p-1.5 rounded-lg transition-colors flex-shrink-0 disabled:opacity-30 ${isLightMode ? 'text-[#666259] hover:text-[#D4AF37]' : 'text-white/30 hover:text-[#D4AF37]'}`}>
            <Paperclip size={15} />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            disabled={isTyping}
            onChange={(e) => { setInput(e.target.value); adjustHeight(); }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={isTyping ? "TerraTrace AI is responding..." : `Chat about ${project.name}…`}
            className={`flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed ${
              isLightMode ? 'text-[#2D2B2A] placeholder-[#8C877D]' : 'text-white placeholder-white/20'
            } ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ maxHeight: 120 }}
          />
          <button onClick={handleSend} disabled={isTyping || (!input.trim() && pendingFiles.length === 0)}
            className="p-1.5 rounded-xl transition-all disabled:opacity-30 flex-shrink-0"
            style={{ background: '#D4AF37', color: '#002147' }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Project Detail View ───────────────────────────────────────────────────────
function ProjectDetailView({ project, onBack, onUpdate, currentUserId, authUser, isLightMode }) {
  const [tab, setTab] = useState('chats'); // chats | files | instructions
  const [chats, setChats] = useState(project.chats || []);
  const [files, setFiles] = useState(project.files || []);
  const [instructionsList, setInstructionsList] = useState(project.instructionsList || []);
  const [activeChat, setActiveChat] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editChatTitle, setEditChatTitle] = useState('');

  // Custom Instructions state
  const [insText, setInsText] = useState('');
  const [savingInstruction, setSavingInstruction] = useState(false);

  const fileRef = useRef(null);

  // Sync state if project changes
  useEffect(() => {
    setChats(project.chats || []);
    setFiles(project.files || []);
    setInstructionsList(project.instructionsList || []);
  }, [project]);

  // Project Chats management
  const createChat = async () => {
    setCreatingChat(true);
    try {
      const res = await api.post(`/projects/${project._id}/chats`, { title: `Chat ${chats.length + 1}` });
      const newChat = res.data.data;
      const updatedChats = [...chats, newChat];
      setChats(updatedChats);
      setActiveChat(newChat);
      onUpdate({ ...project, chats: updatedChats });
    } catch (err) {
      console.error("Failed to create chat in project:", err);
    } finally {
      setCreatingChat(false);
    }
  };

  const deleteChat = async (chatId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/projects/${project._id}/chats/${chatId}`);
      const updatedList = chats.filter(c => c._id !== chatId);
      setChats(updatedList);
      if (activeChat?._id === chatId) setActiveChat(null);
      onUpdate({ ...project, chats: updatedList });
    } catch (err) {
      console.error("Failed to delete chat in project:", err);
    }
  };

  const renameChat = async (chatId, newTitle) => {
    try {
      await api.put(`/projects/${project._id}/chats/${chatId}`, { title: newTitle });
      const updatedList = chats.map(c => c._id === chatId ? { ...c, title: newTitle } : c);
      setChats(updatedList);
      if (activeChat?._id === chatId) setActiveChat(prev => ({ ...prev, title: newTitle }));
      onUpdate({ ...project, chats: updatedList });
    } catch (err) {
      console.error("Failed to rename project chat:", err);
    }
  };

  const addMessageToChat = (chatId, userMsg, botMsg) => {
    const updatedChats = chats.map(c => {
      if (c._id !== chatId) return c;
      const msgs = [...(c.messages || [])];
      if (userMsg) msgs.push(userMsg);
      if (botMsg) msgs.push(botMsg);
      return { ...c, messages: msgs };
    });
    setChats(updatedChats);
    onUpdate({ ...project, chats: updatedChats });

    setActiveChat(prev => {
      if (!prev || prev._id !== chatId) return prev;
      const msgs = [...(prev.messages || [])];
      if (userMsg) msgs.push(userMsg);
      if (botMsg) msgs.push(botMsg);
      return { ...prev, messages: msgs };
    });
  };

  // Instructions management
  const addInstruction = async () => {
    if (!insText.trim()) return;
    setSavingInstruction(true);
    try {
      const res = await api.post(`/projects/${project._id}/instructions`, {
        text: insText.trim(),
      });
      if (res.data.success) {
        setInstructionsList(res.data.data);
        setInsText('');
        onUpdate({ ...project, instructionsList: res.data.data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingInstruction(false);
    }
  };

  const deleteInstruction = async (insId) => {
    try {
      await api.delete(`/projects/${project._id}/instructions/${insId}`);
      const updatedList = instructionsList.filter(i => i._id !== insId);
      setInstructionsList(updatedList);
      onUpdate({ ...project, instructionsList: updatedList });
    } catch (err) {
      console.error(err);
    }
  };

  // Files management
  const handleAddFile = async (e) => {
    const filesArray = Array.from(e.target.files || []);
    if (filesArray.length === 0) return;

    for (const f of filesArray) {
      const sizeStr = f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`;
      const isImg = f.type.startsWith('image/');
      const isPdf = f.type === 'application/pdf';
      const kind = isImg ? 'image' : isPdf ? 'pdf' : f.name.match(/\.docx?$/i) ? 'doc' : 'other';

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Url = event.target.result;
        try {
          const res = await api.post(`/projects/${project._id}/files`, {
            name: f.name,
            size: sizeStr,
            kind,
            url: base64Url
          });
          if (res.data.success) {
            setFiles(res.data.data);
            onUpdate({ ...project, files: res.data.data });
          }
        } catch (err) {
          console.error("Failed to upload file details:", err);
        }
      };
      reader.readAsDataURL(f);
    }
    e.target.value = '';
  };

  const removeFile = async (fileId) => {
    try {
      await api.delete(`/projects/${project._id}/files/${fileId}`);
      const updatedList = files.filter(f => f._id !== fileId);
      setFiles(updatedList);
      onUpdate({ ...project, files: updatedList });
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  if (activeChat) {
    return (
      <ProjectChatView
        project={project}
        chat={activeChat}
        onBack={() => setActiveChat(null)}
        onAddMessage={addMessageToChat}
        authUser={authUser}
        isLightMode={isLightMode}
        onUpdateChatTitle={(chatId, title) => renameChat(chatId, title)}
      />
    );
  }

  const TABS = [
    { id: 'chats', label: 'AI Conversations', icon: MessageSquare },
    { id: 'files', label: 'Project Files', icon: FileText },
    { id: 'instructions', label: 'AI Directives', icon: Settings2 },
  ];

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: isLightMode ? '1px solid #E6E3DB' : '1px solid rgba(212,175,55,0.08)' }}>
        <button onClick={onBack} className={`p-1.5 rounded-lg transition-colors ${isLightMode ? 'text-[#2D2B2A] hover:bg-black/10' : 'text-white/40 hover:text-white/80'}`}>
          <ArrowLeft size={15} />
        </button>
        <span className="text-xl">{project.emoji || '📁'}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold truncate ${isLightMode ? 'text-[#2D2B2A]' : 'text-white'}`}>{project.name}</div>
          {project.description && <div className={`text-[10px] truncate ${isLightMode ? 'text-[#666259]' : 'text-white/35'}`}>{project.description}</div>}
        </div>
        <button
          onClick={() => handleDownloadSummary(project)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D4AF37] text-[#002147] hover:brightness-105 active:scale-95 transition-all shadow-sm flex-shrink-0"
          title="Download Project Summary"
        >
          <Download size={13} /> Summary
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 py-2 gap-1 flex-shrink-0" style={{ borderBottom: isLightMode ? '1px solid #E6E3DB' : '1px solid rgba(212,175,55,0.06)' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all"
              style={{
                background: active ? (isLightMode ? 'rgba(212,175,55,0.18)' : 'rgba(212,175,55,0.12)') : 'transparent',
                color: active ? (isLightMode ? '#B8860B' : '#D4AF37') : (isLightMode ? '#666259' : 'rgba(255,255,255,0.35)'),
                border: active ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
              }}>
              <Icon size={11} />{t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {/* CHATS TAB */}
        {tab === 'chats' && (
          <div className="p-4 space-y-2">
            <button onClick={createChat} disabled={creatingChat}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all mb-4 shadow-sm hover:brightness-110 active:scale-95"
              style={{ background: '#D4AF37', color: '#002147' }}>
              {creatingChat ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              New Chat
            </button>
            {chats.length === 0 && (
              <div className={`text-center py-8 text-sm ${isLightMode ? 'text-[#8C877D]' : 'text-white/25'}`}>No chats yet — start one above</div>
            )}
            {chats.map(chat => (
              <div key={chat._id}
                onClick={() => setActiveChat(chat)}
                className="group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all"
                style={{
                  background: isLightMode ? '#FFFFFF' : 'rgba(255,255,255,0.03)',
                  border: isLightMode ? '1px solid #E6E3DB' : '1px solid rgba(255,255,255,0.05)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = isLightMode ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = isLightMode ? '#FFFFFF' : 'rgba(255,255,255,0.03)'}>
                <MessageSquare size={14} className="text-[#D4AF37] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${isLightMode ? 'text-[#2D2B2A]' : 'text-white/80'}`}>{chat.title}</div>
                  <div className={`text-[10px] mt-0.5 ${isLightMode ? 'text-[#666259]' : 'text-white/30'}`}>{chat.messages?.length ?? 0} message{chat.messages?.length !== 1 ? 's' : ''}</div>
                </div>
                <button onClick={(e) => deleteChat(chat._id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* FILES TAB */}
        {tab === 'files' && (
          <div className="p-4 space-y-3">
            <input ref={fileRef} type="file" className="hidden" multiple onChange={handleAddFile}
              accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" />
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px dashed rgba(212,175,55,0.4)', color: isLightMode ? '#B8860B' : '#D4AF37' }}>
              <Paperclip size={14} />Add Files
            </button>
            {files.length === 0 && (
              <div className={`text-center py-8 text-sm ${isLightMode ? 'text-[#8C877D]' : 'text-white/25'}`}>No files attached yet</div>
            )}
            {files.map(f => (
              <div key={f._id || f.id} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{
                  background: isLightMode ? '#FFFFFF' : 'rgba(255,255,255,0.03)',
                  border: isLightMode ? '1px solid #E6E3DB' : '1px solid rgba(255,255,255,0.05)'
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)' }}>
                  <FileIcon kind={f.kind} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${isLightMode ? 'text-[#2D2B2A]' : 'text-white/80'}`}>{f.name}</div>
                  <div className={`text-[10px] ${isLightMode ? 'text-[#666259]' : 'text-white/30'}`}>{f.size}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPreviewFile(f)}
                    className="p-1.5 rounded hover:bg-[#D4AF37]/10 text-[#D4AF37] transition-all"
                    title="View File">
                    <Eye size={12} />
                  </button>
                  <button onClick={() => removeFile(f._id || f.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all"
                    title="Delete File">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INSTRUCTIONS TAB */}
        {tab === 'instructions' && (
          <div className="p-4 space-y-4">
            <div className={`text-[10px] uppercase tracking-widest block mb-1 ${isLightMode ? 'text-[#8C877D]' : 'text-white/30'}`}>Project AI Directives</div>
            <p className={`text-[11px] leading-relaxed ${isLightMode ? 'text-[#666259]' : 'text-white/40'}`}>
              Configure specific instructions that the AI assistant will follow during project conversations.
            </p>

            {/* Instruction input form */}
            <div className={`p-3.5 rounded-2xl space-y-3 ${
              isLightMode ? 'bg-white border border-[#E6E3DB]' : 'bg-white/5 border border-white/5'
            }`}>
              <textarea
                value={insText}
                onChange={e => setInsText(e.target.value)}
                rows={3}
                placeholder="Add a custom directive for the AI..."
                className={`w-full bg-transparent text-xs outline-none resize-none leading-relaxed ${
                  isLightMode ? 'text-[#2D2B2A] placeholder-[#8C877D]' : 'text-white placeholder-white/20'
                }`}
              />
              <div className={`flex items-center justify-end pt-2 ${isLightMode ? 'border-t border-[#E6E3DB]' : 'border-t border-white/5'}`}>
                <button onClick={addInstruction} disabled={!insText.trim() || savingInstruction}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
                  style={{ background: '#D4AF37', color: '#002147' }}>
                  {savingInstruction ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                  Add directive
                </button>
              </div>
            </div>

            {/* Instructions list */}
            <div className="space-y-2 pt-2">
              {instructionsList.length === 0 ? (
                <div className={`text-center py-6 text-xs italic ${isLightMode ? 'text-[#8C877D]' : 'text-white/20'}`}>No instruction directives configured yet</div>
              ) : (
                instructionsList.map(ins => (
                  <div key={ins._id} className={`flex gap-2 p-3 rounded-xl relative group ${
                    isLightMode ? 'bg-white border border-[#E6E3DB]' : 'bg-white/5 border border-white/5'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed break-words ${isLightMode ? 'text-[#2D2B2A]' : 'text-white/80'}`}>{ins.text}</p>
                    </div>
                    <button onClick={() => deleteInstruction(ins._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all self-start">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onOpen, onDelete, isLightMode }) {
  return (
    <div
      className="group relative rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden"
      style={{
        background: isLightMode ? '#FFFFFF' : 'rgba(255,255,255,0.03)',
        border: isLightMode ? '1px solid #E6E3DB' : '1px solid rgba(212,175,55,0.12)'
      }}
      onClick={() => onOpen(project)}
      onMouseEnter={e => e.currentTarget.style.border = isLightMode ? '1px solid #D4AF37' : '1px solid rgba(212,175,55,0.35)'}
      onMouseLeave={e => e.currentTarget.style.border = isLightMode ? '1px solid #E6E3DB' : '1px solid rgba(212,175,55,0.12)'}
    >
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0 mt-0.5">{project.emoji || '📁'}</div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-bold truncate ${isLightMode ? 'text-[#2D2B2A]' : 'text-white'}`}>{project.name}</div>
            {project.description && (
              <p className={`text-[11px] mt-0.5 leading-relaxed line-clamp-2 ${isLightMode ? 'text-[#666259]' : 'text-white/40'}`}>{project.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-[10px] ${isLightMode ? 'text-[#8C877D]' : 'text-white/30'}`}>
                {project.chats?.length || 0} chat{(project.chats?.length || 0) !== 1 ? 's' : ''}
              </span>
              <span className={`text-[10px] ${isLightMode ? 'text-[#8C877D]' : 'text-white/30'}`}>
                {project.files?.length || 0} file{(project.files?.length || 0) !== 1 ? 's' : ''}
              </span>
              <span className={`text-[10px] ${isLightMode ? 'text-[#8C877D]' : 'text-white/30'}`}>
                {project.instructionsList?.length || 0} directive{(project.instructionsList?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(project._id); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-all"
        title="Delete project"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ── New Project Modal ─────────────────────────────────────────────────────────
function NewProjectModal({ onClose, onCreate, isLightMode }) {
  const EMOJIS = ['🏗️', '🏫', '🏥', '🏨', '🏢', '🌾', '🏡', '🏭', '⛽', '🛒', '🎓', '🌳', '📐', '🗺️'];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [emoji, setEmoji] = useState('🏗️');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim(), notes: notes.trim(), emoji });
      onClose();
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[250] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.93, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: isLightMode ? '#FAF8F5' : '#001830',
          border: isLightMode ? '1px solid #E6E3DB' : '1px solid rgba(212,175,55,0.2)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: isLightMode ? '1px solid #E6E3DB' : '1px solid rgba(212,175,55,0.08)' }}>
          <h3 className={`text-sm font-bold ${isLightMode ? 'text-[#2D2B2A]' : 'text-white'}`}>New Project</h3>
          <button onClick={onClose} className={`p-1 rounded transition-colors ${isLightMode ? 'text-[#2D2B2A] hover:bg-black/10' : 'text-white/30 hover:text-white/70'}`}>
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Emoji picker */}
          <div>
            <label className={`text-[10px] uppercase tracking-widest block mb-2 ${isLightMode ? 'text-[#8C877D]' : 'text-white/30'}`}>Project Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`text-lg w-9 h-9 rounded-lg transition-all ${emoji === e ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/50 scale-110' : 'hover:bg-black/5 border border-transparent'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={`text-[10px] uppercase tracking-widest block mb-1.5 ${isLightMode ? 'text-[#8C877D]' : 'text-white/30'}`}>Project Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name your project"
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all ${
                isLightMode
                  ? 'bg-white text-[#2D2B2A] placeholder-[#8C877D] border border-[#D5D0C8] focus:border-[#D4AF37]'
                  : 'bg-white/5 text-white placeholder-white/25 border border-white/10 focus:border-[#D4AF37]/50'
              }`}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className={`text-[10px] uppercase tracking-widest block mb-1.5 ${isLightMode ? 'text-[#8C877D]' : 'text-white/30'}`}>What are you trying to achieve?</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your project, goals, subject, etc."
              rows={3}
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none leading-relaxed transition-all ${
                isLightMode
                  ? 'bg-white text-[#2D2B2A] placeholder-[#8C877D] border border-[#D5D0C8] focus:border-[#D4AF37]'
                  : 'bg-white/5 text-white placeholder-white/25 border border-white/10 focus:border-[#D4AF37]/50'
              }`}
            />
          </div>

          {/* Special Notes */}
          <div>
            <label className={`text-[10px] uppercase tracking-widest block mb-1.5 ${isLightMode ? 'text-[#8C877D]' : 'text-white/30'}`}>Special Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special requirements, constraints, or notes..."
              rows={2}
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none leading-relaxed transition-all ${
                isLightMode
                  ? 'bg-white text-[#2D2B2A] placeholder-[#8C877D] border border-[#D5D0C8] focus:border-[#D4AF37]'
                  : 'bg-white/5 text-white placeholder-white/25 border border-white/10 focus:border-[#D4AF37]/50'
              }`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              isLightMode
                ? 'bg-[#E6E3DB] text-[#2D2B2A] hover:bg-[#D8D4C8]'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
            }`}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!name.trim() || creating}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#D4AF37] text-[#002147] hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
            {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Create Project
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Projects Panel ───────────────────────────────────────────────────────
export default function ProjectsPanel({
  isOpen,
  onClose,
  authUser,
  projects,
  setProjects,
  activeProject,
  setActiveProject,
  loading,
  loadProjects,
  isLightMode
}) {
  const currentUserId = authUser?._id || authUser?.id;
  const [showNewModal, setShowNewModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleOpenProject = async (proj) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/projects/${proj._id}`);
      if (res.data.success) {
        setActiveProject(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load full project details:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const createProject = async ({ name, description, notes, emoji }) => {
    const res = await api.post('/projects', { name, description, notes, emoji });
    const proj = res.data.data;
    setProjects(prev => [proj, ...prev]);
    setActiveProject(proj);
  };

  const deleteProject = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
      if (activeProject?._id === id) setActiveProject(null);
    } catch (err) { console.error(err); }
  };

  const updateProject = (updated) => {
    setProjects(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
    if (activeProject?._id === updated._id) {
      setActiveProject(prev => ({ ...prev, ...updated }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="absolute inset-0 z-[220] flex flex-col font-['Montserrat']"
          style={{ background: isLightMode ? '#F5F2EB' : '#000c1e' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{
              background: isLightMode ? '#FAF8F5' : '#001228',
              borderBottom: isLightMode ? '1px solid #E6E3DB' : '1px solid rgba(212,175,55,0.1)'
            }}>
            <div className="flex items-center gap-2.5">
              {activeProject && (
                <button onClick={() => setActiveProject(null)}
                  className={`p-1 rounded-lg transition-colors mr-1 ${isLightMode ? 'text-[#2D2B2A] hover:bg-black/10' : 'text-white/30 hover:text-white/70'}`}>
                  <ChevronLeft size={15} />
                </button>
              )}
              <FolderOpen size={17} className="text-[#D4AF37]" />
              <div>
                <h2 className={`text-sm font-bold leading-none ${isLightMode ? 'text-[#2D2B2A]' : 'text-white'}`}>
                  {activeProject ? activeProject.name : 'My Projects'}
                </h2>
                <div className="text-[9px] uppercase tracking-widest text-[#D4AF37] mt-0.5">
                  {activeProject ? 'Project Workspace' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!activeProject && (
                <button onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm hover:brightness-110 active:scale-95"
                  style={{ background: '#D4AF37', color: '#002147' }}>
                  <Plus size={13} />New
                </button>
              )}
              <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isLightMode ? 'text-[#2D2B2A] hover:bg-black/10' : 'text-white/30 hover:text-white/70'}`}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden relative">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={24} className="animate-spin text-[#D4AF37]" />
              </div>
            ) : activeProject ? (
              <ProjectDetailView
                project={activeProject}
                onBack={() => setActiveProject(null)}
                onUpdate={updateProject}
                currentUserId={currentUserId}
                authUser={authUser}
                isLightMode={isLightMode}
              />
            ) : (
              <div className="h-full overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
                {loading && (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={22} className="animate-spin text-[#D4AF37]" />
                  </div>
                )}
                {!loading && projects.length === 0 && (
                  <div className="text-center py-16">
                    <FolderOpen size={36} className="mx-auto mb-4 text-[#D4AF37]/30" />
                    <p className={`text-sm mb-1 ${isLightMode ? 'text-[#2D2B2A]' : 'text-white/30'}`}>No projects yet</p>
                    <p className={`text-xs ${isLightMode ? 'text-[#666259]' : 'text-white/20'}`}>Create one to get started</p>
                    <button onClick={() => setShowNewModal(true)}
                      className="mt-5 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold mx-auto transition-all"
                      style={{ background: '#D4AF37', color: '#002147' }}>
                      <Plus size={14} />New Project
                    </button>
                  </div>
                )}
                {!loading && projects.map(p => (
                  <ProjectCard key={p._id} project={p} onOpen={handleOpenProject}
                    onDelete={deleteProject} currentUserId={currentUserId} isLightMode={isLightMode} />
                ))}
              </div>
            )}

            {/* New Project Modal */}
            <AnimatePresence>
              {showNewModal && (
                <NewProjectModal onClose={() => setShowNewModal(false)} onCreate={createProject} isLightMode={isLightMode} />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

