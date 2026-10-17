import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Printer, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { adminFetch } from '../utils/api';
import { useToast } from '../ToastContext';
import { InvoiceDocument, InvoiceData } from '../components/InvoiceDocument';

interface CustomerOption {
  id: string;
  name: string | null;
  companyName: string | null;
  email: string;
  contactEmail: string | null;
  country: string | null;
}

interface DraftItem {
  description: string;
  note: string;
  quantity: string;
  unitPrice: string;
}

const SERVICE_PRESETS: { description: string; note: string; unitPrice: string }[] = [
  { description: 'Multi-Clipping Path', note: 'Foundation · 24h Turnaround', unitPrice: '0.90' },
  { description: 'Color Correction', note: 'Enhancement · 24h Turnaround', unitPrice: '0.35' },
  { description: 'Retouching', note: 'Retouch · 24h Turnaround', unitPrice: '0.96' },
];

const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const fieldLabel = 'block text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.14em] mb-1.5';
const fieldInput =
  'w-full px-3 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[13px] font-bold text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)]/50 disabled:opacity-60';

export const InvoiceEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  const today = useMemo(() => new Date(), []);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [billName, setBillName] = useState('');
  const [billCompany, setBillCompany] = useState('');
  const [billAddress, setBillAddress] = useState('');
  const [billEmail, setBillEmail] = useState('');
  const [issueDate, setIssueDate] = useState(toDateInput(today));
  const [dueDate, setDueDate] = useState(toDateInput(addDays(today, 7)));
  const [taxPercent, setTaxPercent] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([{ description: '', note: '', quantity: '1', unitPrice: '0' }]);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [status, setStatus] = useState('unpaid');
  const [paidAt, setPaidAt] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [payRef, setPayRef] = useState('');

  const locked = status === 'paid';

  useEffect(() => {
    adminFetch<{ customers: CustomerOption[] }>('/finance/invoice-customers')
      .then((d) => setCustomers(d.customers || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load customers'));
  }, []);

  useEffect(() => {
    if (!id) {
      adminFetch<{ invoiceNumber: string }>('/finance/invoices/next-number')
        .then((d) => setInvoiceNumber(d.invoiceNumber))
        .catch(() => undefined);
      return;
    }
    adminFetch<{ invoice: InvoiceData & { customerId: string } }>(`/finance/invoices/${id}`)
      .then(({ invoice: inv }) => {
        setCustomerId(inv.customerId);
        setBillName(inv.billTo.name || '');
        setBillCompany(inv.billTo.company || '');
        setBillAddress(inv.billTo.address || '');
        setBillEmail(inv.billTo.email || '');
        setIssueDate(inv.issueDate.slice(0, 10));
        setDueDate(inv.dueDate.slice(0, 10));
        setTaxPercent(String(+(inv.taxRate * 100).toFixed(2)));
        setNotes(inv.notes || '');
        setInvoiceNumber(inv.invoiceNumber);
        setStatus(inv.status);
        setPaidAt(inv.paidAt || null);
        setPaymentReference(inv.paymentReference || null);
        setItems(inv.items.map((it) => ({
          description: it.description,
          note: it.note || '',
          quantity: String(it.quantity),
          unitPrice: String(it.unitPrice),
        })));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load invoice'))
      .finally(() => setLoading(false));
  }, [id]);

  const onPickCustomer = (cid: string) => {
    setCustomerId(cid);
    const c = customers.find((x) => x.id === cid);
    if (!c) return;
    setBillCompany(c.companyName || '');
    setBillName(c.name || '');
    setBillEmail(c.contactEmail || c.email);
    setBillAddress((prev) => prev || c.country || '');
  };

  const updateItem = (i: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const addItem = (preset?: (typeof SERVICE_PRESETS)[number]) =>
    setItems((prev) => {
      const qty = prev[0]?.quantity && prev[0].quantity !== '0' ? prev[0].quantity : '1';
      const next: DraftItem = preset
        ? { description: preset.description, note: preset.note, unitPrice: preset.unitPrice, quantity: qty }
        : { description: '', note: '', quantity: '1', unitPrice: '0' };
      const onlyBlank = prev.length === 1 && !prev[0].description.trim();
      return onlyBlank ? [next] : [...prev, next];
    });

  const computed = useMemo(() => {
    const rows = items.map((it) => {
      const q = Number(it.quantity) || 0;
      const p = Number(it.unitPrice) || 0;
      return { description: it.description, note: it.note || null, quantity: q, unitPrice: p, amount: round2(q * p) };
    });
    const taxRate = Math.max(0, Math.min(99.99, Number(taxPercent) || 0)) / 100;
    const subtotal = round2(rows.reduce((s, r) => s + r.amount, 0));
    const taxAmount = round2(subtotal * taxRate);
    return { rows, taxRate, subtotal, taxAmount, amount: round2(subtotal + taxAmount) };
  }, [items, taxPercent]);

  const preview: InvoiceData = {
    invoiceNumber,
    issueDate: `${issueDate}T00:00:00.000Z`,
    dueDate: `${dueDate}T00:00:00.000Z`,
    paidAt,
    status,
    currency: 'USD',
    subtotal: computed.subtotal,
    taxRate: computed.taxRate,
    taxAmount: computed.taxAmount,
    amount: computed.amount,
    notes: notes || null,
    paymentReference,
    billTo: { name: billName, company: billCompany, address: billAddress, email: billEmail },
    items: computed.rows,
  };

  const save = async () => {
    setError(null);
    if (!customerId) { setError('Select a customer first.'); return; }
    setSaving(true);
    try {
      const body = {
        customerId,
        issueDate,
        dueDate,
        taxRate: computed.taxRate,
        notes,
        billTo: { name: billName, company: billCompany, address: billAddress, email: billEmail },
        items: computed.rows.map((r) => ({ description: r.description, note: r.note, quantity: r.quantity, unitPrice: r.unitPrice })),
      };
      const res = await adminFetch<{ invoice: InvoiceData & { id: string } }>(
        isEdit ? `/finance/invoices/${id}` : '/finance/invoices',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) }
      );
      showToast(isEdit ? 'Invoice updated' : `Invoice ${res.invoice.invoiceNumber} created`, 'success');
      if (!isEdit) navigate(`/admin/invoicing/${res.invoice.id}/edit`, { replace: true });
      else setInvoiceNumber(res.invoice.invoiceNumber);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch<{ invoice: InvoiceData }>(`/finance/invoices/${id}/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({ paymentReference: payRef.trim() || undefined }),
      });
      setStatus(res.invoice.status);
      setPaidAt(res.invoice.paidAt || null);
      setPaymentReference(res.invoice.paymentReference || null);
      showToast('Invoice marked as paid', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark paid');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-[var(--admin-text-3)]">Loading invoice…</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title={isEdit ? `Invoice ${invoiceNumber || ''}` : 'New Invoice'}
        description={isEdit ? 'Edit details, preview the document, print or mark as paid.' : 'Create an invoice. The number is assigned when you save.'}
        parentPage="Finance / Invoicing"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => navigate('/admin/invoicing')} className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[13px] font-bold text-[var(--admin-text-2)] hover:text-[var(--admin-text)]">
          <ArrowLeft size={14} /> Back
        </button>
        {!locked && (
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-[var(--admin-accent)] text-black rounded-xl text-[13px] font-black disabled:opacity-60">
            <Save size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
        )}
        {isEdit && (
          <button onClick={() => window.open(`/admin/invoicing/${id}/print`, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[13px] font-bold text-[var(--admin-text-2)] hover:text-[var(--admin-accent)]">
            <Printer size={14} /> Print / PDF
          </button>
        )}
        {isEdit && !locked && (
          <div className="flex items-center gap-2 ml-auto">
            <input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Payment reference (optional)" className={`${fieldInput} w-60`} />
            <button onClick={markPaid} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-green-dim)] text-[var(--admin-green)] border border-[var(--admin-green)]/20 rounded-xl text-[13px] font-black disabled:opacity-60">
              <CheckCircle2 size={14} /> Mark as paid
            </button>
          </div>
        )}
      </div>

      {locked && <div className="rounded-2xl border border-[var(--admin-green)]/20 bg-[var(--admin-green-dim)] px-5 py-3 text-[13px] font-bold text-[var(--admin-green)]">This invoice is paid and locked.</div>}
      {error && <div className="rounded-2xl border border-[var(--admin-red)]/20 bg-[var(--admin-red-dim)] px-5 py-3 text-[13px] font-bold text-[var(--admin-red)]">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)] gap-8 items-start">
        <fieldset disabled={locked} className="space-y-5 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-3xl p-6 min-w-0">
          <div>
            <label className={fieldLabel} htmlFor="inv-customer">Customer</label>
            <select id="inv-customer" value={customerId} onChange={(e) => onPickCustomer(e.target.value)} className={fieldInput}>
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName || c.name || c.email} ({c.email})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={fieldLabel} htmlFor="inv-company">Company</label><input id="inv-company" className={fieldInput} value={billCompany} onChange={(e) => setBillCompany(e.target.value)} /></div>
            <div><label className={fieldLabel} htmlFor="inv-attn">Attention</label><input id="inv-attn" className={fieldInput} value={billName} onChange={(e) => setBillName(e.target.value)} /></div>
          </div>
          <div>
            <label className={fieldLabel} htmlFor="inv-email">Billing email</label>
            <input id="inv-email" type="email" className={fieldInput} value={billEmail} onChange={(e) => setBillEmail(e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="inv-address">Address (one line per row)</label>
            <textarea id="inv-address" rows={3} className={fieldInput} value={billAddress} onChange={(e) => setBillAddress(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className={fieldLabel} htmlFor="inv-issue">Issue date</label><input id="inv-issue" type="date" className={fieldInput} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
            <div><label className={fieldLabel} htmlFor="inv-due">Due date</label><input id="inv-due" type="date" className={fieldInput} value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div><label className={fieldLabel} htmlFor="inv-tax">Tax %</label><input id="inv-tax" type="number" min="0" max="99" step="0.01" className={fieldInput} value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={fieldLabel + ' mb-0'}>Line items</span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {SERVICE_PRESETS.map((p) => (
                  <button key={p.description} type="button" onClick={() => addItem(p)} className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-3)] text-[var(--admin-text-2)] hover:text-[var(--admin-accent)]">
                    + {p.description}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="rounded-2xl border border-[var(--admin-border)] p-3 space-y-2">
                  <div className="flex gap-2">
                    <input aria-label={`Item ${i + 1} description`} placeholder="Description" className={fieldInput} value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} />
                    <button type="button" aria-label={`Remove item ${i + 1}`} disabled={items.length === 1} onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))} className="px-2.5 rounded-xl border border-[var(--admin-border)] text-[var(--admin-text-3)] hover:text-[var(--admin-red)] disabled:opacity-40">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input aria-label={`Item ${i + 1} note`} placeholder="Note (e.g. Foundation · 24h Turnaround)" className={fieldInput} value={it.note} onChange={(e) => updateItem(i, { note: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2">
                    <input aria-label={`Item ${i + 1} quantity`} type="number" min="0" step="1" className={fieldInput} value={it.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} />
                    <input aria-label={`Item ${i + 1} unit price`} type="number" min="0" step="0.01" className={fieldInput} value={it.unitPrice} onChange={(e) => updateItem(i, { unitPrice: e.target.value })} />
                    <div className="flex items-center justify-end text-[13px] font-bold text-[var(--admin-text)] tabular-nums">${computed.rows[i]?.amount.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addItem()} className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-[var(--admin-accent)]"><Plus size={14} /> Add line</button>
          </div>

          <div>
            <label className={fieldLabel} htmlFor="inv-notes">Notes (printed in footer)</label>
            <textarea id="inv-notes" rows={2} className={fieldInput} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </fieldset>

        <div className="min-w-0 overflow-x-auto">
          <div style={{ minWidth: 560 }}>
            <InvoiceDocument invoice={preview} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditorPage;
