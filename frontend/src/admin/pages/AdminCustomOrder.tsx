import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers, useCreateOrder } from '../hooks/useAdminData';
import { Check, Copy, Search } from 'lucide-react';

export const AdminCustomOrder: React.FC = () => {
  const navigate = useNavigate();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const createOrderMutation = useCreateOrder();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [targetQuery, setTargetQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [requirements, setRequirements] = useState('');
  const [filesHint, setFilesHint] = useState('');
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    title: '',
    serviceType: 'photo_editing',
    volume: 1,
    priority: 'medium',
    status: 'new',
    basePrice: 0,
    totalPrice: 0,
    expectedCompletion: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const customerLink = useMemo(
    () => createdOrder ? `${window.location.origin}/order?id=${encodeURIComponent(createdOrder.id)}` : '',
    [createdOrder]
  );
  const filteredCustomers = useMemo(() => {
    const q = targetQuery.trim().toLowerCase();
    if (!q) return [];
    return (customers || []).filter((customer: any) => {
      const customerCode = customer?.customerNumber ? `clt${String(customer.customerNumber).padStart(3, '0')}` : '';
      const guestId = customer?.isGuest ? customer?.id?.toLowerCase?.() : '';
      const email = String(customer?.email || customer?.contactEmail || '').toLowerCase();
      const id = String(customer?.id || '').toLowerCase();
      return id === q || guestId === q || email === q || customerCode === q;
    }).slice(0, 12);
  }, [customers, targetQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer?.id || !formData.title) return;

    setIsSubmitting(true);
    try {
      const response: any = await createOrderMutation.mutateAsync({ ...formData, customerId: selectedCustomer.id });
      const order = response?.data || response;
      setCreatedOrder(order);
      setStep(4);
    } catch (error) {
      console.error('Failed to create order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'volume' || name === 'basePrice' || name === 'totalPrice' ? Number(value) : value,
    }));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Custom Order</h1>
        <p className="text-gray-500">Manually create a new order for an existing customer.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#666]">
          <span className={step >= 1 ? 'text-black' : ''}>1. Target</span>
          <span>•</span>
          <span className={step >= 2 ? 'text-black' : ''}>2. Order</span>
          <span>•</span>
          <span className={step >= 3 ? 'text-black' : ''}>3. Review</span>
          <span>•</span>
          <span className={step >= 4 ? 'text-black' : ''}>4. Share</span>
        </div>
        {step === 1 && (
          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-700">Select target by Customer ID / Guest ID / Email</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
              <input value={targetQuery} onChange={(e) => setTargetQuery(e.target.value)} placeholder="e.g. CLT113 / cmp... / guest@email" className="w-full h-11 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl" />
            </div>
            <div className="max-h-64 overflow-auto rounded-xl border border-gray-100">
              {customersLoading && <div className="p-3 text-xs text-[#777]">Loading customers…</div>}
              {!customersLoading && filteredCustomers.map((customer: any) => (
                <button key={customer.id} type="button" onClick={() => { setSelectedCustomer(customer); setFormData((prev) => ({ ...prev, customerId: customer.id })); }} className={`w-full border-b border-gray-100 p-3 text-left text-sm last:border-b-0 ${selectedCustomer?.id === customer.id ? 'bg-black/[0.04]' : 'hover:bg-black/[0.04]'}`}>
                  <div className="font-semibold">{customer.name || customer.companyName || 'Guest User'} {customer.customerNumber ? `(CLT${String(customer.customerNumber).padStart(3, '0')})` : ''}</div>
                  <div className="text-xs text-[#666]">{customer.isGuest ? 'Guest' : 'Registered'} • {customer.id}</div>
                  <div className="text-xs text-[#666]">{customer.email || customer.contactEmail || 'No email'}</div>
                </button>
              ))}
              {!customersLoading && targetQuery.trim() && filteredCustomers.length === 0 && <div className="p-3 text-xs text-[#777]">No exact match found.</div>}
            </div>
          </div>
        )}
        {step !== 1 && step !== 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Customer</label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={handleInputChange}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              required
            >
              <option value="">Select a customer</option>
              {customers?.map((customer: any) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
            {customersLoading && <p className="text-xs text-gray-400">Loading customers...</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Project Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Summer Fashion Shoot"
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Service Type</label>
            <select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleInputChange}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            >
              <option value="photo_editing">Photo Editing</option>
              <option value="video_editing">Video Editing</option>
              <option value="graphic_design">Graphic Design</option>
              <option value="3d_rendering">3D Rendering</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Volume (Images/Videos)</label>
            <input
              type="number"
              name="volume"
              value={formData.volume}
              onChange={handleInputChange}
              min="1"
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Initial Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            >
              <option value="new">Pending</option>
              <option value="in_progress">Editing</option>
              <option value="ready_qc">QA</option>
              <option value="revision_needed">Revision</option>
              <option value="completed">Delivered</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Total Price ($)</label>
            <input
              type="number"
              name="totalPrice"
              value={formData.totalPrice}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Expected Completion</label>
            <input
              type="date"
              name="expectedCompletion"
              value={formData.expectedCompletion}
              onChange={handleInputChange}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>
        </div>
        )}
        {step === 2 && (
          <div className="grid grid-cols-1 gap-4">
            <textarea name="requirements" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Detailed requirements" className="w-full min-h-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" />
            <textarea value={filesHint} onChange={(e) => setFilesHint(e.target.value)} placeholder="Files/drive links for the team/customer" className="w-full min-h-20 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" />
          </div>
        )}
        {step === 3 && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm space-y-1">
            <div><b>Target:</b> {selectedCustomer?.name || selectedCustomer?.companyName || selectedCustomer?.email}</div>
            <div><b>Title:</b> {formData.title || '-'}</div><div><b>Service:</b> {formData.serviceType}</div><div><b>Volume:</b> {formData.volume}</div>
            <div><b>Priority:</b> {formData.priority}</div><div><b>Status:</b> {formData.status}</div>
          </div>
        )}
        {step === 4 && createdOrder && (
          <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><Check size={16} /> Order created: {createdOrder.code || createdOrder.id}</div>
            <div className="text-xs text-[#444] break-all">{customerLink}</div>
            <button type="button" onClick={() => navigator.clipboard.writeText(customerLink)} className="inline-flex items-center gap-2 rounded-full border border-black/[0.18] bg-white px-4 py-2 text-xs font-semibold"><Copy size={13} /> Copy customer link</button>
            <button type="button" onClick={() => navigate(`/admin/chats?customerId=${encodeURIComponent(selectedCustomer?.id || '')}&orderId=${encodeURIComponent(createdOrder?.id || '')}`)} className="ml-2 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">Send Order Card in Chat</button>
          </div>
        )}

        <div className="pt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/production')}
            className="px-6 h-12 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          {step > 1 && step < 4 && <button type="button" onClick={() => setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4))} className="px-5 h-12 rounded-xl text-sm font-bold text-gray-600">Back</button>}
          {step < 3 && <button type="button" disabled={step === 1 && !selectedCustomer} onClick={() => setStep((s) => (Math.min(3, s + 1) as 1 | 2 | 3 | 4))} className="px-8 h-12 bg-black text-white rounded-xl text-sm font-bold disabled:opacity-50">Next</button>}
          {step === 3 && <button type="submit" disabled={isSubmitting || !selectedCustomer || !formData.title} className="px-8 h-12 bg-black text-white rounded-xl text-sm font-bold disabled:opacity-50">{isSubmitting ? 'Creating...' : 'Create Order'}</button>}
        </div>
      </form>
    </div>
  );
};

export default AdminCustomOrder;
