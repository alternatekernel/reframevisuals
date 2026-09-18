import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Paperclip, AudioLines, ArrowUp, Zap, MoreHorizontal, Phone, Palette, AlertCircle, X, Copy, RefreshCw, Pencil } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useSharedChatController } from '../../hooks/useSharedChatController';
import MessageBubble, { DateSeparator } from '../chat/MessageBubble';
import QuickReplies from '../chat/QuickReplies';
import { useModal } from '../../context/ModalContext';
import { clearDraft, loadDraft, resolveSlashCommand, saveDraft } from '../../utils/chatSmart';
import { portalApi } from '../../services/portalApi';
import { dashboardChatBodyTextClass, dashboardChatComposerClass, dashboardChatIconButtonClass, dashboardChatMenuClass, dashboardChatMenuItemClass, dashboardChatMutedTextClass, dashboardChatSecondaryPillClass } from './dashboard-primitives';

const SAME_MINUTE_MS = 60 * 1000;
type PendingAttachment = {
  file: File;
  id: string;
  progress: number;
  uploaded?: { url: string; filename: string; size?: number; type?: string; path?: string; folderPath?: string };
};

const ChatView = () => {
  const { activeConversation, conversations, selectConversation, sendMessage, isSending, supportTyping, error, clearError, isChatBootstrapping, isConversationDetailLoading, conversationDetailError } = useDashboard();
  const { showAlert } = useModal();
  const [query, setQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showTyping, setShowTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [messageActionTarget, setMessageActionTarget] = useState<any | null>(null);
  const [actionMenuPos, setActionMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [lastSentMessage, setLastSentMessage] = useState('');
  const [supportMenuOpen, setSupportMenuOpen] = useState(false);
  const [supportAvailabilityLabel, setSupportAvailabilityLabel] = useState('Agent availability unavailable');
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const previousMessageCountRef = useRef(0);
  const { sendConversationMessage } = useSharedChatController();

  useEffect(() => {
    let mounted = true;
    const loadSupportAvailability = async () => {
      try {
        const res = await portalApi.getSupportAvailability();
        const count = Number(res.data?.data?.availableAgents);
        if (!mounted) return;
        if (Number.isFinite(count)) {
          setSupportAvailabilityLabel(`Human agents available: ${count}`);
        } else {
          setSupportAvailabilityLabel('Agent availability unavailable');
        }
      } catch {
        if (mounted) setSupportAvailabilityLabel('Agent availability unavailable');
      }
    };
    loadSupportAvailability();
    const interval = setInterval(loadSupportAvailability, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const openMessageActions = (msg: any, rect?: DOMRect) => {
    setMessageActionTarget(msg);
    if (!rect) return;
    const menuWidth = 260;
    const menuHeight = 148;
    const gap = 8;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    let left = msg.role === 'user' ? rect.right - menuWidth : rect.left;
    left = Math.max(12, Math.min(left, viewportW - menuWidth - 12));
    let top = rect.bottom + gap;
    if (top + menuHeight > viewportH - 12) top = rect.top - menuHeight - gap;
    top = Math.max(12, Math.min(top, viewportH - menuHeight - 12));
    setActionMenuPos({ top, left });
  };

  useEffect(() => {
    if (!activeConversation?.id) return;
    setQuery(loadDraft(activeConversation.id));
  }, [activeConversation?.id]);

  useEffect(() => {
    if (!activeConversation?.id) return;
    saveDraft(activeConversation.id, query);
  }, [query, activeConversation?.id]);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    });
  }, []);

  useEffect(() => {
    const messages = activeConversation?.messages || [];
    const currentCount = messages.length;
    const hadNewMessage = currentCount > previousMessageCountRef.current;
    previousMessageCountRef.current = currentCount;
    if (!hadNewMessage) return;
    if (isNearBottom) {
      setShowJumpToLatest(false);
      scrollToBottom('smooth');
    } else {
      setShowJumpToLatest(true);
    }
  }, [activeConversation?.messages, isNearBottom, scrollToBottom]);

  useEffect(() => {
    if (!messageScrollRef.current) return;
    const container = messageScrollRef.current;
    const threshold = 120;
    const onScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const nearBottom = distanceFromBottom <= threshold;
      setIsNearBottom(nearBottom);
      if (nearBottom) setShowJumpToLatest(false);
    };
    onScroll();
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Parity typing indicator behavior with short tail to avoid abrupt flicker.
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isSending) {
      setShowTyping(true);
    } else {
      typingTimeoutRef.current = setTimeout(() => {
        setShowTyping(false);
        typingTimeoutRef.current = null;
      }, 500);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [isSending]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, []);

  const uploadAttachment = async (item: PendingAttachment): Promise<PendingAttachment['uploaded'] | null> => {
    try {
      const token = localStorage.getItem('portal_token');
      const guestId = localStorage.getItem('portal_guest_id') || '';
      const headers: Record<string, string> = { 'X-Guest-ID': guestId };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
      const formData = new FormData();
      formData.append('file', item.file);
      setAttachments((prev) => prev.map((p) => p.id === item.id ? { ...p, progress: 30 } : p));
      const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
      const response = await fetch(`${API_BASE_URL}/portal/upload`, { method: 'POST', headers, body: formData, credentials: 'include' });
      setAttachments((prev) => prev.map((p) => p.id === item.id ? { ...p, progress: 80 } : p));
      const result = await response.json();
      if (!result.success) return null;
      const uploaded = {
        url: result.data.url,
        filename: item.file.name,
        size: item.file.size,
        type: item.file.type,
        path: result.data.path,
        folderPath: result.data.folderPath
      };
      setAttachments((prev) => prev.map((p) => p.id === item.id ? { ...p, progress: 100, uploaded } : p));
      return uploaded;
    } catch {
      return null;
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!query.trim() && attachments.length === 0) || isSending) return;

    const messageContent = query.trim();
    const slash = resolveSlashCommand(messageContent);
    const finalContent = slash ? slash.message : messageContent || (attachments.length ? `[Attached ${attachments.length} file(s)]` : '');
    const uploadedAttachments: any[] = [];
    for (const item of attachments) {
      const uploaded = item.uploaded || await uploadAttachment(item);
      if (uploaded) uploadedAttachments.push(uploaded);
    }
    setQuery('');
    if (activeConversation?.id) clearDraft(activeConversation.id);
    if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
    sendTypingSignal('');
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = '';
    if (uploadedAttachments.length > 0) {
      await sendConversationMessage({
        content: finalContent,
        conversationId: activeConversation?.id,
        attachments: uploadedAttachments
      });
    } else {
      await sendMessage(finalContent);
    }
    setLastSentMessage(finalContent);
    setAttachments([]);
  };

  const handleQuickReply = async (text: string) => {
    if (isSending) return;
    // Send directly — don't flash the input
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'ArrowUp' && !query.trim() && lastSentMessage) {
      e.preventDefault();
      setQuery(lastSentMessage);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendTypingSignal = useCallback((value: string) => {
    const convId = activeConversation?.id;
    if (!convId) return;
    const token = localStorage.getItem('portal_token');
    const API_BASE = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
    fetch(`${API_BASE}/portal/conversations/${convId}/typing`, {
      method: 'POST', headers,
      body: JSON.stringify({ isTyping: value.trim().length > 0 })
    }).catch(() => {});
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`${API_BASE}/portal/conversations/${convId}/typing`, {
        method: 'POST', headers,
        body: JSON.stringify({ isTyping: false })
      }).catch(() => {});
    }, 2500);
  }, [activeConversation?.id]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      showAlert({
        title: 'Voice typing unavailable',
        message: 'Your browser does not support speech recognition.',
        variant: 'warning'
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (!transcript) return;
      setQuery((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
      setTimeout(() => adjustTextareaHeight(), 0);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    setIsListening(true);
    recognition.start();
  }, [adjustTextareaHeight, isListening, showAlert]);

  const handleEscalate = async () => {
    if (!activeConversation?.id || isSending) return;
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
      const response = await fetch(`${API_BASE_URL}/portal/chat/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId: activeConversation.id })
      });
      
      if (response.ok) {
        showAlert({
          title: 'Request Sent',
          message: 'Request sent! A human agent will contact you shortly.',
          variant: 'success'
        });
      }
    } catch (err) {
      console.error('Escalation failed:', err);
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (!activeConversation?.messages) return [];
    
    const groups: { date: string; messages: typeof activeConversation.messages }[] = [];
    let currentDate = '';
    
    activeConversation.messages.forEach((msg) => {
      if (!msg) return;
      const safeCreatedAt = msg.createdAt || new Date().toISOString();
      const msgDate = new Date(safeCreatedAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: safeCreatedAt, messages: [{ ...msg, createdAt: safeCreatedAt }] });
      } else {
        groups[groups.length - 1].messages.push({ ...msg, createdAt: safeCreatedAt });
      }
    });
    
    return groups;
  }, [activeConversation?.messages]);

  const renderErrorToast = () => {
    if (!error) return null;
    return (
      <div className="chat-error-toast">
        <div className="flex items-center gap-2 px-4 py-2.5 mx-8 mb-2 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700 animate-fadeSlideUp">
          <AlertCircle size={14} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="p-0.5 hover:bg-red-100 rounded transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>
    );
  };

  const renderInputArea = () => (
    <div className="shrink-0 px-4 pb-3 sm:px-6 lg:px-8 lg:pb-4">
      <form 
        onSubmit={handleSend}
        className={dashboardChatComposerClass}
      >
        <div className="px-4 py-1">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((a) => {
                const isImage = a.file.type.startsWith('image/');
                return (
                  <div key={a.id} className="rounded-lg border border-black/10 overflow-hidden bg-black/[0.02]">
                    {isImage ? (
                      <div className="relative group/att">
                        <img
                          src={URL.createObjectURL(a.file)}
                          alt={a.file.name}
                          className="h-16 w-20 object-cover"
                        />
                        <button
                          type="button"
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none opacity-0 group-hover/att:opacity-100 transition-opacity"
                          onClick={() => setAttachments((prev) => prev.filter((p) => p.id !== a.id))}
                        >×</button>
                        {a.progress < 100 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                            <div className="h-1 bg-white" style={{ width: `${a.progress}%` }} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="px-2 py-1 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="max-w-[170px] truncate">{a.file.name}</span>
                          <button type="button" className={`${dashboardChatMutedTextClass} hover:text-text-primary`} onClick={() => setAttachments((prev) => prev.filter((p) => p.id !== a.id))}>×</button>
                        </div>
                        <div className="h-1 mt-1 bg-black/10 rounded">
                          <div className="h-1 bg-black rounded" style={{ width: `${a.progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <textarea 
            ref={textareaRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              adjustTextareaHeight();
              sendTypingSignal(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="w-full bg-transparent border-none outline-none text-[14px] py-1.5 resize-none leading-relaxed max-h-[150px]"
            disabled={isSending}
          />
        </div>
        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                const next = files.map((file) => ({ file, id: `${Date.now()}-${file.name}-${Math.random()}`, progress: 0 }));
                setAttachments((prev) => [...prev, ...next]);
              }}
            />
            <button type="button" className={dashboardChatIconButtonClass} onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={18} />
            </button>
            <button
              type="button"
              className={isListening ? 'rounded-full p-2.5 bg-red-50 text-red-600 ring-1 ring-red-200 transition-colors' : dashboardChatIconButtonClass}
              onClick={toggleListening}
              aria-label="Voice typing (dictation)"
              title={isListening ? 'Listening… click to stop dictation' : 'Voice typing (dictation)'}
            >
              <AudioLines size={18} className={isListening ? 'animate-pulse' : ''} />
            </button>
          </div>
          <button 
            type="submit"
            disabled={(!query.trim() && attachments.length === 0) || isSending}
            className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </form>
      <div className={`text-center mt-3 text-[11px] ${dashboardChatMutedTextClass} max-w-4xl mx-auto`}>
        This chat is monitored by human agents and admins. For urgent help, use Connect to Human Agent.
      </div>
    </div>
  );

  useEffect(() => {
    const dismiss = () => {
      setMessageActionTarget(null);
      setActionMenuPos(null);
    };
    if (!messageActionTarget) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    const onScroll = () => dismiss();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [messageActionTarget]);

  if (isChatBootstrapping || isConversationDetailLoading) {
    return (
      <div className="flex h-[calc(100dvh-56px)] items-center justify-center bg-white lg:h-screen">
        <div className={`text-[13px] ${dashboardChatBodyTextClass}`}>Loading chat...</div>
      </div>
    );
  }

  if (conversationDetailError && activeConversation?.id) {
    return (
      <div className="flex h-[calc(100dvh-56px)] flex-col items-center justify-center bg-white lg:h-screen gap-3">
        <p className="text-[13px] text-red-600">{conversationDetailError}</p>
        <button onClick={() => selectConversation(activeConversation.id)} className={`${dashboardChatSecondaryPillClass} px-3 py-1.5 text-[12px]`}>
          Retry
        </button>
      </div>
    );
  }

  if (!activeConversation && conversations.length === 0) {
    return (
      <div className="flex h-[calc(100dvh-56px)] flex-col bg-white lg:h-screen">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-black/[0.03] rounded-3xl flex items-center justify-center mb-6 animate-fadeIn">
            <Zap size={32} className="text-black/20" />
          </div>
          <h2 className="text-[24px] font-bold text-black mb-2 animate-fadeIn" style={{ animationDelay: '80ms' }}>Reframe CS</h2>
          <p className={`text-[15px] ${dashboardChatBodyTextClass} max-w-md mb-6 animate-fadeIn`} style={{ animationDelay: '150ms' }}>
            Ask about pricing, services, project setup, or delivery status.
          </p>
          
          {/* Quick Start Options */}
          <div className="flex flex-wrap gap-3 justify-center animate-fadeIn" style={{ animationDelay: '220ms' }}>
            <button
              onClick={() => handleQuickReply('I want to place an order')}
              className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-black/80 transition-all active:scale-[0.97]"
            >
              Place an Order
            </button>
            <button
              onClick={() => handleQuickReply('Show me your pricing')}
              className={dashboardChatSecondaryPillClass}
            >
              View Pricing
            </button>
            <button
              onClick={() => handleQuickReply('Tell me about your services')}
              className={dashboardChatSecondaryPillClass}
            >
              Explore Services
            </button>
          </div>
        </div>
        {renderInputArea()}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-56px)] bg-white lg:h-screen">
      <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/5 px-4 py-3 sm:px-6 lg:px-8 lg:py-5">
        <div className="flex items-center gap-3">
          <div className="hidden h-10 w-10 rounded-full bg-[#171717] items-center justify-center sm:flex">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-black">Reframe CS</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className={`text-[12px] font-medium ${dashboardChatMutedTextClass}`}>Online</span>
              <span className="w-1 h-1 rounded-full bg-[#E5E5E5]" />
              <span className="hidden text-[11px] font-semibold text-text-primary bg-bg-secondary px-2 py-0.5 rounded-full sm:flex items-center gap-1">
                <Palette size={10} />
                {supportAvailabilityLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleEscalate}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-full transition-all"
          >
            <Phone size={14} />
            <span className="hidden sm:inline">Connect to Human Agent (Urgent)</span>
          </button>
          <button
            onClick={() => setSupportMenuOpen((v) => !v)}
            className={dashboardChatIconButtonClass}
          >
            <MoreHorizontal size={20} />
          </button>
          {supportMenuOpen && (
            <div className={dashboardChatMenuClass}>
              {[
                { label: 'Connect to Human Agent', action: () => handleQuickReply('Connect me to a human agent urgently') },
                { label: 'Request Callback', action: () => handleQuickReply('Please request a callback from support') },
                { label: 'Escalation Priority', action: () => handleQuickReply('Mark this conversation as escalation priority') },
                { label: 'Attach Order Context', action: () => handleQuickReply('Include my current order context in this chat') },
              ].map((item) => (
                <button
                  key={item.label}
                  className={dashboardChatMenuItemClass}
                  onClick={async () => {
                    await item.action();
                    setSupportMenuOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messageScrollRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 space-y-2 scrollbar-hide">
        {/* Welcome message if first interaction */}
        {activeConversation.messages?.length === 0 && (
          <div className="flex justify-start mb-4 animate-fadeSlideUp">
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-[#171717] flex items-center justify-center shrink-0">
                <Zap size={16} className="text-white" />
              </div>
              <div className="max-w-[92%] bg-black/[0.03] border border-black/5 px-4 py-4 sm:max-w-[78%] lg:max-w-[70%] sm:px-6 sm:py-5 rounded-[24px] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[15px] font-semibold text-text-primary">Hi! I'm Reframe CS</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">AI</span>
                </div>
                <p className={`text-[14px] ${dashboardChatBodyTextClass} mb-3`}>
                  Your AI assistant for professional image editing services.
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[13px] text-[#444]">
                    <span className="text-text-primary font-medium">💰</span>
                    <span>Get instant pricing for any service</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[#444]">
                    <span className="text-text-primary font-medium">📦</span>
                    <span>Place orders</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[#444]">
                    <span className="text-text-primary font-medium">🎨</span>
                    <span>Learn about our 19+ services</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[#444]">
                    <span className="text-text-primary font-medium">📊</span>
                    <span>Track your orders in real-time</span>
                  </div>
                </div>
                <p className={`mt-3 text-[13px] ${dashboardChatMutedTextClass} border-t border-black/10 pt-3`}>
                  How can I help you today?
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grouped messages by date */}
        {groupedMessages.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            <DateSeparator date={group.date} />
            {group.messages.filter(Boolean).map((msg, msgIndex) => {
              // Show avatar for the first message of a role in a consecutive run
              const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
              const nextMsg = group.messages[msgIndex + 1] || null;
              const showAvatar = 
                (msg.role === 'assistant' && (!prevMsg || prevMsg.role !== 'assistant')) ||
                (msg.role === 'user' && (!prevMsg || prevMsg.role !== 'user'));
              const sameMinuteAsNext = Boolean(
                nextMsg &&
                nextMsg.role === msg.role &&
                Math.abs(new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime()) < SAME_MINUTE_MS
              );
              
              return (
                <div
                  key={msg.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const bubble = (e.currentTarget as HTMLElement).querySelector('[data-msg-bubble]') as HTMLElement | null;
                    openMessageActions(msg, bubble?.getBoundingClientRect());
                  }}
                  onTouchStart={(e) => {
                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                    const bubble = (e.currentTarget as HTMLElement).querySelector('[data-msg-bubble]') as HTMLElement | null;
                    const rect = bubble?.getBoundingClientRect();
                    longPressTimerRef.current = setTimeout(() => {
                      openMessageActions(msg, rect || undefined);
                    }, 520);
                  }}
                  onTouchEnd={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                  onTouchMove={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                  onTouchCancel={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                >
                  <MessageBubble
                    message={msg}
                    showAvatar={showAvatar}
                    showMetadata={!sameMinuteAsNext}
                  />
                </div>
              );
            })}
          </React.Fragment>
        ))}
        
        {/* AI processing indicator */}
        <div className={`transition-all duration-300 overflow-hidden ${showTyping ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-[#171717] flex items-center justify-center shrink-0">
                <Zap size={16} className="text-white animate-pulse" />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 px-5 py-4 rounded-[24px] bg-black/[0.03] min-w-[100px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#171717]/30 animate-typingDot1" />
                    <div className="w-2 h-2 rounded-full bg-[#171717]/30 animate-typingDot2" />
                    <div className="w-2 h-2 rounded-full bg-[#171717]/30 animate-typingDot3" />
                  </div>
                </div>
                <span className={`text-[11px] ${dashboardChatMutedTextClass} mt-1.5 ml-1`}>Reframe CS is thinking...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Human support typing indicator */}
        <div className={`transition-all duration-300 overflow-hidden ${supportTyping && !isSending ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-bold">S</span>
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 px-5 py-4 rounded-[24px] bg-blue-50 border border-blue-100 min-w-[100px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-typingDot1" />
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-typingDot2" />
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-typingDot3" />
                  </div>
                </div>
                <span className={`text-[11px] ${dashboardChatMutedTextClass} mt-1.5 ml-1`}>Support is typing...</span>
              </div>
            </div>
          </div>
        </div>
        <div ref={messagesEndRef} />
        {showJumpToLatest && (
          <div className="sticky bottom-3 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setShowJumpToLatest(false);
                scrollToBottom('smooth');
              }}
              className={`${dashboardChatSecondaryPillClass} px-3 py-1.5 text-[12px] shadow-sm`}
            >
              New messages
            </button>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {renderErrorToast()}

      {/* Quick Replies */}
      <QuickReplies onQuickReply={handleQuickReply} disabled={isSending} />

      {/* Input Area */}
      {renderInputArea()}
      {messageActionTarget && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={() => { setMessageActionTarget(null); setActionMenuPos(null); }}>
          <div
            className="absolute w-[260px] rounded-2xl border border-borderSubtle bg-white p-2 shadow-2xl"
            style={actionMenuPos ? { top: actionMenuPos.top, left: actionMenuPos.left } : { bottom: 24, left: '50%', transform: 'translateX(-50%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={`${dashboardChatMenuItemClass} flex items-center gap-2 font-semibold`}
              onClick={async () => {
                await navigator.clipboard.writeText(messageActionTarget.content || '');
                setMessageActionTarget(null);
              }}
            >
              <Copy size={14} /> Copy
            </button>
            <button
              className={`${dashboardChatMenuItemClass} flex items-center gap-2 font-semibold`}
              onClick={() => {
                setQuery(messageActionTarget.content || '');
                setMessageActionTarget(null);
              }}
            >
              <Pencil size={14} /> Edit and resend
            </button>
            <button
              className={`${dashboardChatMenuItemClass} flex items-center gap-2 font-semibold`}
              onClick={async () => {
                const text = messageActionTarget.content || '';
                if (text.trim()) {
                  await sendMessage(text);
                  setLastSentMessage(text);
                }
                setMessageActionTarget(null);
              }}
            >
              <RefreshCw size={14} /> Regenerate
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ChatView;
