import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useContent } from '../../context/ContentBase';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isUserAuthenticated, isAuthChecking } = useContent();

  // H7 fix: show a spinner while auth is being validated to prevent flash redirect to /login
  if (isAuthChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid rgba(233,116,81,0.2)',
          borderTopColor: '#E97451',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isUserAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
