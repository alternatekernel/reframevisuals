import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MoreHorizontal, Star, RefreshCw, Plus, Clock, User, Package, AlertCircle } from 'lucide-react';
import { cx } from '../../utils/theme';
import { adminFetch } from '../utils/api';
import { usePageVisibility } from '../../hooks/usePageVisibility';

interface KanbanCard {
  id: string;
  code: string;
  title: string;
  volume: number;
  serviceType: string;
  priority: string;
  createdAt: string;
  customer: string;
  isGuest: boolean;
  assignedEditor: string | null;
  expectedCompletion: string | null;
}

interface KanbanColumn {
  id: string;
  title: string;
  count: number;
  cards: KanbanCard[];
}

interface KanbanData {
  new_review: KanbanColumn;
  inProgress: KanbanColumn;
  readyQC: KanbanColumn;
  revision_needed: KanbanColumn;
  completed: KanbanColumn;
}

interface DragState {
  cardId: string;
  sourceColumnId: string;
}

const getColumnColor = (columnId: string) => {
  switch (columnId) {
    case 'new_review': return 'var(--admin-blue)';
    case 'in_progress': return 'var(--admin-purple)';
    case 'ready_qc': return 'var(--admin-accent)';
    case 'revision_needed': return 'var(--admin-red)';
    case 'completed': return 'var(--admin-green)';
    default: return 'var(--admin-text-3)';
  }
};

const OrderCard = React.memo(({ card, onDragStart }: { card: KanbanCard; onDragStart: () => void }) => {
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }, []);

  const isExpress = card.serviceType.toLowerCase() === 'express';
  const isHighPriority = card.priority.toLowerCase() === 'high';

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl p-3.5 hover:border-[var(--admin-border-2)] hover:bg-[var(--admin-surface-2)] transition-all group cursor-grab active:cursor-grabbing shadow-lg shadow-black/10 select-none">
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-[var(--admin-font-mono)] font-bold text-[var(--admin-text-3)] bg-[var(--admin-surface-3)] px-1.5 py-0.5 rounded uppercase tracking-wider">
              {card.code}
            </span>
            {card.isGuest && (
              <span className="text-[10px] font-bold text-[var(--admin-accent)] bg-[var(--admin-accent-dim)] px-1.5 py-0.5 rounded uppercase tracking-wider border border-[var(--admin-accent)]/20">
                GUEST
              </span>
            )}
            {isHighPriority && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--admin-red-dim)] text-[var(--admin-red)] text-[9px] font-bold uppercase">
                <Star size={8} className="fill-current" />
                Priority
              </div>
            )}
          </div>
          <h3 className="text-[14px] font-[var(--admin-font-display)] font-bold text-[var(--admin-text)] leading-tight line-clamp-2">
            {card.title}
          </h3>
        </div>
        <button className="p-1 text-[var(--admin-text-3)] hover:text-[var(--admin-text)] transition-colors opacity-0 group-hover:opacity-100">
           <MoreHorizontal size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--admin-text-3)] font-medium">
          <Package size={12} className="opacity-60" />
          {card.volume} images
        </div>
        <div className={cx(
          "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide justify-end",
          isExpress ? "text-[var(--admin-red)]" : "text-[var(--admin-text-2)]"
        )}>
          {card.serviceType}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--admin-border)]">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--admin-text-2)] font-semibold">
          <User size={12} className="text-[var(--admin-text-3)]" />
          {card.assignedEditor || 'Unassigned'}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-[var(--admin-font-mono)] text-[var(--admin-text-3)]">
          <Clock size={10} />
          {formatDate(card.expectedCompletion)}
        </div>
      </div>
    </div>
  );
});

export const ProductionKanban: React.FC = () => {
  const [data, setData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ customer: '', serviceType: '', priority: '' });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const dragLeaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchKanban = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter.customer) params.append('customer', filter.customer);
      if (filter.serviceType) params.append('serviceType', filter.serviceType);
      if (filter.priority) params.append('priority', filter.priority);

      const result = await adminFetch(`/kanban?${params}`);
      setData(result);
    } catch (err) {
      console.error('Error fetching kanban:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const isVisible = usePageVisibility();

  useEffect(() => {
    fetchKanban();
    
    // Only poll when the page is visible to reduce server overhead
    if (!isVisible) return;
    
    const interval = setInterval(fetchKanban, 30000);
    return () => clearInterval(interval);
  }, [fetchKanban, isVisible]);

  const columns = useMemo(() =>
    data ? [data.new_review, data.inProgress, data.readyQC, data.completed, data.revision_needed].filter(Boolean) : [],
    [data]
  );

  const handleDrop = useCallback(async (targetColumnId: string) => {
    if (dragLeaveTimeoutRef.current) clearTimeout(dragLeaveTimeoutRef.current);
    setDragOverColumnId(null);
    if (!dragState || dragState.sourceColumnId === targetColumnId) { setDragState(null); return; }
    const cardId = dragState.cardId;
    setDragState(null);
    try {
      await adminFetch(`/orders/${cardId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetColumnId }),
      });
      fetchKanban();
    } catch (err: any) {
      const msg = err.message || 'Failed to update order status';
      setUpdateError(msg);
      setTimeout(() => setUpdateError(null), 5000);
    }
  }, [dragState, fetchKanban]);

  if (loading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="shrink-0 w-[300px] h-[600px] bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-1 bg-[var(--admin-surface-2)] border border-[var(--admin-border)] rounded-xl w-fit">
        <select
          value={filter.serviceType}
          onChange={(e) => setFilter({ ...filter, serviceType: e.target.value })}
          className="bg-transparent text-[12px] font-bold text-[var(--admin-text-2)] px-3 py-1.5 focus:outline-none cursor-pointer hover:text-[var(--admin-text)] transition-colors"
        >
          <option value="">SERVICE: ALL</option>
          <option value="standard">STANDARD</option>
          <option value="premium">PREMIUM</option>
          <option value="express">EXPRESS</option>
        </select>
        <div className="w-px h-4 bg-[var(--admin-border)]" />
        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          className="bg-transparent text-[12px] font-bold text-[var(--admin-text-2)] px-3 py-1.5 focus:outline-none cursor-pointer hover:text-[var(--admin-text)] transition-colors"
        >
          <option value="">PRIORITY: ALL</option>
          <option value="high">HIGH</option>
          <option value="medium">MEDIUM</option>
          <option value="low">LOW</option>
        </select>
        <div className="w-px h-4 bg-[var(--admin-border)]" />
        <button 
          onClick={fetchKanban}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-[var(--admin-text-3)] hover:text-[var(--admin-accent)] transition-colors"
        >
          <RefreshCw size={12} />
          SYNC
        </button>
      </div>

      {updateError && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--admin-red-dim)] border border-[var(--admin-red)]/30 rounded-xl text-[12px] font-medium text-[var(--admin-red)]">
          <AlertCircle size={14} />
          {updateError}
        </div>
      )}

      <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
        {columns.map((column) => {
          const colColor = getColumnColor(column.id);
          const isDropTarget = dragOverColumnId === column.id && dragState?.sourceColumnId !== column.id;
          return (
            <div
              key={column.id}
              className="shrink-0 w-[300px] flex flex-col snap-start group/col"
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragLeaveTimeoutRef.current) clearTimeout(dragLeaveTimeoutRef.current); setDragOverColumnId(column.id); }}
              onDragLeave={() => { dragLeaveTimeoutRef.current = setTimeout(() => setDragOverColumnId(null), 80); }}
              onDrop={() => handleDrop(column.id)}
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: colColor, color: colColor }} />
                  <h3 className="text-[14px] font-[var(--admin-font-display)] font-extrabold text-[var(--admin-text)] uppercase tracking-tight">{column.title}</h3>
                </div>
                <span className="text-[11px] font-[var(--admin-font-mono)] text-[var(--admin-text-3)] font-bold bg-[var(--admin-surface-2)] px-2 py-0.5 rounded-full border border-[var(--admin-border)]">
                  {column.count}
                </span>
              </div>

              <div className={cx(
                "flex-1 space-y-3 min-h-[500px] p-2 rounded-2xl border transition-all",
                isDropTarget
                  ? "bg-[var(--admin-accent-dim)] border-[var(--admin-accent)] border-dashed"
                  : "bg-[var(--admin-surface-2)]/30 border-transparent group-hover/col:border-[var(--admin-border)] group-hover/col:bg-[var(--admin-surface-2)]/50"
              )}>
                {column.cards.map((card) => (
                  <OrderCard
                    key={card.id}
                    card={card}
                    onDragStart={() => setDragState({ cardId: card.id, sourceColumnId: column.id })}
                  />
                ))}

                {column.id !== 'completed' && (
                  <button className="w-full py-3 border-2 border-dashed border-[var(--admin-border)] rounded-xl text-[12px] font-bold text-[var(--admin-text-3)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent)] hover:bg-[var(--admin-accent-dim)] transition-all flex items-center justify-center gap-2 mt-4">
                    <Plus size={14} />
                    Push Order
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
