import React, { useEffect, useRef, useState } from 'react';
import {
  X, Archive, ArchiveRestore, Save, RefreshCw, ExternalLink,
  MessageSquare, Clock, User, Image as ImageIcon, DollarSign,
  CheckSquare, Square, ChevronDown, ChevronRight,
} from 'lucide-react';
import {
  useOrder, useUpdateOrder, useEditors, useUpdateImageStatus,
  useOrderActivities, useAddOrderActivity, useArchiveOrder, useUnarchiveOrder,
} from '../hooks/useAdminData';
import { useToast } from '../ToastContext';

// ── Types ────────────────────────────────────────────────────
interface Props {
  orderId: string | null;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'new_review',        label: 'New Review' },
  { value: 'awaiting_approval', label: 'Awaiting Approval' },
  { value: 'in_progress',       label: 'In Progress' },
  { value: 'ready_qc',          label: 'QC Review' },
  { value: 'revision_needed',   label: 'Revision Needed' },
  { value: 'completed',         label: 'Completed' },
];

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

const IMAGE_STATUS_COLORS: Record<string, string> = {
  pending: '#999',
  in_progress: 'var(--an-orange-text)',
  completed: 'var(--an-green-text)',
  revision_needed: 'var(--an-red-text)',
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  status_change: <Clock size={13} />,
  assignment:    <User size={13} />,
  comment:       <MessageSquare size={13} />,
  archive:       <Archive size={13} />,
  field_change:  <RefreshCw size={13} />,
};

const dateValue = (v?: string | null) => v ? new Date(v).toISOString().slice(0, 10) : '';

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getSLABadge(expectedCompletion?: string | null) {
  if (!expectedCompletion) return null;
  const hoursLeft = (new Date(expectedCompletion).getTime() - Date.now()) / 3600000;
  if (hoursLeft < 0)  return { label: 'Overdue',  cls: 'an-badge-red' };
  if (hoursLeft < 6)  return { label: 'Same Day', cls: 'an-badge-red' };
  if (hoursLeft < 12) return { label: 'Rush',     cls: 'an-badge-orange' };
  if (hoursLeft < 24) return { label: 'Express',  cls: 'an-badge-yellow' };
  return { label: 'Standard', cls: 'an-badge-gray' };
}

// ── Component ────────────────────────────────────────────────
export const OrderDetailDrawer: React.FC<Props> = ({ orderId, onClose }) => {
  const { showToast } = useToast();
  const { data: order, isLoading, refetch } = useOrder(orderId || '');
  const updateOrder = useUpdateOrder();
  const { data: editors = [] } = useEditors();
  const updateImage = useUpdateImageStatus();
  const { data: activities = [] } = useOrderActivities(orderId);
  const addActivity = useAddOrderActivity();
  const archiveOrder = useArchiveOrder();
  const unarchiveOrder = useUnarchiveOrder();

  const [form, setForm] = useState({
    status: '', priority: '', expectedCompletion: '',
    assignedEditorId: '', adminNotes: '', revisionNotes: '', title: '',
    deliveryLink: '', deliveryNote: '',
  });
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const activityBottomRef = useRef<HTMLDivElement>(null);

  const data: any = order;

  useEffect(() => {
    if (!data) return;
    setForm({
      status: data.status || 'new_review',
      priority: data.priority || 'medium',
      expectedCompletion: dateValue(data.timeline?.expectedCompletion),
      assignedEditorId: data.assignedEditor?.id || '',
      adminNotes: data.adminNotes || '',
      revisionNotes: data.revisionNotes || '',
      title: data.title || '',
      deliveryLink: data.deliveryLink || '',
      deliveryNote: data.deliveryNote || '',
    });
  }, [order]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Scroll activity feed to bottom on new activities
  useEffect(() => {
    activityBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activities]);

  const save = async () => {
    if (!orderId) return;
    try {
      await updateOrder.mutateAsync({
        id: orderId,
        data: {
          status: form.status,
          priority: form.priority,
          expectedCompletion: form.expectedCompletion || undefined,
          assignedEditorId: form.assignedEditorId || null,
          adminNotes: form.adminNotes,
          revisionNotes: form.revisionNotes,
          title: form.title,
          deliveryLink: form.deliveryLink,
          deliveryNote: form.deliveryNote,
        },
      });
      showToast('Saved', 'Order updated', 'success');
      refetch();
    } catch (err) {
      showToast('Error', err instanceof Error ? err.message : 'Failed to save', 'error');
    }
  };

  const submitComment = async () => {
    if (!orderId || !comment.trim()) return;
    setSubmittingComment(true);
    try {
      await addActivity.mutateAsync({ orderId, message: comment.trim() });
      setComment('');
    } catch (err) {
      showToast('Error', 'Failed to post comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleArchive = async () => {
    if (!orderId || !data) return;
    try {
      if (data.archivedAt) {
        await unarchiveOrder.mutateAsync(orderId);
        showToast('Unarchived', 'Order restored to board', 'success');
      } else {
        await archiveOrder.mutateAsync(orderId);
        showToast('Archived', 'Order removed from board', 'success');
        onClose();
      }
      refetch();
    } catch (err) {
      showToast('Error', 'Archive action failed', 'error');
    }
  };

  const handleTitleBlur = async () => {
    setEditingTitle(false);
    if (!orderId || !data || form.title === data.title) return;
    try {
      await updateOrder.mutateAsync({ id: orderId, data: { title: form.title } });
    } catch { /* silent */ }
  };

  const images = data?.images || [];
  const doneImages = images.filter((i: any) => ['completed', 'approved', 'delivered'].includes(i.status)).length;
  const slaBadge = getSLABadge(data?.timeline?.expectedCompletion);

  if (!orderId) return null;

  return (
    <div className="an-order-modal-wrap" onClick={onClose}>
      <div className="an-order-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--an-border)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
          flexShrink: 0,
          background: 'var(--an-sidebar)',
        }}>
          {/* Title (editable) */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--an-text3)', fontFamily: 'monospace' }}>
                {data?.code || '…'}
              </span>
              {slaBadge && <span className={`an-badge ${slaBadge.cls}`}>{slaBadge.label}</span>}
              <span className={`an-badge an-badge-gray`} style={{ textTransform: 'capitalize' }}>
                {form.status.replace(/_/g, ' ')}
              </span>
              {data?.archivedAt && <span className="an-badge an-badge-gray">Archived</span>}
            </div>
            {editingTitle ? (
              <textarea
                ref={titleRef}
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                onBlur={handleTitleBlur}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTitleBlur(); } }}
                rows={2}
                style={{
                  width: '100%', fontSize: 18, fontWeight: 700, color: 'var(--an-text)',
                  border: '1px solid var(--an-border)', borderRadius: 6, padding: '4px 8px',
                  resize: 'none', outline: 'none', lineHeight: 1.3,
                  background: 'var(--an-page)', fontFamily: 'inherit',
                }}
                autoFocus
              />
            ) : (
              <div
                onClick={() => setEditingTitle(true)}
                style={{
                  fontSize: 18, fontWeight: 700, color: 'var(--an-text)',
                  lineHeight: 1.3, cursor: 'text', borderRadius: 4,
                  padding: '2px 4px', margin: '-2px -4px',
                }}
                title="Click to edit title"
              >
                {isLoading ? '…' : (form.title || 'Untitled order')}
              </div>
            )}
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--an-text3)' }}>
              {data?.customer?.name || data?.customer?.contact || ''}
              {data?.serviceType && ` · ${data.serviceType}`}
              {data?.volume && ` · ${data.volume} images`}
            </div>
          </div>

          {/* Header actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingTop: 2 }}>
            <button onClick={() => refetch()} className="an-btn an-btn-ghost an-btn-sm" title="Refresh">
              <RefreshCw size={14} />
            </button>
            <button onClick={handleArchive} className="an-btn an-btn-ghost an-btn-sm" title={data?.archivedAt ? 'Unarchive' : 'Archive'}>
              {data?.archivedAt ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            </button>
            <button onClick={onClose} className="an-btn an-btn-ghost an-btn-sm" title="Close">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--an-text3)', fontSize: 13 }}>Loading order…</div>
        ) : (
          <div className="an-order-modal-body">

            {/* ── Left: main content ── */}
            <div className="an-order-modal-main">

                {/* Controls */}
                <section style={{ marginBottom: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <FormField label="Status">
                      <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="an-drawer-select">
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Priority">
                      <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="an-drawer-select">
                        {PRIORITY_OPTIONS.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Assigned Editor">
                      <select value={form.assignedEditorId} onChange={e => setForm(p => ({ ...p, assignedEditorId: e.target.value }))} className="an-drawer-select">
                        <option value="">Unassigned</option>
                        {(editors as any[]).map((ed: any) => (
                          <option key={ed.id} value={ed.id}>{ed.firstName} {ed.lastName}{ed.tier ? ` — ${ed.tier}` : ''}</option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Expected Completion">
                      <input type="date" value={form.expectedCompletion} onChange={e => setForm(p => ({ ...p, expectedCompletion: e.target.value }))} className="an-drawer-select" />
                    </FormField>
                  </div>

                  {form.status === 'revision_needed' && (
                    <div style={{ marginTop: 10 }}>
                      <FormField label={<span style={{ color: 'var(--an-red-text)' }}>Revision Instructions</span>}>
                        <textarea
                          value={form.revisionNotes}
                          onChange={e => setForm(p => ({ ...p, revisionNotes: e.target.value }))}
                          rows={3}
                          placeholder="What needs to be revised…"
                          className="an-drawer-select"
                          style={{ resize: 'vertical' }}
                        />
                      </FormField>
                    </div>
                  )}

                  <div style={{ marginTop: 10 }}>
                    <FormField label="Internal Notes">
                      <textarea
                        value={form.adminNotes}
                        onChange={e => setForm(p => ({ ...p, adminNotes: e.target.value }))}
                        rows={3}
                        placeholder="Editor instructions, client preferences, delivery notes…"
                        className="an-drawer-select"
                        style={{ resize: 'vertical' }}
                      />
                    </FormField>
                  </div>

                  {/* Delivery back to the client. Marking an order Done used to be the
                      end of the trail — there was nowhere to put the finished files or a
                      link to them, so the client's Download button had nothing to serve. */}
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <FormField label="Delivery Link (client-visible)">
                      <input
                        type="url"
                        value={form.deliveryLink}
                        onChange={e => setForm(p => ({ ...p, deliveryLink: e.target.value }))}
                        placeholder="Drive / Dropbox / WeTransfer link to the finished files"
                        className="an-drawer-select"
                      />
                    </FormField>
                    <FormField label="Delivery Note (client-visible)">
                      <textarea
                        value={form.deliveryNote}
                        onChange={e => setForm(p => ({ ...p, deliveryNote: e.target.value }))}
                        rows={2}
                        placeholder="What was done, how to use the files, anything the client should know…"
                        className="an-drawer-select"
                        style={{ resize: 'vertical' }}
                      />
                    </FormField>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={save} disabled={updateOrder.isPending} className="an-btn an-btn-primary an-btn-sm">
                      <Save size={13} /> {updateOrder.isPending ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </section>

                {/* Client brief — what the customer typed into Project Instructions.
                    This was stored on the order but never displayed, so editors saw
                    an order with no requirements at all. */}
                <section style={{ marginBottom: 24 }}>
                  <SectionTitle>Client Instructions</SectionTitle>
                  {data?.description?.trim() ? (
                    <div style={{
                      fontSize: 13, lineHeight: 1.6, color: 'var(--an-text)', whiteSpace: 'pre-wrap',
                      background: 'var(--an-sidebar)', border: '1px solid var(--an-border)',
                      borderRadius: 8, padding: '10px 12px',
                    }}>
                      {data.description}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--an-text3)' }}>
                      The client did not add any instructions.
                    </div>
                  )}
                  {data?.specs && Object.values(data.specs).some(Boolean) && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {Object.entries(data.specs)
                        .filter(([, value]) => Boolean(value))
                        .map(([key, value]) => (
                          <span key={key} style={{
                            fontSize: 11, color: 'var(--an-text2)', background: 'var(--an-page)',
                            border: '1px solid var(--an-border)', borderRadius: 999, padding: '2px 8px',
                          }}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}: {String(value)}
                          </span>
                        ))}
                    </div>
                  )}
                </section>

                {/* Source files */}
                {data?.customFilesLink && (
                  <section style={{ marginBottom: 24 }}>
                    <SectionTitle>Source Files</SectionTitle>
                    <a href={data.customFilesLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--an-blue-text)', fontWeight: 600, textDecoration: 'none' }}>
                      <ExternalLink size={13} /> Open Dropbox Folder
                      {data.customFilesCount && <span style={{ fontSize: 12, color: 'var(--an-text3)', fontWeight: 400 }}>({data.customFilesCount} files)</span>}
                    </a>
                  </section>
                )}

                {/* Checklist (images) */}
                {images.length > 0 && (
                  <section style={{ marginBottom: 24 }}>
                    <div
                      onClick={() => setShowChecklist(p => !p)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 8 }}
                    >
                      <SectionTitle style={{ margin: 0 }}>
                        <CheckSquare size={14} style={{ display: 'inline', marginRight: 4 }} />
                        Assets
                      </SectionTitle>
                      <span style={{ fontSize: 11, color: 'var(--an-text3)', marginLeft: 2 }}>{doneImages}/{images.length}</span>
                      {showChecklist ? <ChevronDown size={13} style={{ marginLeft: 'auto', color: 'var(--an-text3)' }} /> : <ChevronRight size={13} style={{ marginLeft: 'auto', color: 'var(--an-text3)' }} />}
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 4, background: 'var(--an-border)', borderRadius: 2, marginBottom: 10 }}>
                      <div style={{ height: '100%', width: `${images.length ? Math.round((doneImages / images.length) * 100) : 0}%`, background: 'var(--an-green-text)', borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>

                    {showChecklist && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {images.map((img: any) => {
                          const done = ['completed', 'approved', 'delivered'].includes(img.status);
                          return (
                            <div key={img.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--an-border)' }}>
                              {done ? <CheckSquare size={14} style={{ color: 'var(--an-green-text)', flexShrink: 0 }} /> : <Square size={14} style={{ color: 'var(--an-text3)', flexShrink: 0 }} />}
                              <span style={{ flex: 1, fontSize: 12, color: done ? 'var(--an-text3)' : 'var(--an-text)', textDecoration: done ? 'line-through' : 'none', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {img.filename || `Image ${img.id.slice(-6)}`}
                              </span>
                              {img.url && (
                                <a href={img.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--an-blue-text)', textDecoration: 'none', flexShrink: 0 }}>↗</a>
                              )}
                              {(img.revisionCount || 0) > 0 && (
                                <span style={{ fontSize: 10, color: 'var(--an-red-text)', flexShrink: 0 }}>{img.revisionCount}× rev</span>
                              )}
                              <select
                                value={img.status}
                                onChange={e => updateImage.mutate({ imageId: img.id, status: e.target.value })}
                                style={{ fontSize: 11, border: '1px solid var(--an-border)', borderRadius: 4, padding: '1px 6px', color: IMAGE_STATUS_COLORS[img.status] || '#999', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}
                              >
                                {['pending', 'in_progress', 'completed', 'revision_needed'].map(s => (
                                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* Activity feed */}
                <section>
                  <SectionTitle>
                    <MessageSquare size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Activity
                  </SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                    {(activities as any[]).length === 0 && (
                      <div style={{ fontSize: 12, color: 'var(--an-text3)', padding: '8px 0' }}>No activity yet.</div>
                    )}
                    {(activities as any[]).map((act: any) => (
                      <div key={act.id} style={{ display: 'flex', gap: 10 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', background: 'var(--an-sidebar)',
                          border: '1px solid var(--an-border)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0, color: 'var(--an-text3)',
                        }}>
                          {ACTIVITY_ICONS[act.type] || <Clock size={13} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--an-text)' }}>{act.authorName || 'Admin'}</span>
                            <span style={{ fontSize: 11, color: 'var(--an-text3)' }}>{relativeTime(act.createdAt)}</span>
                          </div>
                          {act.type === 'comment' ? (
                            <div style={{
                              marginTop: 4, fontSize: 13, color: 'var(--an-text)', background: 'var(--an-sidebar)',
                              border: '1px solid var(--an-border)', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5,
                            }}>
                              {act.message}
                            </div>
                          ) : (
                            <div style={{ marginTop: 2, fontSize: 12, color: 'var(--an-text2)' }}>{act.message}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={activityBottomRef} />
                  </div>

                  {/* Comment box */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitComment(); }}
                      placeholder="Write a comment… (Ctrl+Enter to submit)"
                      rows={2}
                      style={{
                        flex: 1, fontSize: 13, border: '1px solid var(--an-border)', borderRadius: 8,
                        padding: '8px 12px', resize: 'none', outline: 'none', lineHeight: 1.5,
                        color: 'var(--an-text)', background: 'var(--an-page)', fontFamily: 'inherit',
                      }}
                    />
                    <button
                      onClick={submitComment}
                      disabled={submittingComment || !comment.trim()}
                      className="an-btn an-btn-primary an-btn-sm"
                      style={{ alignSelf: 'flex-end' }}
                    >
                      {submittingComment ? '…' : 'Post'}
                    </button>
                  </div>
                </section>
              </div>

            {/* ── Right sidebar ── */}
            <div className="an-order-modal-side">

                {/* Metrics */}
                <SectionTitle>Details</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  <SidebarRow icon={<User size={13} />} label="Customer">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span>{data?.customer?.name || data?.customer?.contact || '—'}</span>
                      {data?.customer?.code && (
                        <span style={{ fontSize: 11, color: 'var(--an-text3)' }}>{data.customer.code}</span>
                      )}
                      {data?.customer?.email && (
                        <a href={`mailto:${data.customer.email}`} style={{ fontSize: 11, color: 'var(--an-text2)' }}>
                          {data.customer.email}
                        </a>
                      )}
                      {data?.customer?.phone && (
                        <a href={`tel:${data.customer.phone}`} style={{ fontSize: 11, color: 'var(--an-text2)' }}>
                          {data.customer.phone}
                        </a>
                      )}
                    </div>
                  </SidebarRow>
                  <SidebarRow icon={<ImageIcon size={13} />} label="Volume">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span>{data?.volume || 0} assets</span>
                      {/* Billed volume can come from customFilesCount while only a few
                          files were uploaded directly — spell out the difference. */}
                      {typeof data?.volume === 'number' && data.volume !== (data?.images?.length || 0) && (
                        <span style={{ fontSize: 11, color: 'var(--an-text3)' }}>
                          {data?.images?.length || 0} uploaded here
                          {data?.customFilesLink ? ', rest via client link' : ''}
                        </span>
                      )}
                    </div>
                  </SidebarRow>
                  <SidebarRow icon={<DollarSign size={13} />} label="Total">
                    {data?.pricing?.totalPrice ? `$${Number(data.pricing.totalPrice).toFixed(2)}` : '—'}
                  </SidebarRow>
                </div>

                {/* Timeline */}
                <SectionTitle>Timeline</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
                  {[
                    { label: 'Created',    value: data?.timeline?.createdAt },
                    { label: 'Started',    value: data?.timeline?.startedAt },
                    { label: 'QC Submit',  value: data?.timeline?.submittedQCAt },
                    { label: 'Completed',  value: data?.timeline?.completedAt },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ fontSize: 12 }}>
                      <div style={{ color: 'var(--an-text3)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 1 }}>{label}</div>
                      <div style={{ color: value ? 'var(--an-text)' : 'var(--an-text3)' }}>
                        {value ? new Date(value).toLocaleString() : 'Not set'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* New review shortcut */}
                {data?.status === 'new_review' && (
                  <a
                    href={`/admin/production/${orderId}/review`}
                    style={{ display: 'block', textAlign: 'center', padding: '8px 12px', borderRadius: 8, background: '#000', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 12 }}
                  >
                    Open Pricing Review →
                  </a>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Small helpers ─────────────────────────────────────────────
const SectionTitle: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--an-text3)', marginBottom: 10, ...style }}>
    {children}
  </div>
);

const FormField: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({ label, children }) => (
  <label style={{ display: 'block' }}>
    <span style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777', marginBottom: 4 }}>{label}</span>
    {children}
  </label>
);

const SidebarRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--an-text3)', marginBottom: 2 }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: 13, color: 'var(--an-text)', paddingLeft: 18 }}>{children}</div>
  </div>
);

export default OrderDetailDrawer;
