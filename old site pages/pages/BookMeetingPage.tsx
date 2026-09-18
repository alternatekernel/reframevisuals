import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock3, Check, ShieldCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import BookMeetingSuccess from '../sections/bookmeeting/BookMeetingSuccess';

const TIME_SLOTS = ['09:00', '11:00', '14:00', '16:00'];

const getDefaultMeetingDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const BookMeetingPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    meetingDate: getDefaultMeetingDate(),
    meetingTime: TIME_SLOTS[1],
    meetingType: 'Strategy call',
    country: '',
    city: '',
    requestType: 'Physical documentation'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isValid =
    formData.name.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
    formData.company.trim().length > 1 &&
    formData.message.trim().length > 5 &&
    Boolean(formData.meetingDate) &&
    Boolean(formData.meetingTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await fetch('/api/portal/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          metadata: { 
            type: 'Meeting Request', 
            name: formData.name, 
            company: formData.company, 
            description: formData.message,
            meetingDate: formData.meetingDate,
            meetingTime: formData.meetingTime,
            meetingType: formData.meetingType,
            requiresEmailVerification: false
          } 
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitError('Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return <BookMeetingSuccess onBack={() => navigate('/')} />;
  }

  const nextSteps = ['Confirm time', 'Review workflow', 'Map next steps'];

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-white px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 lg:pt-6 pb-24 relative overflow-hidden flex items-start justify-center">
      <Helmet>
        <title>Book Strategy Call & Consultation | Reframe</title>
        <meta name="description" content="Book strategy call with our workflow consultants to discuss catalog scaling, bulk SLAs, integrations, custom rules, and pilot batches." />
        <link rel="canonical" href="https://reframevisuals.com/book-meeting" />
      </Helmet>

      {/* Subtle Ambient Glow Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[200px] right-[-50px] w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-amber-100/20 to-orange-200/20 blur-[80px] opacity-70" />
        <div className="absolute bottom-[50px] left-[-50px] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-yellow-100/10 to-orange-100/15 blur-[90px] opacity-70" />
      </div>

      <div className="mx-auto w-full max-w-5xl relative z-10">
        <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)] flex flex-col md:flex-row">
          
          {/* Logo Watermark Overlay */}
          <div className="pointer-events-none absolute inset-0">
            <img src="/logo.svg" alt="Reframe Visuals" aria-hidden="true" className="absolute -right-24 top-10 h-72 w-72 opacity-[0.035]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/40" />
          </div>

          {/* LEFT PANEL: Form and Date Time Picker */}
          <div className="relative z-10 w-full md:w-[60%] p-6 sm:p-10 lg:p-12 border-b md:border-b-0 md:border-r border-black/5">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">Walkthrough</h3>
              <h1 className="text-[36px] sm:text-[40px] font-bold text-[var(--color-text-primary)] tracking-tight leading-[1.1]">Schedule call</h1>
              <p className="text-[16px] text-black/60 leading-relaxed">
                Book a 30-minute call with our editing team to discuss your workflow, volume, and turnaround needs.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
              
              {/* Date & Time Picker */}
              <div className="rounded-2xl border border-black/10 bg-[var(--color-bg-secondary)] p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-2 text-[13px] font-bold text-black/70">
                  <CalendarDays size={16} />
                  <span>Choose preferred slot</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="meeting-date" className="mb-1 block text-[11px] font-semibold text-black/50">Date</label>
                    <input
                      id="meeting-date"
                      type="date"
                      value={formData.meetingDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                      className="h-[38px] w-full rounded-lg border border-black/10 bg-white px-3 text-[16px] font-medium text-[var(--color-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30"
                      required
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-black/50">
                      <Clock3 size={12} />
                      Time
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setFormData({ ...formData, meetingTime: slot })}
                          className={`h-[38px] rounded-lg text-[12px] font-bold transition-all border ${
                            formData.meetingTime === slot
                              ? 'bg-[var(--color-text-primary)] text-white border-transparent'
                              : 'bg-white text-black/70 border-black/10 hover:border-black/30'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="meeting-name" className="mb-1 block text-[14px] font-semibold text-black/70">Full Name <span className="text-red-600">*</span></label>
                  <input
                    id="meeting-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Cooper"
                    className="w-full rounded-lg border border-black/10 bg-[var(--color-bg-secondary)] px-3 py-2 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="meeting-email" className="mb-1 block text-[14px] font-semibold text-black/70">Work Email <span className="text-red-600">*</span></label>
                  <input
                    id="meeting-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="w-full rounded-lg border border-black/10 bg-[var(--color-bg-secondary)] px-3 py-2 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="meeting-company" className="mb-1 block text-[14px] font-semibold text-black/70">Company <span className="text-red-600">*</span></label>
                  <input
                    id="meeting-company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Studios"
                    className="w-full rounded-lg border border-black/10 bg-[var(--color-bg-secondary)] px-3 py-2 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="meeting-type" className="mb-1 block text-[14px] font-semibold text-black/70">Meeting Option</label>
                  <select
                    id="meeting-type"
                    value={formData.meetingType}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                    className="w-full rounded-lg border border-black/10 bg-[var(--color-bg-secondary)] px-3 py-2 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white h-[38px]"
                  >
                    <option>Strategy call</option>
                    <option>Project discussion</option>
                    <option>High-volume custom SLA</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="meeting-message" className="mb-1 block text-[14px] font-semibold text-black/70">What would you like to discuss? <span className="text-red-600">*</span></label>
                <textarea
                  id="meeting-message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your project needs..."
                  className="h-16 w-full resize-none rounded-lg border border-black/10 bg-[var(--color-bg-secondary)] px-3 py-2 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                  required
                />
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-[13px] font-semibold">
                  {submitError}
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="inline-flex min-h-12 w-full sm:w-max items-center justify-center rounded-full bg-[var(--color-text-primary)] px-8 text-[15px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-black active:scale-95 disabled:opacity-60"
                >
                  {isSubmitting ? 'Booking...' : 'Schedule Call'}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT PANEL: Walkthrough Details */}
          <div className="relative z-10 w-full md:w-[40%] bg-[var(--color-bg-secondary)] p-6 sm:p-10 flex flex-col justify-center border-t md:border-t-0 border-black/5">
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-black/40 mb-6">Meeting Details</h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-green-600" />
                  </div>
                  <span className="text-[14px] text-black/75 font-medium">30-minute strategy call</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-green-600" />
                  </div>
                  <span className="text-[14px] text-black/75 font-medium">Technical workflow walkthrough</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-green-600" />
                  </div>
                  <span className="text-[14px] text-black/75 font-medium">Direct access to our editing team</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-green-600" />
                  </div>
                  <span className="text-[14px] text-black/75 font-medium">Review of your catalog needs</span>
                </div>
              </div>

              {/* Next Steps */}
              <div className="border-t border-black/5 pt-6 space-y-4">
                <p className="text-[12px] font-bold text-black/40 uppercase tracking-[0.14em]">What happens next</p>
                <div className="grid grid-cols-3 gap-2">
                  {nextSteps.map((step, index) => (
                    <div key={step} className="rounded-lg bg-white p-3 border border-black/5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                      <span className="text-[10px] font-bold text-black/30">0{index + 1}</span>
                      <p className="mt-1 text-[11px] font-bold text-[var(--color-text-primary)] leading-tight">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* QA Note */}
              <div className="rounded-xl border border-black/10 bg-[var(--color-text-primary)] p-4 text-white shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-white/60" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">QA Control</p>
                </div>
                <p className="text-[12px] leading-relaxed text-white/70">
                  Every order is reviewed by a senior editor before delivery.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookMeetingPage;
