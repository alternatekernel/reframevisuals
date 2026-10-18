import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, DollarSign, Image as ImageIcon, RefreshCw, Save, UserRound } from 'lucide-react';
import { useOrder, useUpdateOrder, useEditors, useUpdateImageStatus } from '../hooks/useAdminData';
import { useToast } from '../ToastContext';
import { OrderDetailDrawer } from '../components/OrderDetailDrawer';

const STATUS_OPTIONS = [
  { value: 'new_review',        label: 'New Review' },
  { value: 'awaiting_approval', label: 'Awaiting Approval' },
  { value: 'in_progress',       label: 'In Progress' },
  { value: 'ready_qc',          label: 'QC Review' },
  { value: 'revision_needed',   label: 'Revision Needed' },
  { value: 'completed',         label: 'Completed' },
];

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateValue = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 10) : '';
const displayDate = (value?: string | null) => value ? new Date(value).toLocaleString() : 'Not set';

export const ProductionOrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId = '' } = useParams();

  // When accessed directly via URL, show the drawer overlaid on the production board
  if (orderId) {
    return (
      <div>
        <button onClick={() => navigate('/admin/production')} style={{ margin: 20 }} className="an-btn an-btn-ghost an-btn-sm">
          <ArrowLeft size={14} /> Back to Board
        </button>
        <OrderDetailDrawer orderId={orderId} onClose={() => navigate('/admin/production')} />
      </div>
    );
  }

  // Fallback below (kept for safety, normally unreachable)
  const { showToast } = useToast();
  const { data: order, isLoading, isError, refetch } = useOrder(orderId);
  const updateOrder = useUpdateOrder();
  const { data: editors = [] } = useEditors();
  const updateImage = useUpdateImageStatus();
  const [form, setForm] = useState({ status: '', priority: '', expectedCompletion: '', assignedEditorId: '', adminNotes: '', revisionNotes: '' });

  useEffect(() => {
    if (!order) return;
    const o = order as any;
    setForm({
      status: o.status || 'new_review',
      priority: o.priority || 'medium',
      expectedCompletion: dateValue(o.timeline?.expectedCompletion),
      assignedEditorId: o.assignedEditorId || '',
      adminNotes: o.adminNotes || '',
      revisionNotes: o.revisionNotes || '',
    });
  }, [order]);

  const completion = useMemo(() => {
    const images = (order as any)?.images || [];
    if (!images.length) return { done: 0, total: (order as any)?.volume || 0 };
    return {
      done: images.filter((image: any) => ['completed', 'approved', 'delivered'].includes(String(image.status).toLowerCase())).length,
      total: images.length,
    };
  }, [order]);

  const saveChanges = async () => {
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
        },
      });
      showToast('Order saved', 'Production order updated successfully', 'success');
      refetch();
    } catch (error) {
      showToast('Save failed', error instanceof Error ? error.message : 'Could not update this order', 'error');
    }
  };

  if (isLoading) {
    return <div className="p-10 text-sm text-[#777]">Loading order...</div>;
  }

  if (isError || !order) {
    return (
      <div className="p-10 space-y-4">
        <button onClick={() => navigate('/admin/production')} className="an-btn an-btn-ghost an-btn-sm"><ArrowLeft size={14} /> Back</button>
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">Order not found or failed to load.</div>
      </div>
    );
  }

  const data: any = order;

  return (
    <div className="space-y-5">
      <div className="an-page-header">
        <div className="an-page-title">
          <button onClick={() => navigate('/admin/production')} className="rounded-full p-2 hover:bg-black/5"><ArrowLeft size={18} /></button>
          {data.code || 'Order Detail'}
        </div>
        <div className="an-page-desc">{data.title || 'Untitled order'} · {data.customer?.name || data.customer?.contact || 'Unknown customer'}</div>
        <div className="an-page-actions">
          <button onClick={() => refetch()} className="an-btn an-btn-ghost an-btn-sm"><RefreshCw size={14} /> Refresh</button>
          <button onClick={saveChanges} disabled={updateOrder.isPending} className="an-btn an-btn-primary an-btn-sm"><Save size={14} /> {updateOrder.isPending ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Metric icon={UserRound} label="Customer" value={data.customer?.name || data.customer?.contact || 'Unknown'} />
        <Metric icon={ImageIcon} label="Volume" value={`${data.volume || 0} assets`} />
        <Metric icon={DollarSign} label="Total" value={currency.format(Number(data.pricing?.totalPrice || 0))} />
        <Metric icon={CalendarClock} label="Due" value={displayDate(data.timeline?.expectedCompletion)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 an-card p-5 space-y-5">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-[#777] mb-1">Project</div>
            <div className="text-[22px] font-bold text-[var(--an-text)]">{data.title || 'Untitled order'}</div>
            <div className="mt-1 text-[13px] text-[#666]">Service: {data.serviceType || 'Not set'} · Complexity: {data.complexity || 'Not set'}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Status</span>
              <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5">
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Priority</span>
              <select value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))} className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5">
                {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Assigned Editor</span>
              <select value={form.assignedEditorId} onChange={(event) => setForm((prev) => ({ ...prev, assignedEditorId: event.target.value }))} className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5">
                <option value="">Unassigned</option>
                {(editors as any[]).map((ed: any) => <option key={ed.id} value={ed.id}>{ed.firstName} {ed.lastName}{ed.tier ? ` — ${ed.tier}` : ''}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Expected completion</span>
              <input type="date" value={form.expectedCompletion} onChange={(event) => setForm((prev) => ({ ...prev, expectedCompletion: event.target.value }))} className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5" />
            </label>
          </div>

          {form.status === 'revision_needed' && (
            <div>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--an-red-text)' }}>Revision Instructions</span>
              <textarea
                className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5"
                rows={3}
                placeholder="Document what needs to be revised for the editor..."
                value={form.revisionNotes}
                onChange={(e) => setForm((prev) => ({ ...prev, revisionNotes: e.target.value }))}
              />
            </div>
          )}

          <div>
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Internal Notes</span>
            <textarea
              className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5"
              rows={2}
              placeholder="Editor instructions, client preferences, delivery notes..."
              value={form.adminNotes}
              onChange={(e) => setForm((prev) => ({ ...prev, adminNotes: e.target.value }))}
            />
          </div>
        </div>

        <div className="an-card p-5 space-y-4">
          <div className="font-semibold text-[14px] text-[var(--an-text)]">Timeline</div>
          <Timeline label="Created" value={displayDate(data.timeline?.createdAt)} />
          <Timeline label="Started" value={displayDate(data.timeline?.startedAt)} />
          <Timeline label="QC submitted" value={displayDate(data.timeline?.submittedQCAt)} />
          <Timeline label="Completed" value={displayDate(data.timeline?.completedAt)} />
        </div>
      </div>

      {data.customFilesLink && (
        <div className="an-card p-4" style={{ background: 'var(--an-sidebar)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#777] mb-1">Source Files</div>
          <div className="flex items-center gap-3">
            <a href={data.customFilesLink} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--an-blue-text)', fontWeight: 600, textDecoration: 'none' }}>Open Dropbox Folder ↗</a>
            {data.customFilesCount && <span className="text-[12px] text-[#777]">{data.customFilesCount} files</span>}
          </div>
        </div>
      )}

      <div className="an-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-semibold text-[14px] text-[var(--an-text)]">Assets</div>
          <div className="text-[12px] text-[#777]">{completion.done}/{completion.total} complete</div>
        </div>
        {data.images?.length ? (
          <div className="divide-y divide-[var(--an-border)]">
            {data.images.map((image: any) => {
              const IMAGE_STATUS_COLORS: Record<string, string> = {
                pending: '#777', in_progress: 'var(--an-orange-text)',
                completed: 'var(--an-green-text)', revision_needed: 'var(--an-red-text)',
              };
              return (
                <div key={image.id} className="flex items-center justify-between py-3 text-[13px] gap-3">
                  <div className="font-medium text-[var(--an-text)] flex-1 min-w-0 truncate">{image.filename}</div>
                  {image.url && (
                    <a href={image.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--an-blue-text)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Open ↗</a>
                  )}
                  <select
                    value={image.status}
                    onChange={(e) => updateImage.mutate({ imageId: image.id, status: e.target.value })}
                    style={{ fontSize: 12, border: '1px solid var(--an-border)', borderRadius: 6, padding: '2px 8px', color: IMAGE_STATUS_COLORS[image.status] || '#777', background: 'transparent', cursor: 'pointer' }}
                  >
                    {['pending', 'in_progress', 'completed', 'revision_needed'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  {(image.revisionCount || 0) > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--an-red-text)', whiteSpace: 'nowrap' }}>{image.revisionCount}× rev</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-[13px] text-[#888]">No assets are attached to this order yet.</div>
        )}
      </div>
    </div>
  );
};

const Metric = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="an-card p-4">
    <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--an-text2)]"><Icon size={15} /> {label}</div>
    <div className="mt-2 truncate text-[18px] font-bold text-[var(--an-text)]">{value}</div>
  </div>
);

const Timeline = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-[var(--an-border)] px-3 py-2">
    <div className="text-[11px] uppercase tracking-wide text-[#777]">{label}</div>
    <div className="mt-1 text-[13px] font-semibold text-[var(--an-text)]">{value}</div>
  </div>
);

export default ProductionOrderDetailPage;
