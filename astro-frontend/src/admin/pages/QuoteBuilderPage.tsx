import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ToastContext';
import { adminFetch } from '../utils/api';

// Initialize once at module load time
const DEFAULT_VALID_DATE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

interface QuotationItem {
  serviceType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

const SERVICE_PRICES: Record<string, number> = {
  'Retouching - Standard': 1.50,
  'Retouching - Advanced': 2.50,
  'Ghost Mannequin': 3.00,
  'Background Removal': 1.00,
  'Color Correction': 0.75,
  'Shadow Creation': 1.25,
  'Jewelry Retouch': 4.00,
  'Model Retouch': 5.00,
};

export const QuoteBuilderPage: React.FC = () => {
  const nav = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [client, setClient] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [sla, setSla] = useState(1);
  const [items, setItems] = useState<QuotationItem[]>([
    { serviceType: 'Retouching - Standard', quantity: 100, unitPrice: 1.50, totalPrice: 150 },
  ]);
  const [notes, setNotes] = useState('');

  const total = items.reduce((sum, item) => sum + item.totalPrice, 0) * sla;

  const addItem = () => {
    setItems([...items, { serviceType: 'Retouching - Standard', quantity: 0, unitPrice: 1.50, totalPrice: 0 }]);
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'serviceType') {
      item.unitPrice = SERVICE_PRICES[value] || 0;
      item.totalPrice = item.quantity * item.unitPrice;
    } else if (field === 'quantity') {
      item.totalPrice = value * item.unitPrice;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleGenerateQuote = async () => {
    if (!client.trim()) {
      showToast('Error', 'Please enter client name', 'error');
      return;
    }
    if (!clientEmail.trim()) {
      showToast('Error', 'Please enter client email', 'error');
      return;
    }
    if (items.length === 0 || items.every(item => item.quantity <= 0)) {
      showToast('Error', 'Please add at least one priced line item', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminFetch('/quote/submit', {
        method: 'POST',
        body: JSON.stringify({
          name: client,
          email: clientEmail,
          company: client,
          services: items.filter(item => item.quantity > 0).map(item => item.serviceType),
          turnaround: sla === 1 ? '48h' : sla === 1.25 ? '24h' : sla === 1.5 ? '12h' : '6h',
          quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          basePrice: items.reduce((sum, item) => sum + item.totalPrice, 0),
          volumeDiscount: 0,
          turnaroundMultiplier: sla,
          estimatedPrice: total,
          notes,
        }),
      });
      showToast('Quote request created', 'Proposal saved to quote requests', 'success');
      nav('/admin/quotations');
    } catch (error) {
      showToast('Error', error instanceof Error ? error.message : 'Failed to create quote request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </span>
          Quote Builder
        </div>
        <div className="an-page-desc">Create custom pricing proposals for clients</div>
        <div className="an-page-actions">
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={() => nav('/admin/quotations')}>Cancel</button>
          <button className="an-btn an-btn-primary an-btn-sm" onClick={handleGenerateQuote} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Generate Proposal'}
          </button>
        </div>
      </div>

      <div className="an-card" style={{ maxWidth: 900 }}>
        <div className="an-grid2">
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--an-text3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>CLIENT NAME</label>
            <input
              value={client}
              onChange={e => setClient(e.target.value)}
              list="client-list-qb"
              placeholder="Select customer..."
              style={{ width: '100%', background: 'var(--an-sidebar)', border: '1px solid var(--an-border)', borderRadius: 'var(--an-radius)', padding: '6px 10px', fontSize: 13, color: 'var(--an-text)', fontFamily: 'var(--an-font)', outline: 'none' }}
            />
            <datalist id="client-list-qb">
              <option value="StyleHouse Inc." />
              <option value="Urban Gear Co." />
              <option value="LuxJewel" />
              <option value="Acme Fashion" />
              <option value="Nike Batch" />
            </datalist>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--an-text3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>CLIENT EMAIL</label>
            <input
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              placeholder="client@company.com"
              style={{ width: '100%', background: 'var(--an-sidebar)', border: '1px solid var(--an-border)', borderRadius: 'var(--an-radius)', padding: '6px 10px', fontSize: 13, color: 'var(--an-text)', fontFamily: 'var(--an-font)', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--an-text3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>SLA TIER</label>
            <select
              value={sla}
              onChange={e => setSla(parseFloat(e.target.value))}
              style={{ width: '100%', background: 'var(--an-sidebar)', border: '1px solid var(--an-border)', borderRadius: 'var(--an-radius)', padding: '6px 10px', fontSize: 13, color: 'var(--an-text)', fontFamily: 'var(--an-font)', outline: 'none', height: 31 }}
            >
              <option value={1}>Standard (48h) - Base Price</option>
              <option value={1.25}>Express (24h) - +25%</option>
              <option value={1.5}>Rush (12h) - +50%</option>
              <option value={2}>Same Day (6h) - +100%</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--an-text3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>VALID UNTIL</label>
            <input
              type="date"
              defaultValue={DEFAULT_VALID_DATE}
              style={{ width: '100%', background: 'var(--an-sidebar)', border: '1px solid var(--an-border)', borderRadius: 'var(--an-radius)', padding: '6px 10px', fontSize: 13, color: 'var(--an-text)', fontFamily: 'var(--an-font)', outline: 'none', height: 31 }}
            />
          </div>
        </div>

        <div className="an-divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="an-sec-title" style={{ marginBottom: 0 }}>Line Items</div>
          <button className="an-btn an-btn-ghost an-btn-sm" onClick={addItem}>+ Add Item</button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="an-sla-row" style={{ alignItems: 'flex-start', gap: 8, padding: '8px 0' }}>
            <div style={{ flex: 1 }}>
              <select
                value={item.serviceType}
                onChange={(e) => updateItem(index, 'serviceType', e.target.value)}
                style={{ width: '100%', background: 'var(--an-sidebar)', border: '1px solid var(--an-border)', borderRadius: 'var(--an-radius)', padding: '6px 10px', fontSize: 13, color: 'var(--an-text)', fontFamily: 'var(--an-font)', outline: 'none', height: 36 }}
              >
                {Object.keys(SERVICE_PRICES).map(price => (
                  <option key={price} value={price}>{price}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                placeholder="Qty"
                style={{ width: 70, border: '1px solid var(--an-border)', borderRadius: 6, padding: '6px 8px', fontSize: 13, fontFamily: 'var(--an-font)', outline: 'none', textAlign: 'center' }}
              />
            </div>
            <div style={{ width: 80, textAlign: 'right', fontSize: 13, color: 'var(--an-text2)' }}>
              ${item.unitPrice.toFixed(2)}
            </div>
            <div style={{ width: 90, textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--an-text)' }}>
              ${item.totalPrice.toFixed(2)}
            </div>
            <button 
              className="an-btn an-btn-ghost an-btn-sm"
              onClick={() => removeItem(index)}
              style={{ padding: '4px 8px', fontSize: 16 }}
            >
              ×
            </button>
          </div>
        ))}

        <div className="an-divider" />
        
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--an-text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>ADDITIONAL NOTES</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or terms..."
            rows={3}
            style={{ width: '100%', background: 'var(--an-sidebar)', border: '1px solid var(--an-border)', borderRadius: 'var(--an-radius)', padding: '10px', fontSize: 13, color: 'var(--an-text)', fontFamily: 'var(--an-font)', outline: 'none', resize: 'vertical' }}
          />
        </div>

        <div className="an-divider" />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--an-text3)' }}>Subtotal</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--an-text)' }}>
            ${(items.reduce((sum, item) => sum + item.totalPrice, 0)).toFixed(2)}
          </div>
          {sla > 1 && (
            <div style={{ fontSize: 12, color: 'var(--an-text3)', marginTop: 4 }}>
              SLA Multiplier: ×{sla}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--an-text3)', marginTop: 8 }}>Est. Total</div>
          <div className="an-metric-value" style={{ fontSize: 32 }}>
            ${total.toFixed(2)}
          </div>
          <button
            className="an-btn an-btn-primary"
            style={{ marginTop: 12 }}
            onClick={handleGenerateQuote}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Generating...' : 'Generate Proposal'}
          </button>
        </div>
      </div>
    </div>
  );
};
