import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MoreHorizontal, RefreshCw, CheckCircle2, Circle, Clock, X, AlertCircle } from 'lucide-react';
import { adminFetch } from '../utils/api';


interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignees?: string;
  labels?: string;
  dueDate?: string;
  createdAt: string;
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high': return 'var(--admin-red)';
    case 'medium': return 'var(--admin-accent)';
    case 'low': return 'var(--admin-blue)';
    default: return 'var(--admin-text-3)';
  }
};

const TaskCard: React.FC<{ task: Task; onMove: (id: string, status: string) => void }> = ({ task, onMove }) => {
  const labels: string[] = (() => { try { return task.labels ? JSON.parse(task.labels) : []; } catch { return []; } })();
  const priColor = getPriorityColor(task.priority);

  return (
    <div className="group relative bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-4 mb-3 hover:border-[var(--admin-border-2)] hover:bg-[var(--admin-surface-2)] transition-all shadow-lg shadow-black/10 cursor-grab active:cursor-grabbing">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: priColor, color: priColor }} />
             <span className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">{task.priority}</span>
          </div>
          <h4 className="text-[15px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] leading-tight tracking-tight">{task.title}</h4>
        </div>
        <button className="p-1 rounded-lg text-[var(--admin-text-3)] hover:text-[var(--admin-text)] transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {task.description && (
        <p className="text-[13px] text-[var(--admin-text-3)] font-medium mb-4 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {labels.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {labels.map((label: string, i: number) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[10px] font-bold text-[var(--admin-text-2)] uppercase tracking-tighter">
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-[var(--admin-border)]">
        <div className="flex items-center gap-2">
           {task.dueDate && (
             <div className="flex items-center gap-1.5 text-[11px] font-[var(--admin-font-mono)] text-[var(--admin-text-3)]">
               <Clock size={12} className="opacity-60" />
               {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
             </div>
           )}
        </div>
        <div className="flex items-center gap-1 bg-[var(--admin-surface-2)] border border-[var(--admin-border)] rounded-lg px-2 py-1">
          <select
            value={task.status}
            onChange={(e) => onMove(task.id, e.target.value)}
            className="bg-transparent text-[11px] font-bold text-[var(--admin-text-2)] focus:outline-none cursor-pointer uppercase tracking-tighter"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export const TaskBoardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ priority: 'all', assignee: '' });
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', dueDate: '', labels: '' });

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter.priority !== 'all') params.append('priority', filter.priority);
      const data = await adminFetch(`/tasks?${params}`);
      setTasks(data.tasks || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    try {
      await adminFetch(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCreateTask = async () => {
    try {
      await adminFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...newTask,
          labels: newTask.labels ? newTask.labels.split(',').map((l: string) => l.trim()) : [],
        }),
      });
      setShowNewTask(false);
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', labels: '' });
      fetchTasks();
    } catch (e: any) {
      console.error(e);
    }
  };

  const columns = [
    { id: 'todo', title: 'Operational Backlog', icon: <Circle size={14} />, color: 'var(--admin-blue)' },
    { id: 'in_progress', title: 'Active Processing', icon: <Clock size={14} />, color: 'var(--admin-accent)' },
    { id: 'review', title: 'Quality Assurance', icon: <AlertCircle size={14} />, color: 'var(--admin-purple)' },
    { id: 'done', title: 'Deployment Success', icon: <CheckCircle2 size={14} />, color: 'var(--admin-green)' },
  ];

  if (loading && tasks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--admin-bg)]">
        <RefreshCw className="animate-spin text-[var(--admin-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      
      {/* Header Snippet with Actions */}
      <div className="flex items-end justify-between px-2">
        <div className="flex items-center gap-4 bg-[var(--admin-surface-2)] border border-[var(--admin-border)] p-1 rounded-2xl">
          <select
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            className="bg-transparent text-[11px] font-black text-[var(--admin-text-3)] px-4 py-2 focus:outline-none cursor-pointer hover:text-[var(--admin-text)] transition-colors uppercase tracking-[0.1em]"
          >
            <option value="all">PRIORITY: ALL STREAMS</option>
            <option value="high">RANK: CRITICAL</option>
            <option value="medium">RANK: STANDARD</option>
            <option value="low">RANK: MINOR</option>
          </select>
          <div className="w-px h-6 bg-[var(--admin-border)]" />
          <button 
            onClick={fetchTasks}
            className="flex items-center gap-2 px-4 py-2 text-[11px] font-black text-[var(--admin-text-3)] hover:text-[var(--admin-accent)] transition-colors uppercase tracking-[0.1em]"
          >
            <RefreshCw size={14} />
            SYNC BOARD
          </button>
        </div>

        <button
          onClick={() => setShowNewTask(!showNewTask)}
          className="px-6 py-2.5 bg-[var(--admin-accent)] text-black rounded-xl text-[13px] font-black flex items-center gap-2 shadow-[0_0_20px_rgba(232,148,58,0.2)] hover:shadow-[0_0_25px_rgba(232,148,58,0.4)] transition-all active:scale-95 uppercase tracking-tighter"
        >
          <Plus size={18} strokeWidth={3} />
          Deploy Task
        </button>
      </div>

      {/* New Task Command Center */}
      {showNewTask && (
        <div className="p-8 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.4)] animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--admin-border)]">
             <h3 className="text-[18px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] uppercase tracking-tight">Transmission Configuration</h3>
             <button onClick={() => setShowNewTask(false)} className="p-2 hover:bg-[var(--admin-surface-2)] rounded-full transition-colors"><X size={20} className="text-[var(--admin-text-3)]" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest pl-1">Primary Objective</label>
                <input
                  type="text"
                  placeholder="Identify mission target..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-xl bg-[var(--admin-surface-2)] border border-[var(--admin-border)] text-[15px] font-bold text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent)]/20 transition-all placeholder:text-[var(--admin-text-3)]/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest pl-1">Timeline Restriction</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-xl bg-[var(--admin-surface-2)] border border-[var(--admin-border)] text-[14px] font-black text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent)]/20 transition-all"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
            <div className="space-y-6">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest pl-1">Objective Detail</label>
                <textarea
                  placeholder="Define the scope of operational impact..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-xl bg-[var(--admin-surface-2)] border border-[var(--admin-border)] text-[14px] font-medium text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent)]/20 transition-all h-[135px] resize-none placeholder:text-[var(--admin-text-3)]/30"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 mb-8">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest pl-1">Threat Classification</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-5 py-3.5 rounded-xl bg-[var(--admin-surface-2)] border border-[var(--admin-border)] text-[14px] font-black text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent)]/20 transition-all appearance-none cursor-pointer uppercase tracking-tighter"
              >
                <option value="low">RANK: MINOR</option>
                <option value="medium">RANK: STANDARD</option>
                <option value="high">RANK: CRITICAL</option>
              </select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest pl-1">Tags (Comma Separated)</label>
              <input
                type="text"
                placeholder="MARKETING, FINANCE, DEV..."
                value={newTask.labels}
                onChange={(e) => setNewTask({ ...newTask, labels: e.target.value })}
                className="w-full px-5 py-3.5 rounded-xl bg-[var(--admin-surface-2)] border border-[var(--admin-border)] text-[14px] font-black text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent)]/20 transition-all placeholder:text-[var(--admin-text-3)]/30"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <button onClick={() => setShowNewTask(false)} className="px-8 py-3 text-[13px] font-black text-[var(--admin-text-3)] hover:text-[var(--admin-red)] transition-colors uppercase tracking-widest">Abort</button>
            <button onClick={handleCreateTask} className="px-10 py-3 bg-[var(--admin-accent)] text-black rounded-xl text-[14px] font-black shadow-[0_0_20px_var(--admin-accent)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-tighter">Execute Deployment</button>
          </div>
        </div>
      )}

      {/* Kanban Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {columns.map((col) => {
          const colTasks = tasks.filter((t: any) => t.status === col.id);
          return (
            <div key={col.id} className="flex flex-col group/col min-w-[300px]">
              <div className="flex items-center justify-between mb-5 px-3">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: col.color, color: col.color }} />
                  <h3 className="text-[14px] font-[var(--admin-font-display)] font-extrabold text-[var(--admin-text)] uppercase tracking-tight">{col.title}</h3>
                </div>
                <span className="text-[11px] font-[var(--admin-font-mono)] text-[var(--admin-text-3)] font-black bg-[var(--admin-surface-2)] px-2.5 py-1 rounded-full border border-[var(--admin-border)] shadow-sm">
                  {colTasks.length}
                </span>
              </div>
              
              <div className="flex-1 space-y-4 p-2 min-h-[500px] bg-[var(--admin-surface-2)]/30 rounded-3xl border border-dashed border-[var(--admin-border)] transition-all group-hover/col:border-solid group-hover/col:border-[var(--admin-border-2)] group-hover/col:bg-[var(--admin-surface-2)]/50">
                {colTasks.map((task: any) => (
                  <TaskCard key={task.id} task={task} onMove={handleMoveTask} />
                ))}
                
                <button
                  onClick={() => setShowNewTask(true)}
                  className="w-full py-4 border-2 border-dashed border-[var(--admin-border)] rounded-2xl text-[12px] font-black text-[var(--admin-text-3)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent)] hover:bg-[var(--admin-accent-dim)] transition-all flex items-center justify-center gap-2 mt-4 opacity-40 hover:opacity-100 uppercase tracking-widest"
                >
                  <Plus size={16} />
                  Initiate Task
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
