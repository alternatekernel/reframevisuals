import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '../utils/api';
import { Mail, Phone, Clock, Search, Filter, Trash2, Eye, Calculator } from 'lucide-react';
import { cx } from '../../utils/theme';
import { useToast } from '../ToastContext';

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  services: string; // JSON string
  turnaround: string;
  quantity: number;
  basePrice: number;
  volumeDiscount: number;
  turnaroundMultiplier: number;
  estimatedPrice: number;
  status: 'pending' | 'reviewed' | 'contacted' | 'converted' | 'lost';
  adminNotes?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  reviewed: { label: 'Reviewed', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  contacted: { label: 'Contacted', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  converted: { label: 'Converted', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  lost: { label: 'Lost', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const QuoteRequestsPage = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const result = await adminFetch<{ data: QuoteRequest[] }>('/quote/requests');
      setRequests(result.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showToast('Error', 'Failed to load quote requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminFetch(`/quote/requests/${id}`, {
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
    if (!confirm('Are you sure you want to delete this quote request?')) return;

    try {
      await adminFetch(`/quote/requests/${id}`, { method: 'DELETE' });
      showToast('Deleted', 'Quote request removed', 'success');
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const parseServices = (servicesJson: string) => {
    try {
      return JSON.parse(servicesJson);
    } catch {
      return [];
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const totalValue = requests.reduce((sum, r) => sum + r.estimatedPrice, 0);
  const convertedValue = requests.filter(r => r.status === 'converted').reduce((sum, r) => sum + r.estimatedPrice, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Pricing Breakdown</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pendingCount > 0 ? `${pendingCount} pending` : 'No pending requests'} · Total: {formatPrice(totalValue)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500 uppercase">Converted Value</p>
              <p className="text-xl font-black text-emerald-600">{formatPrice(convertedValue)}</p>
            </div>
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
            <option value="reviewed">Reviewed</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
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
                <Calculator size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No quote requests found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Requests will appear here'}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Services</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Turnaround</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Quantity</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Est. Price</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Created</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((req) => {
                  const services = parseServices(req.services);
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
                          <span className="text-sm text-gray-700">{services.length} service{services.length !== 1 ? 's' : ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock size={14} className="text-gray-400" />
                          {req.turnaround}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900">{req.quantity}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-brand">{formatPrice(req.estimatedPrice)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cx(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                          STATUS_CONFIG[req.status].color
                        )}>
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
          <div className="w-[480px] border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Quote Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Mail size={18} className="text-gray-400" />
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

                {selectedRequest.phone && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Phone
                    </label>
                    <a
                      href={`tel:${selectedRequest.phone}`}
                      className="text-brand hover:underline flex items-center gap-1"
                    >
                      <Phone size={14} />
                      {selectedRequest.phone}
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Company
                  </label>
                  <p className="text-gray-900 font-medium">{selectedRequest.company}</p>
                </div>
              </div>

              {/* Quote Details */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quote Summary</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Price</span>
                    <span className="font-bold text-gray-900">{formatPrice(selectedRequest.basePrice)}</span>
                  </div>
                  
                  {selectedRequest.turnaroundMultiplier !== 1.0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Turnaround ({selectedRequest.turnaround})</span>
                      <span className="font-bold text-gray-900">×{selectedRequest.turnaroundMultiplier}</span>
                    </div>
                  )}
                  
                  {selectedRequest.volumeDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Volume Discount</span>
                      <span className="font-bold text-emerald-600">-{selectedRequest.volumeDiscount * 100}%</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Total</span>
                      <span className="text-lg font-black text-brand">{formatPrice(selectedRequest.estimatedPrice)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 pt-2">
                    <span>Quantity: {selectedRequest.quantity} images</span>
                    <span>{formatPrice(selectedRequest.estimatedPrice / selectedRequest.quantity)} / image</span>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Selected Services
                </label>
                <div className="space-y-2">
                  {parseServices(selectedRequest.services).map((svc: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{svc.serviceName}</p>
                        <p className="text-xs text-gray-500">Complexity: {svc.complexity}</p>
                      </div>
                      <span className="text-sm font-black text-gray-900">{formatPrice(svc.unitPrice)}</span>
                    </div>
                  ))}
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

export default QuoteRequestsPage;
