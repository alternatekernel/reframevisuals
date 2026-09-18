import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useContent } from '../context/ContentBase';
import { Check, ShieldCheck } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';

const SignUpPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup } = useContent();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name || !email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid work email');
      setIsLoading(false);
      return;
    }

    const response = await signup(name, email, password);
    if (response.success) {
      navigate('/dashboard');
    } else {
      setError(response.message || 'Signup failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-white px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 lg:pt-16 pb-24 relative overflow-hidden flex items-center justify-center">
      <Helmet>
        <title>Create Account | Reframe Visuals</title>
        <meta name="description" content="Register your studio or brand for a secure Reframe Visuals account to start processing images." />
        <link rel="canonical" href="https://reframevisuals.com/signup" />
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

          {/* LEFT PANEL: SignUp Form */}
          <div className="relative z-10 w-full md:w-[60%] p-6 sm:p-10 lg:p-12 border-b md:border-b-0 md:border-r border-black/5">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">Account Deployment</h3>
              <h1 className="text-[36px] sm:text-[40px] font-bold text-[var(--color-text-primary)] tracking-tight leading-[1.1]">Join the platform</h1>
              <p className="text-[16px] text-black/60 leading-relaxed">
                Connect your studio to the high-performance visual processing engine.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              <div>
                <label htmlFor="signup-name" className="mb-1.5 block text-[14px] font-semibold text-black/70">Full Name <span className="text-red-600">*</span></label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Cooper"
                  className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="mb-1.5 block text-[14px] font-semibold text-black/70">Work Email <span className="text-red-600">*</span></label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="mb-1.5 block text-[14px] font-semibold text-black/70">Password <span className="text-red-600">*</span></label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
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
                  {isLoading ? 'Deploying...' : 'Create account'}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 pt-2">
                <div className="h-px flex-1 bg-black/10" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-black/30">or</span>
                <div className="h-px flex-1 bg-black/10" />
              </div>

              {/* Google Sign Up — only rendered when the OAuth client is configured */}
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <GoogleAuthButton
                  text="signup_with"
                  onStart={() => setIsLoading(true)}
                  onError={(msg) => { setError(msg); setIsLoading(false); }}
                />
              )}

              <div className="mt-6 text-center border-t border-black/10 pt-5 sm:text-left">
                <p className="text-[14px] text-black/60">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[var(--color-text-primary)] font-bold underline transition-all">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* RIGHT PANEL: What's included */}
          <div className="relative z-10 w-full md:w-[40%] bg-[var(--color-bg-secondary)] p-6 sm:p-10 flex flex-col justify-center border-t md:border-t-0 border-black/5">
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-black/40 mb-8">What's Included</h3>
            <div className="space-y-6">
              {[
                'Unlimited high-performance image processing',
                'Priority technical support and consultation',
                'Enterprise-grade security and encryption',
                'Integrated studio workflow management'
              ].map((text) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-green-600" />
                  </div>
                  <span className="text-[14px] text-black/75 font-medium leading-normal">{text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SignUpPage;

