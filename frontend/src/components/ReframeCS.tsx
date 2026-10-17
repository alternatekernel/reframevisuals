import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentBase';
import { useModal } from '../context/ModalContext';
import { ADMIN_NAV_ITEMS, CUSTOMER_NAV_ITEMS } from '../constants/navigation';
import { getApiEndpoint } from '../lib/apiConfig';
import OrderFlowUI from './order/OrderFlowUI';
import ChatThread from './reframe-cs/ChatThread';
import Composer, { type ComposerHandle } from './reframe-cs/Composer';
import Sidebar, { conversationTitle, type WidgetNavItem } from './reframe-cs/Sidebar';
import { AccountTab, ConversationChips, MessageActionsSheet, MobileTabs, PanelHeader } from './reframe-cs/PanelChrome';
import EmailCaptureModal from './reframe-cs/EmailCaptureModal';
import { useChatSession } from './reframe-cs/hooks/useChatSession';
import { useOrderDraft } from './reframe-cs/hooks/useOrderDraft';
import {
  useCompactViewport, useComposerDraft, useDictation, useLauncherPresence, useRotatingPhrase,
} from './reframe-cs/hooks/useWidgetUi';
import { CTA_PHRASES_DESKTOP, CTA_PHRASES_MOBILE, IN_WIDGET_TABS, STORAGE } from './reframe-cs/constants';
import { authHeaders, createId, hasPortalToken, readJson } from './reframe-cs/lib';
import type { ChatMessage, ReframeCsOpenDetail, SuggestedAction, WidgetTab, WidgetVariant } from './reframe-cs/types';

interface ReframeCSProps {
  variant?: WidgetVariant;
  defaultExpanded?: boolean;
  showLauncher?: boolean;
}

const useGuestId = () => {
  const [guestId, setGuestId] = useState(() => {
    const existing = localStorage.getItem(STORAGE.guestId);
    if (existing) return existing;
    const created = createId('guest');
    localStorage.setItem(STORAGE.guestId, created);
    return created;
  });

  useEffect(() => {
    const onLogout = () => {
      const next = createId('guest');
      localStorage.setItem(STORAGE.guestId, next);
      localStorage.setItem(STORAGE.identity, next);
      setGuestId(next);
    };
    window.addEventListener('portal-logout', onLogout);
    return () => window.removeEventListener('portal-logout', onLogout);
  }, []);

  return guestId;
};

const ReframeCSWidget = ({ variant = 'floating', defaultExpanded = false, showLauncher = true }: ReframeCSProps) => {
  const { currentUser } = useContent();
  const { showAlert, showConfirm } = useModal();
  const navigate = useNavigate();
  const location = useLocation();

  const isFloating = variant === 'floating';
  const guestId = useGuestId();
  const isAuthenticated = Boolean(currentUser);
  const isAdmin = !location.pathname.startsWith('/dashboard') && (currentUser as any)?.role === 'admin';
  const identity = currentUser?.id ? String(currentUser.id) : (hasPortalToken() ? null : guestId);

  const [isExpanded, setIsExpanded] = useState(!isFloating || defaultExpanded);
  const [requestedTab, setActiveTab] = useState<WidgetTab>('chats');
  const activeTab: WidgetTab = !isAuthenticated && IN_WIDGET_TABS.has(requestedTab) ? 'chats' : requestedTab;
  const [actionTarget, setActionTarget] = useState<ChatMessage | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => readJson(STORAGE.pinned, []));
  const [orderGlow, setOrderGlow] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [emailCaptureMode, setEmailCaptureMode] = useState<'pre-chat' | 'post-message'>('post-message');
  const emailCaptureShownRef = useRef(false);
  const emailCaptureTimerRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTargetRef = useRef<'chat' | 'order'>('chat');

  const viewport = useCompactViewport();
  const presence = useLauncherPresence(isFloating);
  const order = useOrderDraft(currentUser?.email);
  const session = useChatSession({
    guestId,
    identity,
    isGuest: !isAuthenticated,
    isOpenOnChat: isExpanded && activeTab === 'chats',
    notify: isFloating,
  });
  const [draft, setDraft] = useComposerDraft(session.conversationId);

  const dictation = useDictation(
    setDraft,
    useCallback((title: string, message: string) => showAlert({ title, message, variant: 'info' }), [showAlert]),
  );
  const rotating = useRotatingPhrase(
    viewport.isCompact ? CTA_PHRASES_MOBILE : CTA_PHRASES_DESKTOP,
    isExpanded || dictation.isListening || Boolean(draft.trim()) || Boolean(session.latestPreview),
  );

  const focusTimerRef = useRef<number | null>(null);
  const focusComposer = useCallback((delay = 250) => {
    if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
    focusTimerRef.current = window.setTimeout(() => {
      focusTimerRef.current = null;
      composerRef.current?.focus();
    }, delay);
  }, []);

  const collapse = useCallback(() => {
    if (!isFloating) return;
    // A focus still queued from opening would re-expand the widget through the input's onFocus.
    if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
    focusTimerRef.current = null;
    setIsExpanded(false);
    setActionTarget(null);
  }, [isFloating]);

  const openChat = useCallback((focus = !viewport.isCompact) => {
    setIsExpanded(true);
    setActiveTab('chats');
    if (focus) focusComposer();
  }, [focusComposer, viewport.isCompact]);

  const goTo = useCallback((path: string) => {
    if (/^https?:/.test(path)) window.open(path, '_blank', 'noopener');
    else navigate(path);
    collapse();
  }, [collapse, navigate]);

  // ── Order flow ────────────────────────────────────────────────
  const orderLabel = activeTab === 'orderFlow' ? 'Exit order' : order.isActive ? 'Resume order' : 'New order';

  const handleOrderAction = useCallback(() => {
    setIsExpanded(true);
    if (activeTab === 'orderFlow') {
      if (order.step === 'complete') order.finish();
      setActiveTab('chats');
      return;
    }
    if (!order.isActive) order.startFresh();
    setActiveTab('orderFlow');
  }, [activeTab, order]);

  const routeFilesToOrder = useCallback((files: File[]) => {
    order.addFiles(files);
    setIsExpanded(true);
    setActiveTab('orderFlow');
  }, [order]);

  const handleAttach = useCallback(() => {
    const input = fileInputRef.current;
    if (!input) return;
    const toChat = isExpanded && activeTab === 'chats';
    fileTargetRef.current = toChat ? 'chat' : 'order';
    input.accept = toChat ? 'image/*,.pdf,.doc,.docx,.txt,.zip' : 'image/*';
    input.click();
  }, [activeTab, isExpanded]);

  const handleFilesPicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (fileTargetRef.current === 'chat') session.uploadToChat(files);
    else routeFilesToOrder(files);
  };

  const handlePasteFiles = useCallback((files: File[]) => {
    if (isExpanded && activeTab === 'chats') session.uploadToChat(files);
    else routeFilesToOrder(files);
  }, [activeTab, isExpanded, routeFilesToOrder, session]);

  // ── Chat actions ──────────────────────────────────────────────
  const handleTextChange = useCallback((value: string) => {
    setDraft(value);
    session.notifyTyping(value);
  }, [session, setDraft]);

  const handleSend = useCallback(async () => {
    const value = draft;
    if (!value.trim()) return;
    setActiveTab('chats');
    setIsExpanded(true);
    setDraft('');
    const accepted = await session.sendMessage(value);
    if (!accepted) { setDraft(value); return; }
    if (!isAuthenticated && !session.contactCaptured) {
      // Cancel any pending pre-chat timer so we replace it with the post-message version
      if (emailCaptureTimerRef.current) {
        window.clearTimeout(emailCaptureTimerRef.current);
        emailCaptureTimerRef.current = null;
      }
      if (!emailCaptureShownRef.current) {
        emailCaptureShownRef.current = true;
        setEmailCaptureMode('post-message');
        emailCaptureTimerRef.current = window.setTimeout(() => setShowEmailCapture(true), 1500);
      }
    }
  }, [draft, isAuthenticated, session, setDraft]);

  const handleSuggestedAction = useCallback((action: SuggestedAction) => {
    if (action.url) goTo(action.url);
    else session.sendMessage(action.text);
  }, [goTo, session]);

  const handleEmailCaptured = useCallback(() => {
    session.markContactCaptured();
    setShowEmailCapture(false);
  }, [session]);

  const handleEmailDismissed = useCallback(() => {
    setShowEmailCapture(false);
  }, []);

  const startNewChat = useCallback(() => {
    session.startNewChat();
    openChat();
  }, [openChat, session]);

  const selectConversation = useCallback((id: string) => {
    setActiveTab('chats');
    session.loadConversation(id);
  }, [session]);

  const togglePin = useCallback((id: string) => {
    setPinnedIds(prev => {
      const next = prev.includes(id) ? prev.filter(pinned => pinned !== id) : [...prev, id];
      localStorage.setItem(STORAGE.pinned, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete conversation',
      message: 'This conversation will be removed for good.',
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    const deleted = await session.deleteConversation(id);
    if (!deleted) showAlert({ title: 'Could not delete', message: 'Try again in a moment.', variant: 'danger' });
  }, [session, showAlert, showConfirm]);

  // ── Navigation model ──────────────────────────────────────────
  const navItems: WidgetNavItem[] = useMemo(() => {
    const source = isAdmin ? ADMIN_NAV_ITEMS : isAuthenticated ? CUSTOMER_NAV_ITEMS : [];
    return source
      .filter(item => item.id !== 'chats' && item.id !== 'chat')
      .map(item => {
        const inWidget = !isAdmin && IN_WIDGET_TABS.has(item.id);
        return {
          id: item.id,
          label: item.label,
          icon: item.icon,
          active: inWidget && activeTab === item.id,
          onSelect: inWidget ? () => setActiveTab(item.id as WidgetTab) : () => goTo(item.path),
        };
      });
  }, [activeTab, goTo, isAdmin, isAuthenticated]);

  useEffect(() => {
    if (activeTab !== 'chats' || !order.isActive) {
      setOrderGlow(false);
      return;
    }
    setOrderGlow(true);
    const timer = window.setTimeout(() => setOrderGlow(false), 2600);
    return () => window.clearTimeout(timer);
  }, [activeTab, order.isActive]);

  useEffect(() => {
    if (isExpanded) session.refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  // ── Floating-launcher integrations ────────────────────────────
  useEffect(() => {
    if (!isFloating) return;
    window.dispatchEvent(new CustomEvent('reframe-cs:state', { detail: { open: isExpanded } }));
    if (isExpanded) document.body.setAttribute('data-reframe-cs-open', 'true');
    else document.body.removeAttribute('data-reframe-cs-open');
    return () => document.body.removeAttribute('data-reframe-cs-open');
  }, [isExpanded, isFloating]);

  useEffect(() => {
    if (!isFloating) return;
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<ReframeCsOpenDetail>).detail || {};
      const focus = detail.focus !== false;
      if (detail.mode === 'feedback-escalation') {
        const page = detail.pageTitle?.trim() || 'this page';
        const where = detail.pagePath?.trim() ? `${page} (${detail.pagePath.trim()})` : page;
        session.startNewChat({
          intro: `We're here to help. Share what happened and we'll route this to a human support teammate.\n\nContext: ${where}\nIssue type: ${detail.issueType?.trim() || 'general'}`,
          suggestedActions: ['Bug report', 'Feature request', 'General question'],
        });
        setDraft('');
      }
      if (detail.prompt) setDraft(detail.prompt);
      openChat(focus);
    };
    window.addEventListener('reframe-cs:open', onOpen);
    return () => window.removeEventListener('reframe-cs:open', onOpen);
  }, [isFloating, openChat, session, setDraft]);

  useEffect(() => {
    if (!isFloating || !isExpanded) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Element;
      if (containerRef.current?.contains(target) || target.closest?.('[data-modal-root]')) return;
      // An order in progress holds unsaved files; only an explicit action closes it.
      if (activeTab === 'orderFlow') return;
      collapse();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || actionTarget || document.querySelector('[data-modal-root]')) return;
      collapse();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [actionTarget, activeTab, collapse, isExpanded, isFloating]);

  useEffect(() => {
    if (!isFloating) return;
    const strip = (title: string) => title.replace(/^\(\d+\+?\)\s/, '');
    if (!session.unreadCount) {
      document.title = strip(document.title);
      return;
    }
    document.title = `(${session.unreadCount > 9 ? '9+' : session.unreadCount}) ${strip(document.title)}`;
    return () => { document.title = strip(document.title); };
  }, [isFloating, session.unreadCount]);

  useEffect(() => {
    const timer = emailCaptureTimerRef.current;
    return () => { if (timer) window.clearTimeout(timer); };
  }, []);

  // Flush a pre-chat email captured before any conversation existed
  useEffect(() => {
    if (!session.conversationId || isAuthenticated) return;
    const pending = sessionStorage.getItem('reframe_pending_email');
    if (!pending) return;
    sessionStorage.removeItem('reframe_pending_email');
    fetch(getApiEndpoint('/portal/chat/capture-email'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Guest-ID': guestId },
      body: JSON.stringify({ conversationId: session.conversationId, email: pending }),
    }).catch(() => {});
  }, [session.conversationId, guestId, isAuthenticated]);

  // Pre-chat lead capture — fires 5s after the floating widget first opens for a guest
  useEffect(() => {
    if (!isFloating || !isExpanded || isAuthenticated || session.contactCaptured || emailCaptureShownRef.current) return;
    const timer = window.setTimeout(() => {
      emailCaptureShownRef.current = true;
      setEmailCaptureMode('pre-chat');
      setShowEmailCapture(true);
    }, 5000);
    emailCaptureTimerRef.current = timer;
    return () => { window.clearTimeout(timer); emailCaptureTimerRef.current = null; };
  // isExpanded is the trigger; the rest are stable or checked via ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  useEffect(() => {
    if (!isFloating) return;
    const ping = () => fetch(getApiEndpoint('/portal/presence'), {
      method: 'POST',
      headers: authHeaders(guestId, true),
      body: JSON.stringify({ path: location.pathname }),
    }).catch(() => {});
    ping();
    const timer = window.setInterval(ping, 45000);
    return () => window.clearInterval(timer);
  }, [guestId, isFloating, location.pathname]);

  // ── Layout ────────────────────────────────────────────────────
  const { isCompact } = viewport;
  const fullscreen = isFloating && isCompact && isExpanded;
  const hidden = isFloating && (presence.showcaseInView || !presence.isVisible);
  const hasStartedChat = session.messages.some(message => message.role === 'user');
  const activeConversation = session.conversations.find(conversation => conversation.id === session.conversationId);
  const headerTitle = activeTab === 'chats'
    ? (activeConversation ? conversationTitle(activeConversation) : 'Chat')
    : activeTab === 'orderFlow' ? 'New order' : navItems.find(item => item.id === activeTab)?.label || '';
  const userName = currentUser?.name || (isAdmin ? 'Admin' : 'Visitor');

  const size = !isFloating
    ? { width: '100%', height: isCompact ? 620 : 624 }
    : isCompact
      ? { width: isExpanded ? '100vw' : 'calc(100vw - 24px)', height: isExpanded ? viewport.height : 64 }
      : { width: isExpanded ? 900 : 440, height: isExpanded ? 624 : 64 };

  const content = activeTab === 'chats' ? (
    <ChatThread
      session={session}
      guestId={guestId}
      onAction={handleSuggestedAction}
      onOpenActions={setActionTarget}
      onNavigate={collapse}
    />
  ) : activeTab === 'orderFlow' ? (
    <div className="h-full px-2 py-2 sm:px-5 sm:py-3">
      <OrderFlowUI
        orderFlowStep={order.step}
        setOrderFlowStep={order.setStep}
        orderData={order.order}
        setOrderData={order.setOrder}
        guestId={guestId}
        draftKey={STORAGE.orderDraft}
        onCancel={() => setActiveTab('chats')}
        completeLabel={isAuthenticated ? 'Track progress' : 'Back to chat'}
        onComplete={() => {
          order.finish();
          if (isAuthenticated) goTo('/dashboard');
          else setActiveTab('chats');
        }}
        onContactSupport={() => { order.finish(); openChat(); }}
      />
    </div>
  ) : (
    <AccountTab tab={activeTab as 'jobs' | 'orders' | 'gallery'} onStartOrder={handleOrderAction} onOpenPath={goTo} />
  );

  return (
    <motion.div
      ref={containerRef}
      role={isFloating ? 'dialog' : 'region'}
      aria-label="Reframe CS support chat"
      aria-modal={fullscreen || undefined}
      initial={false}
      animate={{
        ...size,
        x: isFloating ? '-50%' : 0,
        y: !isFloating ? 0 : presence.showcaseInView ? -360 : presence.isVisible ? 0 : 100,
        opacity: hidden ? 0 : 1,
        scale: !isFloating ? 1 : presence.showcaseInView ? 0.75 : presence.isVisible ? 1 : 0.92,
      }}
      transition={{ type: 'tween', duration: isCompact ? 0.3 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`${isFloating ? 'fixed z-[260]' : 'relative z-10 mx-auto'} border transition-[border-color,box-shadow] duration-500 ${
        isExpanded || !isFloating
          ? 'bg-white shadow-[0_24px_80px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.10)]'
          : 'bg-bg-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.94),0_2px_3px_rgba(0,0,0,0.10),0_12px_32px_rgba(0,0,0,0.10)]'
      } ${
        isFloating && presence.glow
          ? 'border-focus ring-4 ring-focus/20'
          : isFloating && !isExpanded
            ? 'border-black/[0.14] hover:border-focus hover:ring-4 hover:ring-focus/20'
            : 'border-black/[0.18]'
      }`}
      style={{
        left: isFloating ? '50%' : undefined,
        bottom: isFloating && !fullscreen ? (isCompact ? 12 : 16) : undefined,
        top: fullscreen ? viewport.offsetTop : undefined,
        borderRadius: fullscreen ? 0 : isCompact && isFloating ? 18 : 24,
        borderWidth: fullscreen ? 0 : 1,
        pointerEvents: hidden ? 'none' : 'auto',
      }}
    >
      {isFloating && !isExpanded && session.unreadCount > 0 && (
        <span
          className="absolute -right-2 -top-2 z-[120] flex h-6 min-w-6 animate-pulse items-center justify-center rounded-full bg-semantic-error px-1.5 text-12 font-black text-white shadow-lg ring-4 ring-white"
          aria-label={`${session.unreadCount} unread ${session.unreadCount === 1 ? 'reply' : 'replies'}`}
        >
          {session.unreadCount > 9 ? '9+' : session.unreadCount}
        </span>
      )}

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesPicked} />

      <div data-lenis-prevent className="relative flex h-full w-full overflow-hidden rounded-[inherit]">
        <AnimatePresence initial={false}>
          {isExpanded && !isCompact && (
            <Sidebar
              key="sidebar"
              orderLabel={orderLabel}
              orderGlow={orderGlow}
              onOrderAction={handleOrderAction}
              navItems={navItems}
              conversations={session.conversations}
              conversationsLoading={session.conversationsLoading}
              activeConversationId={session.conversationId}
              isChatTab={activeTab === 'chats'}
              pinnedIds={pinnedIds}
              onSelectConversation={selectConversation}
              onNewChat={startNewChat}
              onTogglePin={togglePin}
              onDeleteConversation={deleteConversation}
              userName={userName}
              userLabel={isAdmin ? 'Admin access' : isAuthenticated ? 'Customer' : 'Visitor'}
              isAuthenticated={isAuthenticated}
              onAccount={() => goTo(isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/login')}
            />
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col justify-end">
          {isExpanded && (
            <>
              <PanelHeader
                title={headerTitle}
                showIntro={activeTab === 'chats' && !hasStartedChat}
                introTitle={isAdmin ? 'Assistance' : 'Human support'}
                showSignUp={!isAuthenticated && activeTab === 'chats'}
                showCollapse={isFloating && showLauncher}
                showDashboard={isAuthenticated}
                onSignUp={() => goTo('/signup')}
                onCollapse={collapse}
                onDashboard={() => goTo(isAdmin ? '/admin' : '/dashboard')}
              />
              {isCompact && (
                <MobileTabs
                  orderLabel={orderLabel}
                  orderActive={activeTab === 'orderFlow'}
                  orderHighlighted={order.isActive}
                  onOrderAction={handleOrderAction}
                  chatActive={activeTab === 'chats'}
                  onChats={() => setActiveTab('chats')}
                  navItems={navItems}
                />
              )}
              {isCompact && activeTab === 'chats' && (
                <ConversationChips
                  conversations={session.conversations}
                  activeId={session.conversationId}
                  pinnedIds={pinnedIds}
                  onSelect={selectConversation}
                  onNewChat={startNewChat}
                />
              )}
              <main className="relative min-h-0 flex-1">{content}</main>
            </>
          )}

          {(!isExpanded || activeTab !== 'orderFlow') && (
            <Composer
              ref={composerRef}
              isExpanded={isExpanded}
              text={draft}
              onTextChange={handleTextChange}
              onSend={handleSend}
              onExpand={() => openChat(true)}
              onAttach={handleAttach}
              onPasteFiles={handlePasteFiles}
              isSending={session.isSending}
              isListening={dictation.isListening}
              onToggleDictation={dictation.toggle}
              idlePhrase={rotating.phrase}
              idlePhraseVisible={rotating.visible}
              replyPreview={isExpanded ? '' : session.latestPreview}
              attachLabel={isExpanded && activeTab === 'chats' ? 'Attach' : 'Upload Images'}
            />
          )}
        </div>

        {actionTarget && (
          <MessageActionsSheet
            message={actionTarget}
            onClose={() => setActionTarget(null)}
            onCopy={async () => {
              await navigator.clipboard?.writeText(actionTarget.content || '').catch(() => {});
              setActionTarget(null);
            }}
            onEdit={() => {
              setDraft(actionTarget.content || '');
              setActionTarget(null);
              focusComposer(0);
            }}
            onResend={() => {
              session.sendMessage(actionTarget.content || '');
              setActionTarget(null);
            }}
          />
        )}

        <AnimatePresence>
          {showEmailCapture && (
            <EmailCaptureModal
              key="email-capture"
              conversationId={session.conversationId}
              guestId={guestId}
              mode={emailCaptureMode}
              onCaptured={handleEmailCaptured}
              onDismiss={handleEmailDismissed}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const ReframeCS = (props: ReframeCSProps) => {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <ReframeCSWidget {...props} />;
};

export default ReframeCS;
