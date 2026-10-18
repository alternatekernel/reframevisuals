import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useKanban, useUpdateOrder, useEditors, useUpdateOrderPosition } from '../hooks/useAdminData';
import { useToast } from '../ToastContext';
import { OrderDetailDrawer } from '../components/OrderDetailDrawer';
import { API_BASE_URL } from '../utils/api';
import { RealtimeSource } from '../../lib/realtimeSource';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  projectName?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalImages: number;
  completedImages: number;
  expectedCompletion: string;
  createdAt: string;
  assignedEditorId?: string | null;
  totalPrice?: number;
  thumbnail?: string | null;
  columnPosition?: number;
}

interface KanbanColumn {
  status: string;
  label: string;
  orders: Order[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new_review:        { label: 'New',      color: 'var(--an-blue-text)' },
  awaiting_approval: { label: 'Awaiting', color: 'var(--an-purple-text)' },
  in_progress:       { label: 'In Edit',  color: 'var(--an-orange-text)' },
  ready_qc:          { label: 'QC',       color: 'var(--an-purple-text)' },
  revision_needed:   { label: 'Revision', color: 'var(--an-red-text)' },
  completed:         { label: 'Done',     color: 'var(--an-green-text)' },
};

const PRIORITY_BADGES: Record<string, string> = {
  urgent: 'an-badge-red',
  high:   'an-badge-orange',
  medium: 'an-badge-yellow',
  low:    'an-badge-gray',
};

const getSLABadge = (expectedCompletion: string) => {
  if (!expectedCompletion) return { label: 'No date', cls: 'an-badge-gray' };
  const hoursLeft = (new Date(expectedCompletion).getTime() - Date.now()) / 3600000;
  if (hoursLeft < 0)  return { label: 'Overdue',  cls: 'an-badge-red' };
  if (hoursLeft < 6)  return { label: 'Same Day', cls: 'an-badge-red' };
  if (hoursLeft < 12) return { label: 'Rush',     cls: 'an-badge-orange' };
  if (hoursLeft < 24) return { label: 'Express',  cls: 'an-badge-yellow' };
  return { label: 'Standard', cls: 'an-badge-gray' };
};

const getInitials = (name?: string) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getTimeRemaining = (expectedCompletion: string) => {
  if (!expectedCompletion) return '—';
  const hoursLeft = (new Date(expectedCompletion).getTime() - Date.now()) / 3600000;
  if (hoursLeft < 0)  return 'Overdue';
  if (hoursLeft < 1)  return `${Math.round(hoursLeft * 60)}m rem.`;
  if (hoursLeft < 24) return `${Math.round(hoursLeft)}h rem.`;
  return `${Math.round(hoursLeft / 24)}d rem.`;
};

const getEditorColor = (editorId?: string | null) => {
  if (!editorId) return 'var(--an-gray-text)';
  const colors = ['var(--an-purple-text)', 'var(--an-blue-text)', 'var(--an-green-text)', 'var(--an-orange-text)'];
  let hash = 0;
  for (let i = 0; i < editorId.length; i++) hash = editorId.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const ProductionPage: React.FC = () => {
  const nav = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const { data: kanbanData, isLoading, error, isError, refetch } = useKanban(showArchived);
  const updateOrder = useUpdateOrder();
  const updatePosition = useUpdateOrderPosition();
  const { data: editors = [] } = useEditors();

  const [draggedOrder, setDraggedOrder]     = useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo]     = useState<{ status: string; index: number } | null>(null);
  const [showFilter, setShowFilter]         = useState(false);
  const [sortBy, setSortBy]                 = useState('deadline');
  const [riskFilter, setRiskFilter]         = useState<'all' | 'at_risk'>('all');
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode]             = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const assignRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // SSE: real-time kanban invalidation
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    const base = typeof API_BASE_URL === 'string' ? API_BASE_URL : `${window.location.origin}/api`;
    const es = new RealtimeSource(`${base}/orders/admin-stream?token=${token}`);
    es.addEventListener('kanban_update', () => refetch());
    return () => es.close();
  }, [refetch]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) setAssigningOrderId(null);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilter(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedOrderIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const displayData: KanbanColumn[] = useMemo(() => {
    const priorityRank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return ((kanbanData as any) || []).map((column: KanbanColumn) => {
      const filtered = riskFilter === 'at_risk'
        ? column.orders.filter(o => getSLABadge(o.expectedCompletion).cls === 'an-badge-red')
        : column.orders;
      const orders = [...filtered].sort((a, b) => {
        if (sortBy === 'deadline') {
          const aT = a.expectedCompletion ? new Date(a.expectedCompletion).getTime() : Infinity;
          const bT = b.expectedCompletion ? new Date(b.expectedCompletion).getTime() : Infinity;
          return aT - bT;
        }
        if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'name')    return a.customerName.localeCompare(b.customerName);
        if (sortBy === 'position') return (a.columnPosition ?? 0) - (b.columnPosition ?? 0);
        return (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
      });
      return { ...column, orders };
    });
  }, [kanbanData, riskFilter, sortBy]);

  // ── Drag & Drop ──────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrder(orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverInfo({ status, index });
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string, targetIndex: number) => {
    e.preventDefault();
    if (!draggedOrder) return;

    // Find source order
    const sourceCol = displayData.find(col => col.orders.some(o => o.id === draggedOrder));
    const sourceOrder = sourceCol?.orders.find(o => o.id === draggedOrder);
    if (!sourceOrder) { setDraggedOrder(null); setDragOverInfo(null); return; }

    const crossColumn = sourceOrder.status !== targetStatus;

    if (crossColumn) {
      setDraggedOrder(null);
      setDragOverInfo(null);
      queryClient.setQueryData(['kanban', showArchived], (old: KanbanColumn[] | undefined) => {
        if (!old) return old;
        return old.map(col =>
          col.status === sourceOrder.status
            ? { ...col, orders: col.orders.filter(o => o.id !== draggedOrder) }
            : col
        );
      });
      updateOrder.mutate(
        { id: draggedOrder, data: { status: targetStatus } },
        {
          onSuccess: () => showToast('Moved', `Order moved to ${STATUS_CONFIG[targetStatus]?.label || targetStatus}`, 'success'),
          onError:   () => showToast('Error', 'Failed to update order status', 'error'),
        },
      );
      return;
    } else {
      // Reorder within column — update positions for all cards in column
      const colOrders = [...(displayData.find(c => c.status === targetStatus)?.orders || [])];
      const fromIdx = colOrders.findIndex(o => o.id === draggedOrder);
      if (fromIdx === -1 || fromIdx === targetIndex) { setDraggedOrder(null); setDragOverInfo(null); return; }
      const [moved] = colOrders.splice(fromIdx, 1);
      colOrders.splice(targetIndex, 0, moved);
      colOrders.forEach((o, i) => {
        if (o.columnPosition !== i) updatePosition.mutate({ id: o.id, position: i });
      });
    }

    setDraggedOrder(null);
    setDragOverInfo(null);
  };

  const handleDragEnd = () => { setDraggedOrder(null); setDragOverInfo(null); };

  const handleOrderClick = (order: Order) => {
    if (bulkMode) { toggleSelect(order.id); return; }
    setSelectedOrderId(order.id);
  };

  const handleAddTask = () => nav('/admin/custom-order');

  const handleSort = (criteria: string) => {
    setSortBy(criteria);
    setShowFilter(false);
  };

  const handleExport = () => {
    const rows = [
      ['Order', 'Customer', 'Status', 'Priority', 'Total Images', 'Completed Images', 'Expected Completion'],
      ...displayData.flatMap(col => col.orders.map(order => [
        order.orderNumber, order.customerName, col.status, order.priority,
        String(order.totalImages), String(order.completedImages), order.expectedCompletion,
      ])),
    ];
    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reframe-production-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('Exported', 'CSV downloaded', 'success');
  };

  const totalOrders = displayData.reduce((s, c) => s + c.orders.length, 0);
  const atRiskOrders = displayData.flatMap(c => c.orders).filter(o => getSLABadge(o.expectedCompletion).cls === 'an-badge-red').length;

  return (
    <div>
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
            </svg>
          </span>
          Production
        </div>
        <div className="an-page-desc">
          {isLoading ? 'Loading…' : `${totalOrders} ${showArchived ? 'archived' : 'active'} orders · ${atRiskOrders} at risk`}
        </div>
        <div className="an-page-actions">
          <button className="an-btn an-btn-primary an-btn-sm" onClick={handleAddTask}>+ New Order</button>

          {/* Sort dropdown */}
          <div style={{ position: 'relative' }} ref={filterRef}>
            <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setShowFilter(p => !p)}>
              Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            </button>
            {showFilter && (
              <div className="an-dropdown" style={{ top: '110%', right: 0 }}>
                <div style={{ fontSize: 'var(--an-text-2xs)', fontWeight: 600, color: 'var(--an-text3)', textTransform: 'uppercase', padding: '6px 12px 4px', letterSpacing: '0.05em' }}>Sort By</div>
                {[
                  { key: 'deadline',  label: 'Turnaround (default)' },
                  { key: 'position',  label: 'Manual order' },
                  { key: 'priority',  label: 'Priority' },
                  { key: 'created',   label: 'Created date' },
                  { key: 'name',      label: 'Customer name' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleSort(key)}
                    className="an-dropdown-item"
                    style={sortBy === key ? { background: 'var(--an-hover)', fontWeight: 600 } : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setRiskFilter(p => p === 'all' ? 'at_risk' : 'all')}>
            {riskFilter === 'at_risk' ? 'At Risk ✓' : 'Filter: All'}
          </button>
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => setShowArchived(p => !p)}>
            {showArchived ? 'Board View' : 'Archived'}
          </button>
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={handleExport}>Export</button>
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => { setBulkMode(p => !p); setSelectedOrderIds(new Set()); }}>
            {bulkMode ? 'Exit Select' : 'Select'}
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-750 mb-4">
          Failed to load Kanban board: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      <div className="an-kanban">
        {displayData.map(col => {
          const config = STATUS_CONFIG[col.status] || { label: col.label, color: 'var(--an-text)' };
          return (
            <div
              key={col.status}
              className="an-k-col"
              onDragOver={e => handleDragOver(e, col.status, col.orders.length)}
              onDrop={e => handleDrop(e, col.status, col.orders.length)}
            >
              <div className="an-k-head">
                <div className="an-k-title">
                  <span className="k-dot" style={{ background: config.color }} />
                  {config.label}
                </div>
                <span className="an-k-cnt">{col.orders.length}</span>
              </div>

              <div className="an-k-body">
                {col.orders.map((order: Order, idx: number) => {
                  const sla = getSLABadge(order.expectedCompletion);
                  const progress = order.totalImages > 0
                    ? Math.round((order.completedImages / order.totalImages) * 100) : 0;
                  const timeRemaining = getTimeRemaining(order.expectedCompletion);
                  const isDragging = draggedOrder === order.id;
                  const isDropTarget = dragOverInfo?.status === col.status && dragOverInfo?.index === idx && draggedOrder !== order.id;
                  const assignedEditor = (editors as any[]).find((ed: any) => ed.id === order.assignedEditorId);

                  return (
                    <div
                      key={order.id}
                      draggable={!bulkMode}
                      onDragStart={e => handleDragStart(e, order.id)}
                      onDragOver={e => handleDragOver(e, col.status, idx)}
                      onDrop={e => { e.stopPropagation(); handleDrop(e, col.status, idx); }}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleOrderClick(order)}
                      className="an-kcard"
                      style={{
                        cursor: 'pointer',
                        position: 'relative',
                        outline: selectedOrderIds.has(order.id) ? '2px solid var(--an-blue-text)' : 'none',
                        opacity: isDragging ? 0.4 : 1,
                        borderTop: isDropTarget ? '2px solid var(--an-blue-text)' : undefined,
                      }}
                    >
                      <div>
                        {bulkMode && (
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.has(order.id)}
                            onChange={() => toggleSelect(order.id)}
                            onClick={e => e.stopPropagation()}
                            style={{ position: 'absolute', top: 10, left: 10, width: 16, height: 16, zIndex: 10 }}
                          />
                        )}

                        <div className="an-kcard-id" style={{ paddingLeft: bulkMode ? 24 : 0 }}>
                          {order.orderNumber || '—'}
                          <span className={`an-badge ${sla.cls}`}>{sla.label}</span>
                        </div>

                        <div className="an-kcard-info">
                          <div className="an-kcard-row">
                            <span className="an-kcard-val">{order.customerName || 'Unknown'}</span>
                          </div>
                          {order.customerEmail && (
                            <div className="an-kcard-row">
                              <span className="an-kcard-val an-kcard-email">{order.customerEmail}</span>
                            </div>
                          )}
                          <div className="an-kcard-row">
                            <span className="an-kcard-val">{order.projectName || '—'}</span>
                          </div>
                          <div className="an-kcard-row">
                            <span className="an-kcard-val">{order.createdAt ? new Date(order.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                          </div>
                          <div className="an-kcard-row">
                            <span className="an-kcard-val">{order.totalImages ?? '—'} images</span>
                          </div>
                        </div>

                        {progress > 0 && progress < 100 && (
                          <div className="an-kprog">
                            <div
                              className={`an-kprog-fill an-${order.priority === 'urgent' || order.priority === 'high' ? 'bar-orange' : 'bar-blue'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}

                        <div className="an-kcard-foot" style={{ marginTop: 8 }}>
                          {order.assignedEditorId && (
                            <div style={{ position: 'relative' }} ref={assigningOrderId === order.id ? assignRef : undefined}>
                              <div
                                className="an-mini-av"
                                title={assignedEditor
                                  ? `${assignedEditor.firstName} ${assignedEditor.lastName}`
                                  : 'Assigned'}
                                onClick={e => { e.stopPropagation(); setAssigningOrderId(p => p === order.id ? null : order.id); }}
                                style={{ cursor: 'pointer', background: getEditorColor(order.assignedEditorId) }}
                              >
                                {assignedEditor
                                  ? getInitials(`${assignedEditor.firstName} ${assignedEditor.lastName}`)
                                  : '?'}
                              </div>

                              {assigningOrderId === order.id && (
                                <div style={{
                                  position: 'absolute', top: 28, left: 0, zIndex: 200,
                                  background: 'white', border: '1px solid var(--an-border)',
                                  borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: 6, minWidth: 190,
                                }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--an-text3)', padding: '2px 8px 6px', textTransform: 'uppercase' }}>Assign Editor</div>
                                  {[{ id: '', firstName: 'Unassigned', lastName: '', tier: '' }, ...(editors as any[])].map((ed: any) => (
                                    <button key={ed.id || '_none'} onClick={e => {
                                      e.stopPropagation();
                                      updateOrder.mutate({ id: order.id, data: { assignedEditorId: ed.id || null } }, {
                                        onSuccess: () => showToast('Assigned', ed.id ? `${ed.firstName} ${ed.lastName}` : 'Unassigned', 'success'),
                                      });
                                      setAssigningOrderId(null);
                                    }} style={{
                                      width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 6,
                                      border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--an-text)',
                                    }}>
                                      {ed.firstName} {ed.lastName} {ed.tier ? `— ${ed.tier}` : ''}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          <span className="an-kcard-time">{timeRemaining}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty column drop zone */}
                {col.orders.length === 0 && (
                  <div
                    onDragOver={e => handleDragOver(e, col.status, 0)}
                    onDrop={e => handleDrop(e, col.status, 0)}
                    style={{
                      padding: 20, textAlign: 'center', color: 'var(--an-text3)', fontSize: 13,
                      border: `2px dashed ${dragOverInfo?.status === col.status ? 'var(--an-blue-text)' : 'var(--an-border)'}`,
                      borderRadius: 8, marginTop: 8,
                    }}
                  >
                    Drop orders here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Action Toolbar */}
      {selectedOrderIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--an-text)', color: 'var(--an-page)', borderRadius: 'var(--an-r-lg)', padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: 12, zIndex: 300,
          boxShadow: 'var(--an-shadow-popover)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedOrderIds.size} selected</span>
          <select
            style={{ background: '#333', color: 'white', border: '1px solid #444', borderRadius: 6, padding: '4px 10px', fontSize: 13 }}
            defaultValue=""
            onChange={e => {
              if (!e.target.value) return;
              const targetStatus = e.target.value;
              [...selectedOrderIds].forEach(id => updateOrder.mutate({ id, data: { status: targetStatus } }));
              showToast('Bulk Update', `${selectedOrderIds.size} orders moved to ${STATUS_CONFIG[targetStatus]?.label}`, 'success');
              setSelectedOrderIds(new Set());
              e.target.value = '';
            }}
          >
            <option value="">Move to status…</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <select
            style={{ background: '#333', color: 'white', border: '1px solid #444', borderRadius: 6, padding: '4px 10px', fontSize: 13 }}
            defaultValue=""
            onChange={e => {
              if (!e.target.value) return;
              const editorId = e.target.value;
              [...selectedOrderIds].forEach(id => updateOrder.mutate({ id, data: { assignedEditorId: editorId } }));
              const ed = (editors as any[]).find((ed: any) => ed.id === editorId);
              showToast('Bulk Assign', `${selectedOrderIds.size} orders → ${ed?.firstName || 'editor'}`, 'success');
              setSelectedOrderIds(new Set());
              e.target.value = '';
            }}
          >
            <option value="">Assign editor…</option>
            {(editors as any[]).map((ed: any) => (
              <option key={ed.id} value={ed.id}>{ed.firstName} {ed.lastName}</option>
            ))}
          </select>
          <button onClick={() => setSelectedOrderIds(new Set())} style={{ background: 'transparent', color: '#aaa', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            Clear
          </button>
        </div>
      )}

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
};
