import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminFetch } from '../utils/api';

export const AdminResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const token = useMemo(() => (params.get('token') || '').trim(), [params]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage('Reset token is missing.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      await adminFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      setStatus('success');
      setMessage('Password updated. You can now sign in.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
      <div className="w-full max-w-[420px] rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-[22px] font-bold text-gray-900">Admin reset password</h1>
        <p className="mt-1 text-[14px] text-gray-500">Set a new password for your admin account.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 outline-none transition-[border-color,box-shadow] duration-200 focus:border-black/40 focus:ring-1 focus:ring-black/5" />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1">Confirm password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 outline-none transition-[border-color,box-shadow] duration-200 focus:border-black/40 focus:ring-1 focus:ring-black/5" />
          </div>

          {message && (
            <div className={`text-[14px] rounded-lg px-3 py-2 ${status === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message}
            </div>
          )}

          <button disabled={status === 'loading'} className="w-full h-10 bg-gray-900 text-white rounded-lg text-[14px] font-medium">
            {status === 'loading' ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <div className="mt-4">
          <Link to="/admin/login" className="text-[14px] text-gray-700 underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
};
