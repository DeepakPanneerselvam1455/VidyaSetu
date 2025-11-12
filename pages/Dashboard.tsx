
import React from 'react';
// FIX: Replaced Redirect with Navigate for react-router-dom v6.
// Fix: Update import for react-router-dom v6 to resolve module export error.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        // FIX: Replaced Redirect with Navigate for react-router-dom v6.
        return <Navigate to="/login" replace />;
    }

    switch (user.role) {
        case 'student':
            // FIX: Replaced Redirect with Navigate for react-router-dom v6.
            return <Navigate to="/student" replace />;
        case 'mentor':
            // FIX: Replaced Redirect with Navigate for react-router-dom v6.
            return <Navigate to="/mentor" replace />;
        case 'admin':
            // FIX: Replaced Redirect with Navigate for react-router-dom v6.
            return <Navigate to="/admin" replace />;
        default:
            // FIX: Replaced Redirect with Navigate for react-router-dom v6.
            return <Navigate to="/login" replace />;
    }
};

export default Dashboard;