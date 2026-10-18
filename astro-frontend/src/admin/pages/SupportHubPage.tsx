import React, { useState, useEffect } from 'react';
import { adminFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ToastContext';

interface Message {
  id: string;
  from: string;
  email: string;
  time: string;
  subject: string;
  preview: string;
  tags: string[];
  unread: boolean;
  av: string;
  body: string;
  showAction: boolean;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  replies: Reply[];
}

interface Reply {
  id: string;
  from: 'me' | 'customer';
  text: string;
  time: string;
}

const getBadgeClass = (tag: string) => {
  const map: Record<string, string> = {
    Urgent: 'an-badge-orange',
    Client: 'an-badge-blue',
    New: 'an-badge-purple',
    Revision: 'an-badge-gray',
    High: 'an-badge-red',
    Medium: 'an-badge-yellow',
    Low: 'an-badge-gray',
  };
  return map[tag] || 'an-badge-gray';
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open': return 'an-badge-blue';
    case 'in_progress': return 'an-badge-orange';
    case 'resolved': return 'an-badge-green';
    case 'closed': return 'an-badge-gray';
    default: return 'an-badge-gray';
  }
};

const getTimeAgo = (dateString?: string) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getGmailSearchLink = (email?: string, subject?: string) => {
  const queryParts = [
    email ? `from:${email}` : '',
    subject ? `subject:"${subject}"` : '',
  ].filter(Boolean);
  const query = encodeURIComponent(queryParts.join(' '));
  return `https://mail.google.com/mail/u/0/#search/${query}`;
};

// Admin-authored reply templates

const emailTemplates = [
  { name: 'Quote Follow-up', text: 'Hi,\n\nThank you for your interest in our services. I\'ve attached a custom quote for your project.\n\nBest regards,\nReframe Team' },
  { name: 'Order Complete', text: 'Hi,\n\nYour order is complete! All images have been delivered to your email.\n\nBest regards,\nReframe Team' },
  { name: 'Revision Request', text: 'Hi,\n\nI\'ve reviewed the images and would like to request the following revisions:\n\n[Add your notes here]\n\nThanks!' },
  { name: 'Pricing Info', text: 'Hi,\n\nOur pricing starts at $0.19/image for standard retouching. Volume discounts are available for orders over 500 images.\n\nBest regards,\nReframe Team' },
];

export const SupportHubPage: React.FC = () => {
  const nav = useNavigate();
  const { showToast } = useToast();
  
  // State for messages - this persists changes
  const [messages, setMessages] = useState<Message[]>([]);
  const [active, setActive] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [replyText, setReplyText] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', message: '' });
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Fetch real tickets from API; never fall back to demo data.
  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    setLoadError('');
    try {
      const data = await adminFetch('/support/tickets');
      
      if (Array.isArray(data.tickets)) {
        const mapped: Message[] = data.tickets.map((t: any) => ({
          id: t.id,
          from: t.customer?.companyName || t.customer?.name || 'Unknown Client',
          email: t.customer?.contactEmail || t.customer?.email || '',
          time: getTimeAgo(t.createdAt),
          subject: t.subject || 'No Subject',
          preview: String(t.message || '').slice(0, 80) + (String(t.message || '').length > 80 ? '...' : ''),
          tags: [t.status === 'open' ? 'New' : '', t.priority === 'high' ? 'Urgent' : ''].filter(Boolean),
          unread: t.status === 'open',
          av: (t.customer?.companyName || t.customer?.name || t.customer?.contactEmail || 'U').slice(0, 2).toUpperCase(),
          body: t.message,
          showAction: t.status === 'open',
          status: t.status,
          priority: t.priority || 'medium',
          replies: (t.messages || []).slice(1).map((m: any) => ({
            id: m.id,
            from: m.senderRole === 'admin' ? 'me' : 'customer',
            text: m.content,
            time: getTimeAgo(m.createdAt)
          }))
        }));
        setMessages(mapped);
        if (mapped.length > 0 && !active) setActive(mapped[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      const message = error instanceof Error ? error.message : 'Failed to load support tickets';
      setLoadError(message);
      showToast('Error', message, 'error');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get current active message
  const msg = messages.find(m => m.id === active) || null;

  // Filter messages based on active tab
  const filteredMessages = activeTab === 'Unread' 
    ? messages.filter(m => m.unread)
    : activeTab === 'Open'
    ? messages.filter(m => m.status === 'open' || m.status === 'in_progress')
    : activeTab === 'Resolved'
    ? messages.filter(m => m.status === 'resolved' || m.status === 'closed')
    : messages;

  // Update message status - ACTUALLY UPDATES STATE & BACKEND
  const handleStatusUpdate = async (ticketId: string, newStatus: Message['status']) => {
    try {
      await adminFetch(`/support/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      
      setMessages(prev => prev.map(m => 
        m.id === ticketId ? { ...m, status: newStatus } : m
      ));
      showToast('Ticket Updated', `Status changed to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      showToast('Error', 'Failed to update status', 'error');
    }
  };

  // Send reply - ACTUALLY ADDS REPLY TO MESSAGE & BACKEND
  const handleSendReply = async () => {
    if (!replyText.trim() || !active) {
      showToast('Error', 'Please enter a reply message', 'error');
      return;
    }
    
    try {
      const data = await adminFetch(`/support/tickets/${active}/reply`, {
        method: 'POST',
        body: JSON.stringify({ 
          content: replyText,
          senderRole: 'admin'
        })
      });

      if (data.reply) {
        const newReply: Reply = {
          id: data.reply.id,
          from: 'me',
          text: replyText,
          time: 'Just now',
        };

        setMessages(prev => prev.map(m => 
          m.id === active 
            ? { 
                ...m, 
                replies: [...m.replies, newReply],
                status: m.status === 'open' ? 'in_progress' : m.status 
              } 
            : m
        ));
        
        showToast('Reply Sent', 'Your response has been sent', 'success');
        setReplyText('');
      }
    } catch (error) {
      console.error('Failed to send ticket reply:', error);
      showToast('Error', 'Failed to send reply', 'error');
    }
  };

  // Select message - marks as read
  const handleSelectMessage = (messageId: string) => {
    setActive(messageId);
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, unread: false } : m
    ));
  };

  // Mark all as read - ACTUALLY UPDATES STATE
  const handleMarkAllRead = () => {
    setMessages(prev => prev.map(m => ({ ...m, unread: false })));
    showToast('Mark All Read', 'All messages marked as read', 'success');
  };

  // Handle new ticket
  const handleNewTicket = () => {
    setShowCompose(true);
  };

  // Attachments are not wired to the support ticket API yet. Do not show fake success.
  const handleAttachment = () => {
    showToast('Attachment unavailable', 'Support ticket attachments are not connected yet. Use email or chat uploads for files.', 'info');
  };

  // Handle send template reply
  const handleTemplateSelect = (text: string) => {
    setReplyText(text);
    setShowTemplates(false);
    showToast('Template Applied', 'Template loaded into reply', 'info');
  };

  // Handle compose submit
  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeData.to || !composeData.subject || !composeData.message) {
      showToast('Error', 'Please fill in all fields', 'error');
      return;
    }

    try {
      const data = await adminFetch('/support/emails', {
        method: 'POST',
        body: JSON.stringify({
          to: composeData.to,
          subject: composeData.subject,
          body: composeData.message,
        }),
      });

      showToast('Message Sent', 'Your email was sent and saved to Support Hub.', 'success');
      setShowCompose(false);
      setComposeData({ to: '', subject: '', message: '' });
      await fetchTickets();
      if (data?.ticket?.id) setActive(data.ticket.id);
    } catch (error) {
      showToast('Error', error instanceof Error ? error.message : 'Failed to send message', 'error');
    }
  };

  return (
    <div className="an-support-page">
      {/* Header */}
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </span>
          Support Hub
        </div>
        <div className="an-page-desc">
          {messages.filter(m => m.unread).length} active requests · {messages.length} total tickets
        </div>
        <div className="an-page-actions">
          <div className="an-tabs-pill">
            {['All', 'Unread', 'Open', 'Resolved', 'Live Chat'].map(t => (
              <button 
                key={t} 
                className={`an-tab-pill${activeTab === t ? ' active' : ''}`} 
                onClick={() => setActiveTab(t)}
              >
                {t}
                {t === 'All' && <span style={{ fontSize: 11, color: 'var(--an-text3)', marginLeft: 4 }}>{messages.length}</span>}
                {t === 'Unread' && <span style={{ fontSize: 11, color: 'var(--an-orange-text)', marginLeft: 4 }}>{messages.filter(m => m.unread).length}</span>}
                {t === 'Live Chat' && <span className="an-pulse-dot" style={{ marginLeft: 6 }} />}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={handleMarkAllRead}>Mark all read</button>
          <button className="an-btn an-btn-primary an-btn-sm" onClick={handleNewTicket}>+ New Ticket</button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'Live Chat' ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="an-page-title" style={{ justifyContent: 'center' }}>Real-time Conversations</div>
          <p className="an-page-desc" style={{ marginBottom: 20 }}>Use the dedicated Conversations portal for guest and customer live chats.</p>
          <button className="an-btn an-btn-primary" onClick={() => nav('/admin/chats')}>Go to Conversations</button>
        </div>
      ) : (
        <div className="an-inbox-wrap an-email-shell">
          {/* Message List */}
          <div className={`an-inbox-list an-email-list ${msg ? 'has-mobile-selection' : ''}`}>
            <div className="an-inbox-head">
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--an-text)' }}>Tickets & Requests</span>
            </div>
            <div className="an-inbox-body">
              {isLoadingTickets && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--an-text3)', fontSize: 13 }}>
                  Loading real support tickets...
                </div>
              )}
              {!isLoadingTickets && loadError && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--an-red-text)', fontSize: 13 }}>
                  Support Hub could not load: {loadError}
                </div>
              )}
              {!isLoadingTickets && !loadError && filteredMessages.map(m => (
                <div
                  key={m.id}
                  className={`an-msg${m.unread ? ' unread' : ''}${active === m.id ? ' active' : ''}`}
                  onClick={() => handleSelectMessage(m.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="an-msg-from">
                    {m.from}
                    <span className="an-msg-time">{m.time}</span>
                  </div>
                  <div className="an-msg-sub">{m.subject}</div>
                  <div className="an-msg-prev">{m.preview}</div>
                  <div className="an-msg-tags">
                    {m.tags.map(t => (
                      <span key={t} className={`an-badge ${getBadgeClass(t) || 'an-badge-gray'}`}>{t}</span>
                    ))}
                    <span className={`an-badge ${getStatusBadge(m.status)}`} style={{ marginLeft: 4 }}>
                      {m.status.replace('_', ' ')}
                    </span>
                    <a
                      href={getGmailSearchLink(m.email, m.subject)}
                      target="_blank"
                      rel="noreferrer"
                      className="an-badge an-badge-blue"
                      style={{ marginLeft: 6, textDecoration: 'none' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open in Gmail
                    </a>
                  </div>
                </div>
              ))}
              {!isLoadingTickets && !loadError && filteredMessages.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--an-text3)', fontSize: 13 }}>
                  No messages in this filter
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className={`an-inbox-detail an-email-detail ${msg ? 'has-mobile-selection' : ''}`}>
            <div className="an-detail-head">
              {msg ? (
                <>
                  <button className="an-mobile-back" onClick={() => setActive('')}>← Back to emails</button>
                  <div className="an-detail-subj">{msg.subject}</div>
                  <div className="an-detail-meta">
                    <span>From: <strong style={{ color: 'var(--an-text)' }}>{msg.email}</strong></span>
                    <span>·</span>
                    <span>{msg.time}</span>
                    <span>
                      {msg.tags.map(t => (
                        <span key={t} className={`an-badge ${getBadgeClass(t) || 'an-badge-gray'}`} style={{ marginLeft: 4 }}>{t}</span>
                      ))}
                    </span>
                    <a
                      href={getGmailSearchLink(msg.email, msg.subject)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--an-orange-text)', textDecoration: 'underline' }}
                    >
                      Open in Gmail inbox
                    </a>
                  </div>
                </>
              ) : (
                <div style={{ padding: 20, color: 'var(--an-text3)' }}>Select a message to view details</div>
              )}
            </div>
            {msg && (
              <div className="an-detail-body" style={{ overflowY: 'auto', maxHeight: 'calc(100% - 200px)' }}>
              {/* Original Message */}
              <div className="an-msg-bubble">
                <div className="an-bubble-header">
                  <div className="an-avatar" style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>{msg.av}</div>
                  <span className="an-bubble-name">{msg.from}</span>
                  <span className="an-bubble-time">{msg.time}</span>
                </div>
                <div className="an-bubble-body" style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</div>
              </div>

              {/* Replies */}
              {msg.replies.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--an-text3)', textTransform: 'uppercase', marginBottom: 12 }}>
                    {msg.replies.length} Reply{msg.replies.length > 1 ? 'ies' : 'y'}
                  </div>
                  {msg.replies.map(reply => (
                    <div key={reply.id} className="an-msg-bubble" style={{ 
                      background: reply.from === 'me' ? 'var(--an-purple-bg)' : 'var(--an-sidebar)',
                      marginBottom: 8,
                    }}>
                      <div className="an-bubble-header">
                        <div className="an-avatar" style={{ 
                          background: reply.from === 'me' 
                            ? 'linear-gradient(135deg,#E97451,#D66140)' 
                            : 'linear-gradient(135deg,#3B82F6,#8B5CF6)' 
                        }}>
                          {reply.from === 'me' ? 'ME' : msg.av}
                        </div>
                        <span className="an-bubble-name">{reply.from === 'me' ? 'Me' : msg.from}</span>
                        <span className="an-bubble-time">{reply.time}</span>
                      </div>
                      <div className="an-bubble-body" style={{ whiteSpace: 'pre-wrap' }}>{reply.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {msg.showAction && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', background: 'var(--an-orange-bg)',
                  border: '1px solid rgba(173,87,0,.12)', borderRadius: 'var(--an-radius)',
                  marginTop: 16,
                }}>
                  <span style={{ color: 'var(--an-orange-text)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.636-6.364l.707.707M12 21v-1m-4.364-1.636l.707-.707m9.314 0l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
                    </svg>
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--an-orange-text)' }}>Suggested next action</div>
                    <div style={{ fontSize: 12, color: 'var(--an-text2)' }}>
                      This client hasn't received a quote yet.{' '}
                      <span
                        style={{ color: 'var(--an-orange-text)', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => {
                          nav('/admin/quotebuilder');
                        }}
                      >
                        Open Quote Builder
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                {msg.status === 'open' && (
                  <button 
                    className="an-btn an-btn-ghost an-btn-sm"
                    onClick={() => handleStatusUpdate(msg.id, 'in_progress')}
                  >
                    Mark In Progress
                  </button>
                )}
                {msg.status !== 'closed' && msg.status !== 'resolved' && (
                  <>
                    <button 
                      className="an-btn an-btn-ghost an-btn-sm"
                      onClick={() => handleStatusUpdate(msg.id, 'resolved')}
                    >
                      Mark Resolved
                    </button>
                    <button 
                      className="an-btn an-btn-ghost an-btn-sm"
                      onClick={() => handleStatusUpdate(msg.id, 'closed')}
                    >
                      Close Ticket
                    </button>
                  </>
                )}
                {msg.status === 'resolved' && (
                  <button 
                    className="an-btn an-btn-ghost an-btn-sm"
                    onClick={() => handleStatusUpdate(msg.id, 'open')}
                  >
                    Reopen Ticket
                  </button>
                )}
              </div>
            </div>
            )}
            {msg && (
              <>
              <div className="an-detail-footer">
              <textarea 
                className="an-reply-area" 
                placeholder="Write a reply…" 
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="an-reply-foot">
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="an-btn an-btn-ghost an-btn-sm" onClick={handleAttachment}>📎 Attach</button>
                  <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setShowTemplates(!showTemplates)}>Templates</button>
                </div>
                <button 
                  className="an-btn an-btn-primary an-btn-sm" 
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                >
                  Send Reply
                </button>
              </div>
            </div>

            {/* Templates Dropdown */}
            {showTemplates && (
              <div style={{
                position: 'absolute',
                bottom: 100,
                right: 20,
                background: 'white',
                borderRadius: 12,
                border: '1px solid var(--an-border)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                zIndex: 100,
                padding: 8,
                minWidth: 220,
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--an-text3)', textTransform: 'uppercase', padding: '4px 8px', marginBottom: 4 }}>Quick Replies</div>
                {emailTemplates.map(template => (
                  <button
                    key={template.name}
                    onClick={() => handleTemplateSelect(template.text)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 13,
                      color: 'var(--an-text)',
                    }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            )}
            </>
          )}
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="an-modal-overlay" onClick={() => setShowCompose(false)}>
          <div className="an-modal" onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 520, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>New Message</h3>
              <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setShowCompose(false)}>×</button>
            </div>
            <form onSubmit={handleComposeSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>To</label>
                  <input 
                    value={composeData.to}
                    onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                    type="email" 
                    required 
                    className="an-input" 
                    style={{ width: '100%', height: 36, borderRadius: 8, border: '1px solid var(--an-border)', padding: '0 12px', fontSize: 13 }} 
                    placeholder="client@example.com" 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>Subject</label>
                  <input 
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    required 
                    className="an-input" 
                    style={{ width: '100%', height: 36, borderRadius: 8, border: '1px solid var(--an-border)', padding: '0 12px', fontSize: 13 }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block' }}>Message</label>
                  <textarea 
                    value={composeData.message}
                    onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                    required 
                    rows={5} 
                    className="an-input" 
                    style={{ width: '100%', borderRadius: 8, border: '1px solid var(--an-border)', padding: 12, fontSize: 13, resize: 'vertical' }} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" className="an-btn an-btn-ghost" onClick={() => setShowCompose(false)}>Cancel</button>
                <button type="submit" className="an-btn an-btn-primary">Send Message</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compose Button (floating) */}
      <button 
        className="an-btn an-btn-primary"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          borderRadius: '50%',
          width: 56,
          height: 56,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 50,
        }}
        onClick={() => setShowCompose(true)}
        title="Compose new message"
      >
        <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
};
