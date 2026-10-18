import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLogin } from './hooks/useAdminData';

const hasUsableAdminToken = (token: string | null): boolean => {
  if (!token) return false;
  const trimmed = token.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  return trimmed.length > 10;
};

const LoginPageInner: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginMutation = useLogin();
  const token = localStorage.getItem('admin_token');
  const isAdminAuthenticated = hasUsableAdminToken(token);

  const getSafeRedirectTarget = React.useCallback(() => {
    const requestedRedirect = searchParams.get('redirect');
    if (!requestedRedirect) return '/admin';

    try {
      const decoded = decodeURIComponent(requestedRedirect);
      // Keep redirects inside the admin app only. This preserves Telegram deep
      // links like /admin/chats/:conversationId but avoids open redirects.
      return decoded.startsWith('/admin') && !decoded.startsWith('/admin/login')
        ? decoded
        : '/admin';
    } catch {
      return '/admin';
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (token && !isAdminAuthenticated) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  }, [isAdminAuthenticated, token]);

  React.useEffect(() => {
    if (isAdminAuthenticated) {
      navigate(getSafeRedirectTarget(), { replace: true });
    }
  }, [getSafeRedirectTarget, isAdminAuthenticated, navigate]);

  const handleLogin = async () => {
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    loginMutation.mutate({
      email: username.trim(),
      password: password.trim(),
    }, {
      onSuccess: (response) => {
        if (response.data) {
          // Success is handled by the hook's onSuccess (localStorage set).
          // Preserve deep links from Telegram notifications after login.
          setTimeout(() => {
            window.location.href = getSafeRedirectTarget();
          }, 50);
        } else if (response.error) {
          setError(response.error.message || 'Invalid username or password');
        }
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || 'Connection failed. Please try again.');
      }
    });
  };

  if (isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-[15px] mb-3">Redirecting to dashboard...</p>
          <a href="/admin" className="text-[15px] text-gray-900 underline">Click here if not redirected</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
              </svg>
            </div>
            <span className="text-white text-xl font-semibold tracking-tight">Reframe</span>
          </div>
          <h1 className="text-white text-[32px] font-bold leading-tight tracking-tight">
            Manage your platform.
          </h1>
          <p className="text-white/40 text-[15px] mt-4 leading-relaxed">
            Update content, adjust pricing, customize fonts and colors, and manage your services - all from one place.
          </p>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[340px]">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
              </svg>
            </div>
            <span className="text-gray-900 text-lg font-semibold tracking-tight">Reframe Admin</span>
          </div>

          <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Sign in</h2>
          <p className="text-[15px] text-gray-500 mt-1">Enter your credentials to continue</p>

          <div className="mt-8 space-y-4">
            <div>
              <label htmlFor="admin-username" className="block text-[15px] font-medium text-gray-700 mb-1.5">Email</label>
              <input
                id="admin-username"
                type="email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full h-10 border border-gray-200 rounded-lg px-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                placeholder="your@email.com"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-[15px] font-medium text-gray-700 mb-1.5">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full h-10 border border-gray-200 rounded-lg px-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div className="text-[15px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loginMutation.isPending}
              className="w-full h-10 bg-gray-900 text-white rounded-lg text-[15px] font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </button>
            <div className="text-right">
              <Link to="/admin/forgot-password" className="text-[13px] text-gray-600 hover:text-gray-900 underline">Forgot password?</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

type LoginErrorBoundaryState = { hasError: boolean; message: string };

class LoginErrorBoundary extends React.Component<{ children: React.ReactNode }, LoginErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): LoginErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Unexpected admin login error.' };
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
        <div className="w-full max-w-[520px] rounded-xl border border-red-200 bg-white p-6">
          <h1 className="text-[20px] font-semibold text-gray-900">Admin login failed to initialize</h1>
          <p className="mt-2 text-[14px] text-gray-600">{this.state.message}</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="h-9 rounded-lg bg-gray-900 px-4 text-[14px] font-medium text-white hover:bg-gray-800"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-9 rounded-lg border border-gray-300 px-4 text-[14px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export const LoginPage: React.FC = () => (
  <LoginErrorBoundary>
    <LoginPageInner />
  </LoginErrorBoundary>
);
