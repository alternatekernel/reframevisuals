import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';

export const AdminForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setMessage('');
    try {
      await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Always show success to avoid email enumeration
      setStatus('done');
      setMessage('If an account exists with that email, a reset link has been sent. Check your inbox.');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
            </svg>
          </div>
          <span className="text-gray-900 text-lg font-semibold tracking-tight">Reframe Admin</span>
        </div>

        <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Reset your password</h2>
        <p className="text-[15px] text-gray-500 mt-1">Enter your email and we'll send you a reset link.</p>

        {status === 'done' ? (
          <div className="mt-8">
            <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-[14px] text-green-700">{message}</div>
            <Link to="/admin/login" className="mt-4 inline-block text-[13px] text-gray-600 hover:text-gray-900 underline">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-[15px] font-medium text-gray-700 mb-1.5">Email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                className="w-full h-10 border border-gray-200 rounded-lg px-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
              />
            </div>

            {status === 'error' && (
              <div className="text-[14px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">{message}</div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full h-10 bg-gray-900 text-white rounded-lg text-[15px] font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending…' : 'Send reset link'}
            </button>

            <div className="text-right">
              <Link to="/admin/login" className="text-[13px] text-gray-600 hover:text-gray-900 underline">Back to sign in</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminForgotPassword;
