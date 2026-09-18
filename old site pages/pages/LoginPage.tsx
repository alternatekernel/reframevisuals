import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useContent } from '../context/ContentBase';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { userLogin } = useContent();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const response = await userLogin(email, password);
    if (response.success) {
      navigate('/dashboard');
    } else {
      setError(response.message || 'Invalid email or password');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-white px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 lg:pt-16 pb-24 relative overflow-hidden flex items-center justify-center">
      <Helmet>
        <title>Sign In | Reframe Visuals</title>
        <meta name="description" content="Sign in to your Reframe Visuals portal to manage your product photo editing orders, downloads, and communication." />
        <link rel="canonical" href="https://reframevisuals.com/login" />
      </Helmet>

      {/* Subtle Ambient Glow Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[200px] right-[-50px] w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-purple-200/20 to-pink-200/20 blur-[80px] opacity-70" />
        <div className="absolute bottom-[50px] left-[-50px] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-violet-100/10 to-fuchsia-200/15 blur-[90px] opacity-70" />
      </div>

      <div className="mx-auto w-full max-w-5xl relative z-10">
        <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)] flex flex-col md:flex-row">
          
          {/* Logo Watermark Overlay */}
          <div className="pointer-events-none absolute inset-0">
            <img src="/logo.svg" alt="Reframe Visuals" aria-hidden="true" className="absolute -right-24 top-10 h-72 w-72 opacity-[0.035]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/40" />
          </div>

          {/* LEFT PANEL: Sign In Form */}
          <div className="relative z-10 w-full md:w-[60%] p-6 sm:p-10 lg:p-12 border-b md:border-b-0 md:border-r border-black/5">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">Identity Verification</h3>
              <h1 className="text-[36px] sm:text-[40px] font-bold text-[var(--color-text-primary)] tracking-tight leading-[1.1]">Welcome back</h1>
              <p className="text-[16px] text-black/60 leading-relaxed">
                Sign in to manage your editing orders, deliveries, and revision requests.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-[14px] font-semibold text-black/70">Work Email <span className="text-red-600">*</span></label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="text-[14px] font-semibold text-black/70">Password <span className="text-red-600">*</span></label>
                  <Link to="/forgot-password" className="text-[11px] font-bold text-black/40 hover:text-black transition-colors">Forgot Password?</Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white pr-10"
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

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-black/10 text-black focus:ring-black accent-black cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-[13px] text-black/60 cursor-pointer select-none">
                  Keep me signed in for 30 days
                </label>
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
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 pt-2">
                <div className="h-px flex-1 bg-black/10" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-black/30">or</span>
                <div className="h-px flex-1 bg-black/10" />
              </div>

              {/* Google Sign In — only rendered when the OAuth client is configured */}
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <GoogleAuthButton
                  text="signin_with"
                  onStart={() => setIsLoading(true)}
                  onError={(msg) => { setError(msg); setIsLoading(false); }}
                />
              )}

              <div className="mt-6 text-center border-t border-black/10 pt-5 sm:text-left">
                <p className="text-[14px] text-black/60">
                  New to Reframe?{' '}
                  <Link to="/signup" className="text-[var(--color-text-primary)] font-bold underline transition-all">
                    Create account
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* RIGHT PANEL: Stats / Info */}
          <div className="relative z-10 w-full md:w-[40%] bg-[var(--color-bg-secondary)] p-6 sm:p-10 flex flex-col justify-center border-t md:border-t-0 border-black/5">
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-black/40 mb-8">Reframe Platform</h3>
            <div className="space-y-8">
              <div>
                <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Response Guarantee</p>
                <p className="text-[14px] text-black/60 mt-1">Our support team is online 24/7. Median response time on active projects is ≤ 30 minutes.</p>
              </div>
              <div>
                <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Quality Thresholds</p>
                <p className="text-[14px] text-black/60 mt-1">Every batch passes a dual-stage quality control checklist before delivery.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;

