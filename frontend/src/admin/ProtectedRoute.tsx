import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type StoredAdminUser = {
  role?: string;
};

function readStoredAdminUser(): StoredAdminUser | null {
  try {
    const storedUser = localStorage.getItem('admin_user');
    if (!storedUser) return null;
    return JSON.parse(storedUser) as StoredAdminUser;
  } catch {
    return null;
  }
}

const hasUsableAdminToken = (token: string | null): boolean => {
  if (!token) return false;
  const trimmed = token.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  return trimmed.length > 10;
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, the user's JWT role must be in this list. Defaults to allowing all authenticated roles. */
  requiredRoles?: string[];
}

const DEV_BYPASS = import.meta.env.VITE_DEV_ADMIN_BYPASS === 'true';

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('admin_token');
  const isTokenMissing = DEV_BYPASS ? false : !hasUsableAdminToken(token);

  if (isTokenMissing) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    const redirectTarget = `${location.pathname}${location.search}${location.hash}`;
    const loginPath = `/admin/login?redirect=${encodeURIComponent(redirectTarget)}`;
    return <Navigate to={loginPath} replace />;
  }

  if (!DEV_BYPASS && requiredRoles && requiredRoles.length > 0) {
    const userRole = readStoredAdminUser()?.role;
    if (!userRole || !requiredRoles.includes(userRole)) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F7F6F3', gap: 12 }}>
          <div style={{ fontSize: 40 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Access Restricted</h2>
          <p style={{ color: '#666', fontSize: 14, margin: 0, textAlign: 'center', maxWidth: 340 }}>
            Your account role (<strong>{userRole || 'unknown'}</strong>) does not have permission to access this page.
          </p>
          <p style={{ color: '#999', fontSize: 12, margin: 0 }}>
            Required: {requiredRoles.join(' or ')}
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

