import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    switch (user.role) {
        case 'student':
            return <Navigate to="/student" replace />;
        case 'mentor':
            return <Navigate to="/mentor" replace />;
        case 'admin':
            return <Navigate to="/admin" replace />;
        default:
            return <Navigate to="/login" replace />;
    }
};

export default Dashboard;