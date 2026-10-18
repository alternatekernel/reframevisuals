import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { adminFetch } from '../utils/api';
import { InvoiceDocument, InvoiceData } from '../components/InvoiceDocument';

export const InvoicePrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminFetch<{ invoice: InvoiceData }>(`/finance/invoices/${id}`)
      .then((d) => { if (!cancelled) setInvoice(d.invoice); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load invoice'); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!invoice) return;
    document.title = `Invoice ${invoice.invoiceNumber || ''}`.trim();
    let cancelled = false;
    const fontsReady = (document as any).fonts?.ready ?? Promise.resolve();
    fontsReady.then(() => {
      if (!cancelled) setTimeout(() => window.print(), 300);
    });
    return () => { cancelled = true; };
  }, [invoice]);

  if (error) return <div style={{ padding: 32, fontFamily: 'sans-serif', color: '#b91c1c' }}>{error}</div>;
  if (!invoice) return <div style={{ padding: 32, fontFamily: 'sans-serif', color: '#5C5B57' }}>Loading invoice…</div>;

  return (
    <div style={{ background: '#F7F6F3', minHeight: '100vh', padding: '32px 16px' }} className="rfv-print-shell">
      <style>{`@media print { .rfv-print-shell { background:#fff !important; padding:0 !important; } .rfv-print-wrap { max-width:none !important; } }`}</style>
      <div className="rfv-print-wrap" style={{ maxWidth: 780, margin: '0 auto' }}>
        <InvoiceDocument invoice={invoice} />
      </div>
    </div>
  );
};

export default InvoicePrintPage;
