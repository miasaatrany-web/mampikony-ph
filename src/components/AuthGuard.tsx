import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAgent?: boolean;
  requireCashier?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAdmin, requireAgent, requireCashier }) => {
  const { user, loading, isAdmin, isAgent, isCashier } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const hasRequiredRole = 
    (!requireAgent && !requireCashier) || 
    (requireAgent && isAgent) || 
    (requireCashier && isCashier);

  if (!hasRequiredRole && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
