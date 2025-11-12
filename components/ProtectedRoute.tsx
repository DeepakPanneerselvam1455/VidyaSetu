
import React from 'react';
// FIX: Replaced Redirect with Navigate for react-router-dom v6.
// Fix: Update imports for react-router-dom v6 to resolve module export errors.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface ProtectedRouteProps {
  // Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  children: React.ReactElement;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-xl font-semibold text-slate-700 dark:text-slate-300">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // FIX: Replaced Redirect with Navigate and passed state for react-router-dom v6. Added `replace` prop.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to their default dashboard if they try to access a page they don't have permission for
    // FIX: Replaced Redirect with Navigate for react-router-dom v6. Added `replace` prop.
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;