import { layout } from '../../utils/theme';
import { CreditCard, ShieldCheck, FileText } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { motion } from 'framer-motion';

const BillingView = () => {
  const { billingProfile, isLoading } = useDashboard();
  const defaultPaymentMethod = billingProfile?.paymentMethods.find((pm) => pm.isDefault) || billingProfile?.paymentMethods[0];

  if (isLoading && !billingProfile) {
    return (
      <div className={`${layout.compactShell} px-4 sm:px-6 xl:px-8`}>
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-black/5 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-black/40">Loading your billing profile...</p>
        </div>
      </div>
    );
  }

  const usageConsumed = billingProfile?.usage?.consumed;
  const usageQuota = billingProfile?.usage?.quota;
  const usagePercent = typeof usageConsumed === 'number' && typeof usageQuota === 'number' && usageQuota > 0
    ? Math.min((usageConsumed / usageQuota) * 100, 100)
    : 0;

  const invoices = billingProfile?.invoices ?? [];

  return (
    <div className={`${layout.compactShell} px-4 sm:px-6 xl:px-8`}>
      <header className="py-8 lg:py-10 xl:py-12 border-b border-black/[0.03]">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Billing</span>
        </div>
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-text-primary" style={{ letterSpacing: '-1.2px' }}>
          Billing & Usage
        </h1>
        <p className="text-[14px] text-black/50 max-w-md">
          Manage your subscription details, payment method, and usage limits.
        </p>
      </header>

      <div className="py-8 lg:py-10 xl:py-12 space-y-8">
        <section>
          <div className="bg-brand-ink rounded-[24px] p-5 sm:p-6 lg:p-8 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                  <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1">Current Plan</p>
                  <h3 className="text-2xl font-bold">{billingProfile?.plan ? `${billingProfile.plan} Plan` : 'Plan Unavailable'}</h3>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-[11px] font-bold">
                  {billingProfile?.status ? (billingProfile.status === 'active' ? '● Active' : '○ Standby') : 'Unavailable'}
                </div>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-white/40 text-[13px] mb-1">Next invoice date</p>
                  <p className="text-[15px] font-medium">
                    {billingProfile?.usage?.resetDate
                      ? new Date(billingProfile.usage.resetDate).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'Unavailable'}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/[0.05] transition-colors" />
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[14px] font-bold uppercase tracking-widest text-black/40">Identity & Payment</h2>
            </div>
            {defaultPaymentMethod ? (
              <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
                <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="w-12 h-12 rounded-xl bg-brand-ink flex items-center justify-center text-white shrink-0">
                    <CreditCard size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-bold text-text-primary">•••• {defaultPaymentMethod.last4}</p>
                      {defaultPaymentMethod.isDefault && (
                        <span className="text-[9px] font-bold uppercase tracking-tighter bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded">Default</span>
                      )}
                    </div>
                    <p className="text-[12px] text-black/40">Expires {defaultPaymentMethod.expMonth}/{defaultPaymentMethod.expYear}</p>
                  </div>
                </div>
                <div className="border-t border-black/[0.04] px-6 py-3 bg-bg-secondary">
                  <a
                    href="mailto:support@reframevisuals.com?subject=Update payment method"
                    className="text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Request card update via support →
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-full p-8 border border-dashed border-black/10 rounded-2xl text-black/40 flex flex-col items-center gap-2">
                <CreditCard size={20} className="text-black/20" />
                <span className="text-[13px] font-medium">No payment method on file</span>
                <a
                  href="mailto:support@reframevisuals.com?subject=Add payment method"
                  className="text-[12px] text-text-secondary hover:text-text-primary underline underline-offset-2 transition-colors"
                >
                  Contact support to add a payment method
                </a>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-[14px] font-bold uppercase tracking-widest text-black/40 mb-6">Usage Quota</h2>
            <div className="p-6 rounded-2xl border border-black/5 bg-surfaceMuted space-y-6">
              <div>
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-black/50">Images processed</span>
                  <span className="font-bold">
                    {typeof usageConsumed === 'number' && typeof usageQuota === 'number' ? `${usageConsumed} / ${usageQuota}` : 'Unavailable'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${usagePercent}%` }} className="h-full bg-black rounded-full" />
                </div>
              </div>
              <div className="pt-4 border-t border-black/[0.05] flex items-center justify-between">
                <span className="text-[12px] text-black/40 italic">Quota resets on {billingProfile?.usage?.resetDate || 'Unavailable'}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Invoice History */}
        <section>
          <h2 className="text-[14px] font-bold uppercase tracking-widest text-black/40 mb-6">Invoice History</h2>
          {invoices.length > 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-black/5 text-[11px] font-bold uppercase tracking-widest text-black/30">
                <div className="col-span-3">Invoice</div>
                <div className="col-span-3">Date</div>
                <div className="col-span-2">Due</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2 text-right">Status</div>
              </div>
              {invoices.map((inv) => (
                <div key={inv.id} className="grid grid-cols-1 gap-2 px-5 py-4 border-b border-black/[0.04] last:border-b-0 md:grid-cols-12 md:items-center hover:bg-bg-secondary transition-colors">
                  <div className="md:col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-text-secondary" />
                    </div>
                    <span className="text-[13px] font-medium text-text-primary font-satoshi uppercase tracking-widest">{inv.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between md:col-span-3 md:block">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-black/30 md:hidden">Date</span>
                    <span className="text-[13px] text-text-secondary">{new Date(inv.date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center justify-between md:col-span-2 md:block">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-black/30 md:hidden">Due</span>
                    <span className="text-[13px] text-text-secondary">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between md:col-span-2 md:block">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-black/30 md:hidden">Amount</span>
                    <span className="text-[14px] font-semibold text-text-primary">${Number(inv.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between md:col-span-2 md:justify-end">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-black/30 md:hidden">Status</span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                      inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                      inv.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-black/5 text-black/40'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full p-10 border border-dashed border-black/10 rounded-2xl flex flex-col items-center gap-3 text-center">
              <FileText size={24} className="text-black/20" />
              <p className="text-[14px] font-medium text-black/40">No invoices yet</p>
              <p className="text-[13px] text-black/30">Your invoices will appear here once your first order is billed.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default BillingView;
