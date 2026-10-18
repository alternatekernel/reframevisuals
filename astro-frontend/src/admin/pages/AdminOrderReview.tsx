import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminFetch, API_BASE_URL } from '../utils/api';

// <img> cannot send the admin Authorization header, so proxied asset URLs carry the
// admin token as a query param — the same pattern the admin SSE endpoints use.
const adminAssetSrc = (previewUrl?: string, fallback?: string): string | undefined => {
  if (!previewUrl) return fallback;
  const token = localStorage.getItem('admin_token');
  const base = previewUrl.startsWith('/api/')
    ? `${API_BASE_URL.replace(/\/api\/?$/, '')}${previewUrl}`
    : previewUrl;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
};

interface OrderImage { id: string; url?: string; previewUrl?: string; rawUrl?: string; filename?: string }
interface OrderData {
  id: string;
  code: string;
  title: string;
  description?: string;
  volume: number;
  serviceType?: string;
  status: string;
  images: OrderImage[];
  customFilesLink?: string;
  customFilesCount?: number;
}

interface AddonItem { label: string; price: number }

const PRESETS = [
  { label: 'Standard', price: 1.99 },
  { label: 'Premium', price: 4.99 },
  { label: 'Complex', price: 9.99 },
];

const QUICK_ADDONS: AddonItem[] = [
  { label: 'shadow', price: 0.4 },
  { label: 'masking', price: 0.8 },
  { label: 'wrinkle-smoothing', price: 0.7 },
];

export const AdminOrderReview: React.FC = () => {
  const nav = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [basePricePerImage, setBasePricePerImage] = useState(1.99);
  // Default (per-image preset x volume) vs Custom (one agreed total). These are
  // mutually exclusive: a custom price used to be addable only as an extra add-on,
  // so it stacked on top of the default instead of replacing it.
  const [priceMode, setPriceMode] = useState<'default' | 'custom'>('default');
  const [customTotal, setCustomTotal] = useState('');
  const [slaMultiplier, setSlaMultiplier] = useState(1);
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [customLabel, setCustomLabel] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [dispatchEmail, setDispatchEmail] = useState(true);
  const [dispatchTelegram, setDispatchTelegram] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    adminFetch<OrderData>(`/orders/${orderId}`).then((data) => {
      setOrder(data);
      if (data.images?.length) setActiveImageId(data.images[0].id);
    });
  }, [orderId]);

  const activeImage = useMemo(() => order?.images?.find((i) => i.id === activeImageId) || order?.images?.[0] || null, [order, activeImageId]);

  const breakdown = useMemo(() => {
    const volume = Number(order?.volume || 0);
    const baseTotal = volume * basePricePerImage;
    const addonPerImage = addons.reduce((sum, a) => sum + Number(a.price || 0), 0);
    const addonTotal = volume * addonPerImage;
    const subtotal = baseTotal + addonTotal;
    const computedTotal = subtotal * slaMultiplier;
    const custom = Number(customTotal);
    const total = priceMode === 'custom' && Number.isFinite(custom) && custom > 0
      ? custom
      : computedTotal;
    return { volume, baseTotal, addonTotal, subtotal, computedTotal, total };
  }, [order?.volume, basePricePerImage, addons, slaMultiplier, priceMode, customTotal]);

  const addCustomAddon = () => {
    const label = customLabel.trim();
    const price = Number(customPrice);
    if (!label || Number.isNaN(price) || price <= 0) return;
    setAddons((prev) => [...prev, { label, price }]);
    setCustomLabel('');
    setCustomPrice('');
  };

  const submitProposal = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      await adminFetch(`/orders/${order.id}/proposal`, {
        method: 'POST',
        body: JSON.stringify({
          basePricePerImage: priceMode === 'custom' && breakdown.volume > 0
            ? breakdown.total / breakdown.volume
            : basePricePerImage,
          addons: priceMode === 'custom' ? [] : addons,
          totalPrice: breakdown.total,
          priceMode,
          adminNotes,
          slaMultiplier,
          dispatch: { email: dispatchEmail, telegram: dispatchTelegram },
        }),
      });
      nav('/admin/production');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return <div className="p-6">Loading review workspace...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      <section className="rounded-2xl border border-[var(--an-border)] bg-white p-4">
        <h2 className="text-lg font-bold mb-3">Visual Asset Review</h2>
        <div className="mb-3 rounded-xl bg-[var(--an-sidebar)] p-3 min-h-[320px] flex items-center justify-center">
          {adminAssetSrc(activeImage?.previewUrl, activeImage?.url || activeImage?.rawUrl)
            ? <img src={adminAssetSrc(activeImage?.previewUrl, activeImage?.url || activeImage?.rawUrl)} alt="Order image preview" className="max-h-[300px] w-auto rounded" />
            : 'No preview'}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {order.images?.map((img) => (
            <button key={img.id} onClick={() => setActiveImageId(img.id)} className="h-16 w-16 rounded border overflow-hidden">
              {adminAssetSrc(img.previewUrl, img.url || img.rawUrl)
                ? <img src={adminAssetSrc(img.previewUrl, img.url || img.rawUrl)} alt="Order thumbnail" className="h-full w-full object-cover" />
                : null}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-[var(--an-sidebar)] p-3 text-sm text-left">
          <div><b>Order:</b> {order.code}</div>
          <div><b>Service:</b> {order.serviceType || 'standard'}</div>
          <div><b>Volume:</b> {order.volume}</div>
          {order.customFilesLink && (
            <div>
              <b>Files Link:</b>{' '}
              <a href={order.customFilesLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 break-all">
                {order.customFilesLink}
              </a>
            </div>
          )}
          <div><b>Spec:</b> {order.description || 'No extra brief'}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--an-border)] bg-white p-4">
        <h2 className="text-lg font-bold mb-3">Price Estimation Panel</h2>
        <div className="mb-3 flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="price-mode"
              checked={priceMode === 'default'}
              onChange={() => setPriceMode('default')}
            />
            Reframe default price
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="price-mode"
              checked={priceMode === 'custom'}
              onChange={() => setPriceMode('custom')}
            />
            Custom price
          </label>
        </div>

        {priceMode === 'custom' && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm">Agreed total $</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={customTotal}
              onChange={(e) => setCustomTotal(e.target.value)}
              placeholder={breakdown.computedTotal.toFixed(2)}
              className="w-32 rounded-lg border border-[var(--an-border)] px-2 py-1 outline-none transition-[border-color,box-shadow] duration-200 focus:border-black/40 focus:ring-1 focus:ring-black/5"
            />
            <span className="text-xs text-[var(--an-text3)]">
              Replaces the calculated total; the client sees this figure.
            </span>
          </div>
        )}

        <fieldset disabled={priceMode === 'custom'} className={priceMode === 'custom' ? 'opacity-50' : ''}>
        <div className="flex gap-2 mb-3">{PRESETS.map((p) => <button key={p.label} onClick={() => setBasePricePerImage(p.price)} className={`px-3 py-1.5 rounded border ${basePricePerImage === p.price ? 'border-black bg-black text-white' : ''}`}>{p.label}: ${p.price}</button>)}</div>
        <div className="flex gap-2 mb-3">{QUICK_ADDONS.map((a) => <button key={a.label} onClick={() => setAddons((prev) => [...prev, a])} className="px-3 py-1.5 rounded border">+ {a.label}</button>)}</div>
        <div className="flex gap-2 mb-3">
          <input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="custom label" className="rounded-lg border border-[var(--an-border)] px-2 py-1 outline-none transition-[border-color,box-shadow] duration-200 focus:border-black/40 focus:ring-1 focus:ring-black/5" />
          <input value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="price" className="w-24 rounded-lg border border-[var(--an-border)] px-2 py-1 outline-none transition-[border-color,box-shadow] duration-200 focus:border-black/40 focus:ring-1 focus:ring-black/5" />
          <button onClick={addCustomAddon} className="px-3 py-1.5 rounded border">Add</button>
        </div>
        <div className="mb-3 flex gap-2">
          <button onClick={() => setSlaMultiplier(1.35)} className="px-3 py-1.5 rounded border">Priority 1.35x</button>
          <button onClick={() => setSlaMultiplier(1.65)} className="px-3 py-1.5 rounded border">Emergency 1.65x</button>
          <button onClick={() => setSlaMultiplier(1)} className="px-3 py-1.5 rounded border">Standard 1.00x</button>
        </div>
        </fieldset>

        <div className="rounded-xl bg-[var(--an-sidebar)] p-3 text-sm space-y-1 mb-3">
          <div>Base total: ${breakdown.baseTotal.toFixed(2)}</div>
          <div>Addons total: ${breakdown.addonTotal.toFixed(2)}</div>
          <div>Subtotal: ${breakdown.subtotal.toFixed(2)}</div>
          <div>SLA multiplier: x{slaMultiplier.toFixed(2)}</div>
          {priceMode === 'custom' && (
            <div className="text-[var(--an-text3)]">
              Calculated total: ${breakdown.computedTotal.toFixed(2)} (overridden)
            </div>
          )}
          <div className="font-bold">Final total: ${breakdown.total.toFixed(2)}</div>
        </div>

        <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="mb-3 h-24 w-full rounded-lg border border-[var(--an-border)] p-2 outline-none transition-[border-color,box-shadow] duration-200 focus:border-black/40 focus:ring-1 focus:ring-black/5" placeholder="Admin notes" />
        <div className="flex gap-4 mb-4 text-sm">
          <label><input type="checkbox" checked={dispatchEmail} onChange={(e) => setDispatchEmail(e.target.checked)} /> Email</label>
          <label><input type="checkbox" checked={dispatchTelegram} onChange={(e) => setDispatchTelegram(e.target.checked)} /> Telegram</label>
        </div>

        <button onClick={submitProposal} disabled={submitting} className="px-4 py-2 rounded bg-black text-white">
          {submitting ? 'Dispatching...' : 'Dispatch Proposal'}
        </button>
      </section>
    </div>
  );
};

export default AdminOrderReview;
