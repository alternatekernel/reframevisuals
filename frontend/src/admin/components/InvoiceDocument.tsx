import React from 'react';

export interface InvoiceItemData {
  id?: string;
  description: string;
  note?: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  id?: string;
  invoiceNumber: string | null;
  issueDate: string;
  dueDate: string;
  paidAt?: string | null;
  status: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
  notes?: string | null;
  paymentReference?: string | null;
  billTo: {
    name?: string | null;
    company?: string | null;
    address?: string | null;
    email?: string | null;
  };
  items: InvoiceItemData[];
}

const SENDER = {
  name: 'Maruf Hasan',
  company: 'Reframe Visuals',
  address: ['Shekhertek, Mohammadpur', 'Dhaka 1207', 'Bangladesh'],
  email: 'hello@reframevisuals.com',
  site: 'reframevisuals.com',
  slogan: 'Professional Photo Editing | Worldwide',
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

const makeMoney = (currency: string) => {
  const f = new Intl.NumberFormat('en-US', { style: 'currency', currency });
  return (n: number) => f.format(n);
};

const CSS = `
.rfv-inv {
  --bg:#F7F6F3; --surface:#ffffff; --ink:#0A0A0B; --text:#171717; --dim:#5C5B57; --muted:#9A9893; --rule:#E5E3DE; --accent:#0284C7;
  --tag-bg:#EFF6FF; --tag-text:#1E3A8A; --tag-border:rgba(30,64,175,0.22);
  font-family:'Satoshi','Plus Jakarta Sans',system-ui,sans-serif; font-size:14px; line-height:1.5; color:var(--text);
}
.rfv-inv.is-paid { --tag-bg:#F0FDF4; --tag-text:#14532D; --tag-border:rgba(22,163,74,0.28); }
.rfv-inv *, .rfv-inv *::before, .rfv-inv *::after { box-sizing:border-box; margin:0; padding:0; }
.rfv-inv .card { background:var(--surface); border-radius:14px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.07),0 12px 32px rgba(0,0,0,0.10); }
.rfv-inv .hdr { background:#0A0A0B; padding:32px 44px 30px; display:flex; justify-content:space-between; align-items:flex-start; gap:20px; flex-wrap:wrap; }
.rfv-inv .brand { display:flex; align-items:stretch; gap:18px; }
.rfv-inv .brand-logo { height:64px; width:auto; flex-shrink:0; }
.rfv-inv .brand-text { display:flex; flex-direction:column; justify-content:center; gap:8px; height:64px; padding:2px 0; }
.rfv-inv .brand-name { font-size:22px; font-weight:700; letter-spacing:-0.05em; color:#fff; line-height:1; }
.rfv-inv .brand-sub { font-size:13px; color:rgba(255,255,255,0.38); letter-spacing:0.01em; line-height:1; }
.rfv-inv .inv-heading { text-align:right; }
.rfv-inv .inv-word { font-family:'Space Grotesk',sans-serif; font-size:26px; font-weight:700; letter-spacing:-0.03em; color:#fff; line-height:1; }
.rfv-inv .inv-num { margin-top:7px; font-size:12px; color:rgba(255,255,255,0.42); letter-spacing:0.06em; font-variant-numeric:tabular-nums; }
.rfv-inv .meta { border-bottom:1px solid var(--rule); padding:14px 44px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.rfv-inv .meta-group { display:flex; gap:36px; flex-wrap:wrap; }
.rfv-inv .meta-item { display:flex; flex-direction:column; gap:3px; }
.rfv-inv .meta-key, .rfv-inv .party-role, .rfv-inv .footer-due-label, .rfv-inv th { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:var(--muted); }
.rfv-inv .meta-val { font-size:13px; font-weight:500; font-variant-numeric:tabular-nums; }
.rfv-inv .status-tag { display:inline-block; padding:4px 10px; border-radius:3px; font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; background:var(--tag-bg); color:var(--tag-text); border:1px solid var(--tag-border); white-space:nowrap; }
.rfv-inv .parties { display:grid; grid-template-columns:1fr 1fr; border-bottom:1px solid var(--rule); }
.rfv-inv .party { padding:28px 44px 26px; min-width:0; }
.rfv-inv .party + .party { border-left:1px solid var(--rule); }
.rfv-inv .party-role { letter-spacing:0.14em; margin-bottom:14px; }
.rfv-inv .party-name { font-family:'Space Grotesk',sans-serif; font-size:15px; font-weight:600; margin-bottom:2px; line-height:1.3; }
.rfv-inv .party-co { font-size:13px; font-weight:500; color:var(--dim); margin-bottom:10px; }
.rfv-inv .party-addr { font-size:12.5px; color:var(--dim); line-height:1.75; }
.rfv-inv .party-email { display:inline-block; margin-top:12px; font-size:12px; color:var(--accent); overflow-wrap:anywhere; }
.rfv-inv .items { padding:0 44px; }
.rfv-inv table { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; }
.rfv-inv thead th { padding:16px 0 13px; text-align:left; border-bottom:1px solid var(--rule); }
.rfv-inv th.r, .rfv-inv td.r { text-align:right; }
.rfv-inv th.c, .rfv-inv td.c { text-align:center; }
.rfv-inv tbody td { padding:20px 0; font-size:13.5px; vertical-align:top; border-bottom:1px solid var(--rule); }
.rfv-inv .item-title { font-weight:600; line-height:1.35; }
.rfv-inv .item-note { margin-top:4px; font-size:11.5px; color:var(--muted); }
.rfv-inv td.soft { color:var(--dim); }
.rfv-inv td.bold { font-weight:600; }
.rfv-inv .totals-wrap { padding:8px 44px 36px; display:flex; justify-content:flex-end; }
.rfv-inv .totals { min-width:270px; }
.rfv-inv .totals-row { display:flex; justify-content:space-between; align-items:baseline; gap:56px; padding:9px 0; font-size:13px; color:var(--dim); border-bottom:1px solid var(--rule); font-variant-numeric:tabular-nums; }
.rfv-inv .totals-row:last-child { border-bottom:none; }
.rfv-inv .totals-row.total { padding-top:16px; border-top:2px solid var(--text); font-family:'Space Grotesk',sans-serif; }
.rfv-inv .totals-row.bal { font-weight:700; color:var(--text); }
.rfv-inv .t-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:var(--muted); align-self:center; }
.rfv-inv .t-amount { font-size:22px; font-weight:700; color:var(--ink); }
.rfv-inv .t-cur { font-size:13px; font-weight:500; color:var(--muted); }
.rfv-inv .ftr { border-top:1px solid var(--rule); padding:24px 44px; display:flex; justify-content:space-between; align-items:flex-end; gap:48px; flex-wrap:wrap; }
.rfv-inv .footer-due { font-size:13px; font-weight:600; margin-bottom:6px; }
.rfv-inv .footer-due-label { display:block; margin-bottom:3px; }
.rfv-inv .footer-note { font-size:12px; color:var(--dim); line-height:1.7; max-width:420px; white-space:pre-line; }
.rfv-inv .footer-note + .footer-note { margin-top:6px; }
.rfv-inv .sig { text-align:right; flex-shrink:0; }
.rfv-inv .sig-brand { font-family:'Space Grotesk',sans-serif; font-size:12px; font-weight:600; color:var(--dim); }
.rfv-inv .sig-line { font-size:11px; color:var(--muted); line-height:1.6; }
@media (max-width:600px) {
  .rfv-inv .hdr { padding:24px 20px 22px; }
  .rfv-inv .inv-heading { text-align:left; }
  .rfv-inv .meta { padding:12px 20px; }
  .rfv-inv .meta-group { gap:20px; }
  .rfv-inv .parties { grid-template-columns:1fr; }
  .rfv-inv .party { padding:22px 20px; }
  .rfv-inv .party + .party { border-left:none; border-top:1px solid var(--rule); }
  .rfv-inv .items { padding:0 20px; }
  .rfv-inv .totals-wrap { padding:8px 20px 28px; }
  .rfv-inv .totals { min-width:0; width:100%; }
  .rfv-inv .ftr { padding:20px; gap:20px; flex-direction:column; }
  .rfv-inv .sig { text-align:left; }
}
@media print {
  @page { size:A4; margin:0; }
  html, body { background:#fff !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .rfv-inv .card { border-radius:0; box-shadow:none; min-height:297mm; width:210mm; display:flex; flex-direction:column; }
  .rfv-inv .ftr { margin-top:auto; }
}
`;

export const InvoiceDocument: React.FC<{ invoice: InvoiceData }> = ({ invoice }) => {
  const isPaid = invoice.status.toLowerCase() === 'paid';
  const money = makeMoney(invoice.currency || 'USD');
  const addressLines = (invoice.billTo.address || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const number = invoice.invoiceNumber || 'Draft';
  const statusLabel = isPaid ? 'Paid' : invoice.status.toLowerCase() === 'overdue' ? 'Overdue' : 'Unpaid';
  const paidDate = invoice.paidAt ? formatDate(invoice.paidAt) : '';

  return (
    <div className={`rfv-inv${isPaid ? ' is-paid' : ''}`}>
      <style>{CSS}</style>
      <div className="card">
        <div className="hdr">
          <div className="brand">
            <svg className="brand-logo" viewBox="0 0 2003 2073" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Reframe Visuals">
              <path d="M150 160L150 1918M142 153H1837M1852 160L1852 1918M1837 1925L142 1925" stroke="white" strokeWidth="8" />
              <path d="M1730 152.983H1974.16M1852.08 28V272.152" stroke="white" strokeWidth="56" strokeLinecap="round" />
              <path d="M28 152.983H272.16M150.08 28V272.152" stroke="white" strokeWidth="56" strokeLinecap="round" />
              <path d="M28 1924.98H272.16M150.08 1800V2044.15" stroke="white" strokeWidth="56" strokeLinecap="round" />
              <path d="M1730 1924.98H1974.16M1852.08 1800V2044.15" stroke="white" strokeWidth="56" strokeLinecap="round" />
              <path d="M764.961 1646L413 1300.48V852.229H867.74L413 432L1278.52 432C1428.02 432 1580.64 531.61 1580.64 677.908V852.229H867.74L1581 1646H1157.41L764.961 1228.88V1646Z" fill="white" />
            </svg>
            <div className="brand-text">
              <div className="brand-name">{SENDER.company}</div>
              <div className="brand-sub">{SENDER.slogan}</div>
            </div>
          </div>
          <div className="inv-heading">
            <div className="inv-word">Invoice</div>
            <div className="inv-num"># {number}</div>
          </div>
        </div>

        <div className="meta">
          <div className="meta-group">
            <div className="meta-item"><span className="meta-key">Issue Date</span><span className="meta-val">{formatDate(invoice.issueDate)}</span></div>
            <div className="meta-item">
              <span className="meta-key">{isPaid ? 'Paid On' : 'Due Date'}</span>
              <span className="meta-val">{isPaid && paidDate ? paidDate : formatDate(invoice.dueDate)}</span>
            </div>
            <div className="meta-item"><span className="meta-key">Order ID</span><span className="meta-val"># {number}</span></div>
          </div>
          <span className="status-tag">{statusLabel}</span>
        </div>

        <div className="parties">
          <div className="party">
            <div className="party-role">From</div>
            <div className="party-name">{SENDER.name}</div>
            <div className="party-co">{SENDER.company}</div>
            <div className="party-addr">{SENDER.address.map((l, i) => <React.Fragment key={i}>{l}{i < SENDER.address.length - 1 && <br />}</React.Fragment>)}</div>
            <span className="party-email">{SENDER.email}</span>
          </div>
          <div className="party">
            <div className="party-role">Billed To</div>
            <div className="party-name">{invoice.billTo.company || invoice.billTo.name || 'Customer'}</div>
            {invoice.billTo.company && invoice.billTo.name && <div className="party-co">Attn: {invoice.billTo.name}</div>}
            {addressLines.length > 0 && (
              <div className="party-addr">{addressLines.map((l, i) => <React.Fragment key={i}>{l}{i < addressLines.length - 1 && <br />}</React.Fragment>)}</div>
            )}
            {invoice.billTo.email && <span className="party-email">{invoice.billTo.email}</span>}
          </div>
        </div>

        <div className="items">
          <table>
            <thead>
              <tr>
                <th style={{ width: '52%' }}>Description</th>
                <th className="c" style={{ width: '14%' }}>Qty</th>
                <th className="r" style={{ width: '17%' }}>Unit Price</th>
                <th className="r" style={{ width: '17%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, i) => (
                <tr key={it.id || i}>
                  <td>
                    <div className="item-title">{it.description}</div>
                    {it.note && <div className="item-note">{it.note}</div>}
                  </td>
                  <td className="c soft">{it.quantity}</td>
                  <td className="r soft">{money(it.unitPrice)}</td>
                  <td className="r bold">{money(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="totals-wrap">
          <div className="totals">
            <div className="totals-row"><span>Subtotal</span><span>{money(invoice.subtotal)}</span></div>
            <div className="totals-row">
              <span>{invoice.taxRate > 0 ? `Tax (${+(invoice.taxRate * 100).toFixed(2)}%)` : 'Tax'}</span>
              <span>{money(invoice.taxAmount)}</span>
            </div>
            <div className="totals-row total">
              <span className="t-label">{isPaid ? 'Total' : 'Total Due'}</span>
              <span className="t-amount">{money(invoice.amount)} <span className="t-cur">{invoice.currency}</span></span>
            </div>
            {isPaid && (
              <>
                <div className="totals-row"><span>Amount Paid</span><span>&minus;{money(invoice.amount)}</span></div>
                <div className="totals-row bal"><span>Balance Due</span><span>{money(0)}</span></div>
              </>
            )}
          </div>
        </div>

        <div className="ftr">
          <div>
            <p className="footer-due">
              <span className="footer-due-label">{isPaid ? 'Payment Received' : 'Payment Due'}</span>
              {isPaid && paidDate ? paidDate : formatDate(invoice.dueDate)}
            </p>
            <p className="footer-note">{isPaid ? 'Thank you for your payment.' : 'Thank you for choosing Reframe Visuals.'}</p>
            {isPaid
              ? invoice.paymentReference && <p className="footer-note">Payment reference: # {invoice.paymentReference}</p>
              : invoice.invoiceNumber && <p className="footer-note">Please reference # {invoice.invoiceNumber} when making payment.</p>}
            {invoice.notes && <p className="footer-note">{invoice.notes}</p>}
          </div>
          <div className="sig">
            <div className="sig-brand">{SENDER.company}</div>
            <div className="sig-line">{SENDER.email}<br />{SENDER.site}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
