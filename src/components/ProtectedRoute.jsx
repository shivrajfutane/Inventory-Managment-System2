import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, profile, loading, logout } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <svg className="spinner text-primary-500" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeDasharray="31.42" strokeDashoffset="10"/>
                    </svg>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Verifying session...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (profile?.status === 'inactive') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                            <line x1="12" x2="12" y1="9" y2="13"/>
                            <line x1="12" x2="12.01" y1="17" y2="17"/>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Account Deactivated</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Your account has been deactivated by an administrator. Please contact support or your system manager if you believe this is an error.
                    </p>
                    <button 
                        onClick={() => logout()}
                        className="w-full btn btn-primary flex items-center justify-center gap-2"
                        style={{ padding: '0.75rem' }}
                    >
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
