import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useContent } from '../context/ContentBase';
import { ShieldAlert, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { resetPassword } = useContent();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  useEffect(() => {
    if (!isSuccess) return;
    if (countdown <= 0) { navigate('/login'); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isSuccess, countdown, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError('');
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const response = await resetPassword(token, password);
    
    if (response.success) {
      setIsSuccess(true);
    } else {
      setError(response.message || 'Reset failed. The link may have expired.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-white px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 lg:pt-16 pb-24 relative overflow-hidden flex items-center justify-center">
      <Helmet>
        <title>Set New Password | Reframe Visuals</title>
        <meta name="description" content="Securely set a new password for your Reframe Visuals account." />
        <link rel="canonical" href="https://reframevisuals.com/reset-password" />
      </Helmet>

      {/* Subtle Ambient Glow Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[200px] right-[-50px] w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-sky-200/20 to-purple-200/20 blur-[80px] opacity-70" />
        <div className="absolute bottom-[50px] left-[-50px] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-indigo-100/10 to-blue-200/15 blur-[90px] opacity-70" />
      </div>

      <div className="mx-auto w-full max-w-5xl relative z-10">
        <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)] flex flex-col md:flex-row">
          
          {/* Logo Watermark Overlay */}
          <div className="pointer-events-none absolute inset-0">
            <img src="/logo.svg" alt="Reframe Visuals" aria-hidden="true" className="absolute -right-24 top-10 h-72 w-72 opacity-[0.035]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/40" />
          </div>

          {/* LEFT PANEL: Form / Success content */}
          <div className="relative z-10 w-full md:w-[60%] p-6 sm:p-10 lg:p-12 border-b md:border-b-0 md:border-r border-black/5">
            {isSuccess ? (
              <div className="space-y-6 py-4">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shadow-sm">
                  <KeyRound size={28} className="text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">Password Updated</h2>
                  <p className="text-[14px] text-black/60 leading-relaxed">
                    Your password has been successfully reset. Redirecting to sign in in {countdown}...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">Security Update</h3>
                  <h1 className="text-[36px] sm:text-[40px] font-bold text-[var(--color-text-primary)] tracking-tight leading-[1.1]">Set new password</h1>
                  <p className="text-[14px] sm:text-[15px] text-black/60 leading-relaxed">
                    Please choose a secure password for your account.
                  </p>
                </div>

                {!token ? (
                  <div className="mt-8 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                    <ShieldAlert className="text-red-600 shrink-0" size={20} />
                    <div className="space-y-1">
                      <p className="text-[14px] font-bold text-red-700">Invalid Reset Link</p>
                      <p className="text-[13px] text-red-600 leading-relaxed">This link is missing a security token or has expired.</p>
                      <Link to="/forgot-password" className="text-[13px] font-bold text-red-700 hover:underline mt-2 block transition-all">Request a new link</Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-bold text-black/70">New Password <span className="text-red-600">*</span></label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[14px] font-medium outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-black/30 focus:bg-white focus:ring-1 focus:ring-black/5 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[13px] font-bold text-black/70">Confirm New Password <span className="text-red-600">*</span></label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[14px] font-medium outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-black/30 focus:bg-white focus:ring-1 focus:ring-black/5"
                        required
                      />
                    </div>

                    {error && (
                      <div className="p-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-[13px] font-semibold">
                        {error}
                      </div>
                    )}

                    <div className="pt-2">
                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex min-h-12 w-full sm:w-max items-center justify-center rounded-full bg-[var(--color-text-primary)] px-8 text-[15px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-black active:scale-95 disabled:opacity-60"
                      >
                        {isLoading ? 'Updating...' : 'Reset password'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          {/* RIGHT PANEL: Info content */}
          <div className="relative z-10 w-full md:w-[40%] bg-[var(--color-bg-secondary)] p-6 sm:p-10 flex flex-col justify-center border-t md:border-t-0 border-black/5">
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-black/40 mb-8">Password Guidelines</h3>
            <div className="space-y-8">
              <div>
                <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Minimum Length</p>
                <p className="text-[14px] text-black/60 mt-1">
                  Passwords must contain at least 8 characters. We recommend combining letters, numbers, and special symbols.
                </p>
              </div>
              <div>
                <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Avoid Common Words</p>
                <p className="text-[14px] text-black/60 mt-1">
                  Ensure your password does not contain names, birthdates, or common dictionary words.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

