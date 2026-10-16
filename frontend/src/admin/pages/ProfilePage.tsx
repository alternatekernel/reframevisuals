import React, { useEffect, useState } from 'react';
import { UserRound, Save, KeyRound, Lock } from 'lucide-react';
import { adminFetch } from '../utils/api';
import { useAuthProfile } from '../hooks/useAdminData';
import { useToast } from '../ToastContext';
import { PIN_HASH_KEY, hashPin } from '../AppLockContext';

export const ProfilePage: React.FC = () => {
  const { data: profile, refetch } = useAuthProfile();
  const { showToast } = useToast();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  const save = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      // Email is intentionally excluded — changing it here would invalidate the active JWT.
      // Admins must use the password-reset flow to update their email.
      await adminFetch(`/users/${profile.id}`, { method: 'PUT', body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName }) });
      showToast('Saved', 'Profile updated', 'success');
      await refetch();
    } catch (err) {
      showToast('Error', err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendReset = async () => {
    if (!profile?.id) return;
    setResetBusy(true);
    try {
      await adminFetch(`/users/${profile.id}/reset-password`, { method: 'POST' });
      showToast('Sent', 'Password reset link sent to your email', 'success');
    } catch (err) {
      showToast('Error', err instanceof Error ? err.message : 'Failed to send reset link', 'error');
    } finally {
      setResetBusy(false);
    }
  };

  const initial = (form.firstName?.[0] || form.email?.[0] || 'A').toUpperCase();

  return (
    <div className="space-y-5">
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon"><UserRound size={16} strokeWidth={2.5} /></span>
          My Profile
        </div>
        <div className="an-page-desc">Manage your account details and password.</div>
      </div>

      <div className="an-card p-5 max-w-2xl space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-[22px] font-semibold">{initial}</div>
          <div>
            <div className="text-[16px] font-bold text-[var(--an-text)]">{form.firstName} {form.lastName}</div>
            <div className="text-[13px] text-[var(--an-text2)]">{form.email}</div>
            <span className="mt-1 inline-block an-badge an-badge-gray uppercase">{profile?.role || 'staff'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
          <Field label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
          <div className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Email</span>
            <div className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] text-[var(--an-text2)] bg-[var(--an-hover)] select-all">
              {form.email}
            </div>
            <p className="mt-1 text-[11px] text-[var(--an-text3)]">Email cannot be changed here. Contact your administrator.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="an-btn an-btn-primary an-btn-sm"><Save size={14} /> {saving ? 'Saving...' : 'Save Profile'}</button>
        </div>
      </div>

      <div className="an-card p-5 max-w-2xl">
        <div className="flex items-start gap-3 rounded-xl bg-black/[0.03] p-3">
          <KeyRound size={15} className="mt-0.5 shrink-0 text-[var(--an-text2)]" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-[var(--an-text)]">Change your password</div>
            <div className="text-[12px] text-[var(--an-text2)] mt-0.5">We'll email you a secure link to set a new password. Valid for 1 hour.</div>
          </div>
          <button onClick={sendReset} disabled={resetBusy} className="an-btn an-btn-ghost an-btn-sm shrink-0">{resetBusy ? 'Sending…' : 'Send reset link'}</button>
        </div>
      </div>

      <PinSection />
    </div>
  );
};

const PinSection: React.FC = () => {
  const { showToast } = useToast();
  const [hasPinSet, setHasPinSet] = useState(!!localStorage.getItem(PIN_HASH_KEY));
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setCurrentPin(''); setNewPin(''); setConfirmPin(''); setError(''); };

  const handleSave = async () => {
    setError('');
    if (hasPinSet) {
      if (!currentPin) { setError('Enter your current PIN to confirm.'); return; }
      const currentHash = await hashPin(currentPin);
      if (currentHash !== localStorage.getItem(PIN_HASH_KEY)) { setError('Current PIN is incorrect.'); return; }
    }
    if (newPin.length < 4) { setError('New PIN must be at least 4 characters.'); return; }
    if (newPin !== confirmPin) { setError('PINs do not match.'); return; }
    setBusy(true);
    try {
      localStorage.setItem(PIN_HASH_KEY, await hashPin(newPin));
      setHasPinSet(true);
      reset();
      showToast('Saved', 'Quick lock PIN updated', 'success');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setError('');
    if (!currentPin) { setError('Enter your current PIN to remove it.'); return; }
    const currentHash = await hashPin(currentPin);
    if (currentHash !== localStorage.getItem(PIN_HASH_KEY)) { setError('Current PIN is incorrect.'); return; }
    localStorage.removeItem(PIN_HASH_KEY);
    setHasPinSet(false);
    reset();
    showToast('Removed', 'Quick lock PIN removed', 'success');
  };

  const inputClass = 'w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5';

  return (
    <div className="an-card p-5 max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Lock size={14} className="text-[var(--an-text2)]" />
        <div>
          <div className="text-[13px] font-semibold text-[var(--an-text)]">Quick lock PIN</div>
          <div className="text-[12px] text-[var(--an-text2)]">
            {hasPinSet ? 'A PIN is set. The admin panel locks after 10 minutes of inactivity.' : 'No PIN set yet. The session lock will prompt you to create one on first lock.'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {hasPinSet && (
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Current PIN</span>
            <input value={currentPin} onChange={e => { setCurrentPin(e.target.value); setError(''); }} type="password" inputMode="numeric" placeholder="••••" className={inputClass} />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">{hasPinSet ? 'New PIN' : 'PIN'}</span>
          <input value={newPin} onChange={e => { setNewPin(e.target.value); setError(''); }} type="password" inputMode="numeric" placeholder="Min 4 digits" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Confirm PIN</span>
          <input value={confirmPin} onChange={e => { setConfirmPin(e.target.value); setError(''); }} type="password" inputMode="numeric" placeholder="Repeat PIN" className={inputClass} />
        </label>
      </div>

      {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button onClick={handleSave} disabled={busy || !newPin || !confirmPin} className="an-btn an-btn-primary an-btn-sm">
          <Save size={13} /> {busy ? 'Saving…' : hasPinSet ? 'Update PIN' : 'Set PIN'}
        </button>
        {hasPinSet && (
          <button onClick={handleRemove} disabled={busy || !currentPin} className="an-btn an-btn-ghost an-btn-sm text-red-600 hover:text-red-700">
            Remove PIN
          </button>
        )}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40 focus:ring-1 focus:ring-black/5" />
  </label>
);

export default ProfilePage;
