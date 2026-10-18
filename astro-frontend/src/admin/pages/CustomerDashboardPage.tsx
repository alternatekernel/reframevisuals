import React from 'react';
import { Package, Clock, DollarSign, Download, Upload } from 'lucide-react';

const colors = {
  bgPrimary: '#FFFFFF', bgSecondary: '#F7F7F5', bgTertiary: '#EFEFEF',
  textPrimary: '#37352F', textSecondary: '#787774', textTertiary: '#9B9A97',
  borderLight: '#E9E9E8', accentGreen: '#007A5A', accentBlue: '#0066FF',
};

export const CustomerDashboardPage: React.FC = () => {
  const customer = {
    name: 'Nike Retail Inc.',
    tier: 'Enterprise',
    email: 'john@nike.com',
    activeOrders: 3,
    completedOrders: 124,
    outstandingInvoices: 2,
  };

  const orders = [
    { id: '1', code: 'OD-2024-1201', title: 'Winter Collection Shoot', volume: 24, status: 'in_progress', progress: 65, delivery: '2026-03-26' },
    { id: '2', code: 'OD-2024-1198', title: 'Accessories Batch #47', volume: 12, status: 'qc_review', progress: 90, delivery: '2026-03-25' },
    { id: '3', code: 'OD-2024-1195', title: 'Lifestyle Products', volume: 36, status: 'completed', progress: 100, delivery: '2026-03-24' },
  ];

  const invoices = [
    { id: '1', code: 'INV-2024-001', amount: 2070, status: 'paid', due: '2026-03-15' },
    { id: '2', code: 'INV-2024-002', amount: 1840, status: 'pending', due: '2026-03-29' },
  ];

  return (
    <div className="mx-auto max-w-[1400px] p-3 sm:p-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>Customer Dashboard</h1>
          <p className="text-[14px]" style={{ color: colors.textTertiary }}>{customer.name} • {customer.tier}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button className="flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-[15px] font-medium" style={{ borderColor: colors.borderLight, color: colors.textPrimary }}><Upload size={14} /> Upload RAW</button>
          <button className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-[15px] font-medium" style={{ background: colors.textPrimary, color: '#FFF' }}>New Order</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2 mb-2"><Package size={16} style={{ color: colors.textSecondary }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Active Orders</span></div>
          <div className="text-[24px] font-semibold" style={{ color: colors.textPrimary }}>{customer.activeOrders}</div>
        </div>
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2 mb-2"><Clock size={16} style={{ color: colors.textSecondary }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Completed</span></div>
          <div className="text-[24px] font-semibold" style={{ color: colors.textPrimary }}>{customer.completedOrders}</div>
        </div>
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2 mb-2"><DollarSign size={16} style={{ color: colors.textSecondary }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Outstanding</span></div>
          <div className="text-[24px] font-semibold" style={{ color: colors.textPrimary }}>{customer.outstandingInvoices}</div>
        </div>
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}>
          <div className="flex items-center gap-2 mb-2"><Download size={16} style={{ color: colors.textSecondary }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Storage Used</span></div>
          <div className="text-[24px] font-semibold" style={{ color: colors.textPrimary }}>2.4 GB</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {/* Active Orders */}
        <div className="rounded-md border overflow-hidden xl:col-span-2" style={{ borderColor: colors.borderLight, background: colors.bgPrimary }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: colors.borderLight }}>
            <h3 className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>Active Orders</h3>
          </div>
          <div className="divide-y" style={{ borderColor: colors.borderLight }}>
            {orders.map(order => (
              <div key={order.id} className="px-4 py-3">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[15px] font-medium" style={{ color: colors.textPrimary }}>{order.code}</div>
                    <div className="text-[14px]" style={{ color: colors.textTertiary }}>{order.title} • {order.volume} images</div>
                  </div>
                  <span className={`text-[14px] px-2 py-1 rounded capitalize ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'qc_review' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{order.status.replace('_', ' ')}</span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${order.progress}%`, background: colors.accentBlue }} />
                  </div>
                  <span className="text-[14px]" style={{ color: colors.textTertiary }}>{order.progress}%</span>
                  <span className="text-[14px]" style={{ color: colors.textSecondary }}>Due: {order.delivery}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded-md border overflow-hidden" style={{ borderColor: colors.borderLight, background: colors.bgPrimary }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: colors.borderLight }}>
            <h3 className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>Recent Invoices</h3>
          </div>
          <div className="divide-y" style={{ borderColor: colors.borderLight }}>
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="text-[14px] font-medium" style={{ color: colors.textPrimary }}>{inv.code}</div>
                  <div className="text-[14px]" style={{ color: colors.textTertiary }}>Due: {inv.due}</div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>${inv.amount}</div>
                  <span className={`text-[14px] px-1.5 py-0.5 rounded capitalize ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
