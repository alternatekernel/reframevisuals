import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { useAppLock, PIN_HASH_KEY, hashPin } from './AppLockContext';

export const LockScreen: React.FC = () => {
  const { unlock } = useAppLock();
  const hasPinSet = !!localStorage.getItem(PIN_HASH_KEY);

  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const stored = localStorage.getItem(PIN_HASH_KEY);
      if (!stored) { unlock(); return; }
      const entered = await hashPin(pin);
      if (entered === stored) {
        unlock();
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || busy) return;
    if (newPin.length < 4) { setError('PIN must be at least 4 characters.'); return; }
    if (newPin !== confirmPin) { setError('PINs do not match.'); return; }
    setBusy(true);
    setError('');
    try {
      localStorage.setItem(PIN_HASH_KEY, await hashPin(newPin));
      unlock();
    } finally {
      setBusy(false);
    }
  };

  const inputClass = 'h-11 w-full rounded-xl border border-black/15 px-3 text-[14px] outline-none focus:border-black/40 focus:ring-2 focus:ring-black/5 transition-[border-color,box-shadow]';
  const btnClass = 'h-11 w-full rounded-xl bg-black text-[14px] font-bold text-white disabled:opacity-40 transition-opacity';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      {hasPinSet ? (
        <form onSubmit={handleUnlock} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center shrink-0">
              <Lock size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-black leading-tight">Session locked</h2>
              <p className="text-[12px] text-black/50">Enter your quick PIN to continue.</p>
            </div>
          </div>
          <input
            value={pin}
            onChange={e => { setPin(e.target.value); setError(''); }}
            type="password"
            inputMode="numeric"
            autoFocus
            placeholder="PIN"
            className={inputClass}
          />
          {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={!pin || busy} className={btnClass}>
            {busy ? 'Verifying…' : 'Unlock'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSetPin} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center shrink-0">
              <ShieldCheck size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-black leading-tight">Set a quick PIN</h2>
              <p className="text-[12px] text-black/50">Create a PIN to protect this session.</p>
            </div>
          </div>
          <input
            value={newPin}
            onChange={e => { setNewPin(e.target.value); setError(''); }}
            type="password"
            inputMode="numeric"
            autoFocus
            placeholder="New PIN (min 4 digits)"
            className={inputClass}
          />
          <input
            value={confirmPin}
            onChange={e => { setConfirmPin(e.target.value); setError(''); }}
            type="password"
            inputMode="numeric"
            placeholder="Confirm PIN"
            className={inputClass}
          />
          {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={!newPin || !confirmPin || busy} className={btnClass}>
            {busy ? 'Saving…' : 'Set PIN & Unlock'}
          </button>
        </form>
      )}
    </div>
  );
};
