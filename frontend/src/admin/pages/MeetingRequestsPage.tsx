import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '../utils/api';
import { Mail, Building2, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, Trash2, Eye } from 'lucide-react';
import { cx } from '../../utils/theme';
import { useToast } from '../ToastContext';

interface MeetingRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  status: 'pending' | 'contacted' | 'confirmed' | 'completed' | 'cancelled';
  scheduledAt?: string;
  adminNotes?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle },
  contacted: { label: 'Contacted', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Mail },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

const MeetingRequestsPage = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<MeetingRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const result = await adminFetch<{ data: MeetingRequest[] }>('/meeting/requests');
      setRequests(result.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showToast('Error', 'Failed to load meeting requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminFetch(`/meeting/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast('Status updated', `Moved to ${status}`, 'success');
      fetchRequests();
      if (selectedRequest?.id === id) {
        setSelectedRequest({ ...selectedRequest, status: status as any });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Error', 'Failed to update status', 'error');
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting request?')) return;

    try {
      await adminFetch(`/meeting/requests/${id}`, { method: 'DELETE' });
      showToast('Deleted', 'Meeting request removed', 'success');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error deleting request:', error);
      showToast('Error', 'Failed to delete request', 'error');
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = search === '' ||
      req.name.toLowerCase().includes(search.toLowerCase()) ||
      req.email.toLowerCase().includes(search.toLowerCase()) ||
      req.company.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meeting Requests</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pendingCount > 0 ? `${pendingCount} pending request${pendingCount !== 1 ? 's' : ''}` : 'No pending requests'}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/30 focus:ring-1 focus:ring-brand/10"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/30 focus:ring-1 focus:ring-brand/10"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Requests List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Mail size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No meeting requests found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Requests will appear here'}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Company</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Created</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((req) => {
                  const StatusIcon = STATUS_CONFIG[req.status].icon;
                  return (
                    <tr
                      key={req.id}
                      className={cx(
                        'hover:bg-gray-50 cursor-pointer transition-colors',
                        selectedRequest?.id === req.id && 'bg-brand/5'
                      )}
                      onClick={() => setSelectedRequest(req)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{req.name}</p>
                          <p className="text-sm text-gray-500">{req.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-gray-400" />
                          <span className="text-gray-700">{req.company}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cx(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                          STATUS_CONFIG[req.status].color
                        )}>
                          <StatusIcon size={12} />
                          {STATUS_CONFIG[req.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock size={14} />
                          {formatDate(req.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(req);
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye size={16} className="text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selectedRequest && (
          <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={18} className="text-gray-400" />
                </button>
              </div>

              {/* Status */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={selectedRequest.status}
                  onChange={(e) => updateStatus(selectedRequest.id, e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/30 focus:ring-1 focus:ring-brand/10"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* Contact Info */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Name
                  </label>
                  <p className="text-gray-900 font-medium">{selectedRequest.name}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <a
                    href={`mailto:${selectedRequest.email}`}
                    className="text-brand hover:underline flex items-center gap-1"
                  >
                    <Mail size={14} />
                    {selectedRequest.email}
                  </a>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Company
                  </label>
                  <p className="text-gray-900 font-medium">{selectedRequest.company}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Created
                  </label>
                  <p className="text-gray-700">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Message
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedRequest.message}</p>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={selectedRequest.adminNotes || ''}
                  onChange={(e) => {
                    setSelectedRequest({ ...selectedRequest, adminNotes: e.target.value });
                  }}
                  placeholder="Add internal notes..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/30 min-h-[100px] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <a
                  href={`mailto:${selectedRequest.email}`}
                  className="w-full px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail size={14} />
                  Send Email
                </a>
                <button
                  onClick={() => deleteRequest(selectedRequest.id)}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingRequestsPage;
