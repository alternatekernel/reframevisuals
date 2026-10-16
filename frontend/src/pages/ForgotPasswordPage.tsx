import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useContent } from '../context/ContentBase';
import { ArrowLeft, MailCheck } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { forgotPassword } = useContent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email');
      setIsLoading(false);
      return;
    }

    const response = await forgotPassword(email);
    if (response.success) {
      setSuccess(true);
    } else {
      setError(response.message || 'Request failed. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-white px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 lg:pt-16 pb-24 relative overflow-hidden flex items-center justify-center">
      <Helmet>
        <title>Reset Password | Reframe Visuals</title>
        <meta name="description" content="Request a secure password reset link to recover your Reframe Visuals account." />
        <link rel="canonical" href="https://reframevisuals.com/forgot-password" />
      </Helmet>

      {/* Subtle Ambient Glow Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[200px] right-[-50px] w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-sky-200/20 to-indigo-200/20 blur-[80px] opacity-70" />
        <div className="absolute bottom-[50px] left-[-50px] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-teal-200/10 to-blue-200/15 blur-[90px] opacity-70" />
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
            {success ? (
              <div className="space-y-6 py-4">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shadow-sm">
                  <MailCheck size={28} className="text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">Check your email</h2>
                  <p className="text-[14px] text-black/60 leading-relaxed">
                    If an account exists for <span className="font-bold text-[var(--color-text-primary)]">{email}</span>, 
                    you will receive a password reset link shortly.
                  </p>
                </div>
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 text-[14px] font-bold text-[var(--color-text-primary)] hover:underline pt-4 transition-all"
                >
                  Return to sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">Account Recovery</h3>
                  <h1 className="text-[36px] sm:text-[40px] font-bold text-[var(--color-text-primary)] tracking-tight leading-[1.1]">Forgot password?</h1>
                  <p className="text-[14px] sm:text-[15px] text-black/60 leading-relaxed">
                    Enter your work email and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                  <div>
                    <label htmlFor="forgot-email" className="mb-1.5 block text-[13px] font-bold text-black/70">Work Email <span className="text-red-600">*</span></label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[14px] font-medium outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-black/30 focus:bg-white focus:ring-1 focus:ring-black/5"
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-[13px] font-semibold">
                      {error}
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex min-h-12 w-full sm:w-max items-center justify-center rounded-full bg-[var(--color-text-primary)] px-8 text-[15px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-black active:scale-95 disabled:opacity-60"
                    >
                      {isLoading ? 'Requesting...' : 'Send reset link'}
                    </button>
                    <Link 
                      to="/login" 
                      className="inline-flex items-center justify-center min-h-12 w-full sm:w-max gap-2 text-[14px] font-bold text-black/40 hover:text-black transition-colors"
                    >
                      Back to sign in
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* RIGHT PANEL: Info content */}
          <div className="relative z-10 w-full md:w-[40%] bg-[var(--color-bg-secondary)] p-6 sm:p-10 flex flex-col justify-center border-t md:border-t-0 border-black/5">
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-black/40 mb-8">Verification Guidelines</h3>
            <div className="space-y-8">
              <div>
                <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Secure Verification</p>
                <p className="text-[14px] text-black/60 mt-1">
                  Reset links are sent strictly to registered work emails. Unconfirmed or non-work domains might require additional team verification.
                </p>
              </div>
              <div>
                <p className="text-[16px] font-bold text-[var(--color-text-primary)]">24-Hour Token Lifespan</p>
                <p className="text-[14px] text-black/60 mt-1">
                  For account security, reset tokens expire automatically after 24 hours. You can request a new link at any time.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

