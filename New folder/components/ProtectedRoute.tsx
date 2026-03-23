import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    console.warn(`[RouteGuard] Access denied for user ${user.id} (${user.role}) to path ${location.pathname}. Allowed: ${roles.join(', ')}`);
    // Redirect to their specific dashboard if they try to access a wrong route
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'mentor') return <Navigate to="/mentor" replace />;
    if (user.role === 'student') return <Navigate to="/student" replace />;

    // Fallback for unknown roles - maybe to a specialized error page or just root
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;