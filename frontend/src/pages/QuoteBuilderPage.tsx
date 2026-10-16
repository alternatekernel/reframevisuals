import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, ShieldCheck, Calculator } from 'lucide-react';

interface ServicePrice {
  id: string;
  name: string;
  price: number;
}

const SERVICES: ServicePrice[] = [
  { id: 'bg-removal', name: 'Background Removal', price: 1.00 },
  { id: 'clipping-path', name: 'Clipping Path', price: 1.25 },
  { id: 'ghost-mannequin', name: 'Ghost Mannequin', price: 3.00 },
  { id: 'jewelry-retouch', name: 'Jewelry Retouching', price: 4.00 },
  { id: 'garment-retouch', name: 'Garment Retouching', price: 2.50 },
  { id: 'model-retouch', name: 'Model Retouching', price: 5.00 },
];

const QuoteBuilderPage: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>(['bg-removal']);
  const [volume, setVolume] = useState<number>(100);
  const [turnaround, setTurnaround] = useState<string>('48');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleServiceToggle = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(x => x !== id) : prev)
        : [...prev, id]
    );
  };

  // Base price calculation
  const selectedBaseRate = SERVICES
    .filter(s => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const rawSubtotal = selectedBaseRate * volume;

  // Volume discount calculation
  let discountPercent = 0;
  if (volume >= 2000) discountPercent = 30;
  else if (volume >= 500) discountPercent = 20;
  else if (volume >= 100) discountPercent = 10;

  const discountAmount = rawSubtotal * (discountPercent / 100);
  const discountedSubtotal = rawSubtotal - discountAmount;

  // Turnaround multiplier
  let turnaroundMultiplier = 1.0;
  if (turnaround === '12') turnaroundMultiplier = 1.5;
  else if (turnaround === '24') turnaroundMultiplier = 1.25;

  const estimatedTotal = discountedSubtotal * turnaroundMultiplier;

  const isValid = 
    name.trim().length > 1 && 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && 
    company.trim().length > 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    setError('');

    const activeServicesNames = SERVICES
      .filter(s => selectedServices.includes(s.id))
      .map(s => s.name)
      .join(', ');

    const messageContent = `Quote Details:
- Services: ${activeServicesNames}
- Image Volume: ${volume} images
- Turnaround SLA: ${turnaround}h
- Estimated Total: $${estimatedTotal.toFixed(2)}`;

    try {
      const response = await fetch('/api/portal/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          metadata: {
            type: 'Quote Builder Request',
            name: name.trim(),
            email: email.trim(),
            company: company.trim(),
            message: messageContent,
          },
        }),
      });

      if (!response.ok) throw new Error('Quote request submission failed');
      setSubmitted(true);
    } catch {
      setError('Unable to send quote request. Please email hello@reframevisuals.com.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-white px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 lg:pt-6 pb-12 sm:pb-16 lg:pb-24 relative overflow-hidden flex items-start justify-center">
      <Helmet>
        <title>Interactive Quote Builder | Reframe Visuals</title>
        <meta name="description" content="Build an instant price estimate for your product image editing project based on service selection, image volume, and turnaround SLA requirements." />
        <link rel="canonical" href="https://reframevisuals.com/quote-builder" />
      </Helmet>

      {/* Subtle Ambient Glow Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[200px] right-[-50px] w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-purple-200/20 to-sky-200/20 blur-[80px] opacity-70" />
        <div className="absolute bottom-[50px] left-[-50px] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-indigo-100/10 to-cyan-200/15 blur-[90px] opacity-70" />
      </div>

      <div className="mx-auto w-full max-w-5xl relative z-10">
        <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)] flex flex-col md:flex-row">
          
          {/* Logo Watermark Overlay */}
          <div className="pointer-events-none absolute inset-0">
            <img src="/logo.svg" alt="Reframe Visuals" aria-hidden="true" className="absolute -right-24 top-10 h-72 w-72 opacity-[0.035]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/40" />
          </div>

          {/* LEFT PANEL: Form / Calculator */}
          <div className="relative z-10 w-full md:w-[60%] p-6 sm:p-10 lg:p-12 border-b md:border-b-0 md:border-r border-black/5">
            {submitted ? (
              <div className="space-y-6 py-4">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shadow-sm">
                  <Check size={28} className="text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">Estimate Requested</h2>
                  <p className="text-[14px] text-black/60 leading-relaxed">
                    We've received your scoped request. A coordination manager will email a formal production proposal to <span className="font-bold text-[var(--color-text-primary)]">{email}</span> within 30 minutes.
                  </p>
                </div>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="inline-flex min-h-12 w-full sm:w-max items-center justify-center rounded-full border border-black/10 bg-white px-6 text-[14px] font-semibold text-[var(--color-text-primary)] shadow-sm hover:bg-[var(--color-bg-secondary)] transition-all duration-300"
                >
                  Build another quote
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">Interactive Estimator</h3>
                  <h1 className="text-[36px] sm:text-[40px] font-bold text-[var(--color-text-primary)] tracking-tight leading-[1.1]">Estimate project</h1>
                  <p className="text-[16px] text-black/60 leading-relaxed">
                    Select your service mix, volume, and turnaround time to calculate an estimate.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
                  
                  {/* Service mix checklist */}
                  <div className="space-y-2.5">
                    <label className="text-[14px] font-semibold text-black/70">1. Select Service Mix</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SERVICES.map((service) => {
                        const isSelected = selectedServices.includes(service.id);
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => handleServiceToggle(service.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left text-[13px] font-semibold ${
                              isSelected
                                ? 'bg-black text-white border-transparent'
                                : 'bg-[var(--color-bg-secondary)] border-black/10 text-black/70 hover:border-black/30'
                            }`}
                          >
                            <span>{service.name}</span>
                            <span className={isSelected ? 'text-white/60' : 'text-black/40'}>
                              ${service.price.toFixed(2)}/ea
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Volume Input & Turnaround */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="quote-volume" className="mb-1.5 block text-[14px] font-semibold text-black/70">2. Image Volume</label>
                      <input
                        id="quote-volume"
                        type="number"
                        min={10}
                        max={50000}
                        value={volume}
                        onChange={(e) => setVolume(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                        required
                      />
                      {discountPercent > 0 && (
                        <p className="text-[11px] text-green-600 font-semibold mt-1 px-1">
                          ✓ Volume discount of {discountPercent}% applied
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="quote-turnaround" className="mb-1.5 block text-[14px] font-semibold text-black/70">3. Turnaround SLA</label>
                      <select
                        id="quote-turnaround"
                        value={turnaround}
                        onChange={(e) => setTurnaround(e.target.value)}
                        className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white h-[46px]"
                      >
                        <option value="48">48h Relaxed (Base)</option>
                        <option value="24">24h Standard (+25%)</option>
                        <option value="12">12h Express (+50%)</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing metrics panel */}
                  <div className="rounded-2xl border border-black/10 bg-[var(--color-bg-secondary)] p-4 sm:p-5 space-y-2.5">
                    <div className="flex justify-between text-[13px] text-black/60 font-semibold">
                      <span>Rate per image</span>
                      <span>${selectedBaseRate.toFixed(2)}</span>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-[13px] text-green-600 font-semibold">
                        <span>Volume discount ({discountPercent}%)</span>
                        <span>-${(discountAmount / volume).toFixed(2)} /ea</span>
                      </div>
                    )}
                    {turnaroundMultiplier > 1 && (
                      <div className="flex justify-between text-[13px] text-black/60 font-semibold">
                        <span>Turnaround fee (+{Math.round((turnaroundMultiplier - 1) * 100)}%)</span>
                        <span>x{turnaroundMultiplier}</span>
                      </div>
                    )}
                    <div className="border-t border-black/5 pt-2 flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-[14px] font-bold text-black/80">
                        <Calculator size={16} />
                        <span>Estimated Total</span>
                      </div>
                      <span className="text-[24px] font-bold text-[var(--color-text-primary)]">
                        ${estimatedTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Lead Submission Form */}
                  <div className="border-t border-black/5 pt-4 space-y-4">
                    <h4 className="text-[14px] font-semibold text-black/70">4. Request Formal Proposal</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="quote-name" className="mb-1.5 block text-[14px] font-semibold text-black/70">Your Name <span className="text-red-600">*</span></label>
                        <input
                          id="quote-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="quote-company" className="mb-1.5 block text-[14px] font-semibold text-black/70">Company Name <span className="text-red-600">*</span></label>
                        <input
                          id="quote-company"
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="quote-email" className="mb-1.5 block text-[14px] font-semibold text-black/70">Work Email <span className="text-red-600">*</span></label>
                      <input
                        id="quote-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-[13px] font-semibold">
                      {error}
                    </div>
                  )}

                  <div className="pt-2">
                    <button 
                      type="submit"
                      disabled={isSubmitting || !isValid}
                      className="inline-flex min-h-12 w-full sm:w-max items-center justify-center rounded-full bg-[var(--color-text-primary)] px-8 text-[15px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-black active:scale-95 disabled:opacity-60"
                    >
                      {isSubmitting ? 'Requesting...' : 'Request this Quote'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* RIGHT PANEL: Pricing Standards */}
          <div className="relative z-10 w-full md:w-[40%] bg-[var(--color-bg-secondary)] p-6 sm:p-10 flex flex-col justify-center border-t md:border-t-0 border-black/5">
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-black/40 mb-8">Pricing Standards</h3>
            <div className="space-y-8">
              <div>
                <p className="text-[16px] font-bold text-[var(--color-text-primary)]">100% Hand-Drawn Paths</p>
                <p className="text-[14px] text-black/60 mt-1">
                  We do not rely on lazy automated segmentation. Every cutout and vector path is meticulously hand-drawn using the Photoshop Pen Tool.
                </p>
              </div>
              <div>
                <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Turnaround Timeline SLA</p>
                <p className="text-[14px] text-black/60 mt-1">
                  Timeline windows begin the moment payment details or credit slots are verified, and delivery performance is guaranteed.
                </p>
              </div>
              <div>
                <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Tiered Volume Discounts</p>
                <p className="text-[14px] text-black/60 mt-1">
                  The larger your catalog, the more you save. Discount tiers apply automatically to bulk orders over 100 images.
                </p>
              </div>
              <div className="pt-4 border-t border-black/5 flex items-center gap-2">
                <ShieldCheck size={16} className="text-black/40" />
                <span className="text-[12px] text-black/40 font-semibold tracking-wide">SOC2 & Transit Encrypted</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QuoteBuilderPage;
