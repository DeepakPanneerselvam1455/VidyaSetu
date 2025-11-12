

import React, { useState, useEffect } from 'react';
// FIX: Replaced useHistory with useNavigate for react-router-dom v6 compatibility.
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { User } from '../types';
import Dialog from '../components/ui/Dialog';
import { checkPasswordStrength } from '../lib/utils';
import PasswordStrengthMeter from '../components/ui/PasswordStrengthMeter';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, level: 'none' as const, text: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [role, setRole] = useState<'student' | 'mentor' | 'admin'>('student');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const { login } = useAuth();
    // FIX: Replaced useHistory with useNavigate for react-router-dom v6.
    const navigate = useNavigate();

    useEffect(() => {
        setPasswordStrength(checkPasswordStrength(password));
    }, [password]);

    const handleInitialSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (passwordStrength.score < 3) {
            setError("Password is too weak. Please choose a stronger password.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        // If validation passes, open the confirmation dialog
        setIsConfirmModalOpen(true);
    };

    const handleConfirmRegistration = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await api.register({ name, email, role }, password);
            // Log in the user automatically after registration
            await login(email, password);
            // FIX: Replaced history.push with navigate for react-router-dom v6.
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to create account.');
            setIsConfirmModalOpen(false); // Close modal on error to show the form again
        } finally {
            setIsLoading(false);
        }
    };

    const isPasswordWeak = password.length > 0 && passwordStrength.score < 3;

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl shadow-2xl p-8 border dark:border-slate-800">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center gap-2">
                        <FlameIcon className="w-8 h-8 text-orange-500" />
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">SkillForge</h1>
                    </div>
                    <h2 className="text-2xl mt-4 font-semibold text-slate-800 dark:text-white">Create Account</h2>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">Learn. Create. Excel.</p>
                </div>
                <form onSubmit={handleInitialSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-white">Full Name</label>
                        <Input
                            type="text"
                            placeholder="Enter your full name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-white">Email Address</label>
                        <Input
                            type="email"
                            placeholder="Enter your email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-white">Password</label>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        <PasswordStrengthMeter level={passwordStrength.level} text={passwordStrength.text} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-white">Confirm Password</label>
                        <div className="relative">
                            <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm your password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-white">Account Type</label>
                        <Select
                            value={role}
                            onChange={(e) => setRole(e.target.value as User['role'])}
                        >
                            <option value="student">Student - Learn and take courses</option>
                            <option value="mentor">Instructor - Create and manage courses</option>
                            <option value="admin">Admin - Manage the platform</option>
                        </Select>
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <Button type="submit" className="w-full !mt-6 text-lg py-3 h-auto" disabled={isPasswordWeak}>
                        Create Account
                    </Button>
                     {isPasswordWeak && (
                        <p className="text-xs text-center text-orange-500">Password must be at least 'Medium' strength.</p>
                    )}
                </form>
                 <p className="text-center text-sm text-slate-600 dark:text-slate-300 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                        Sign in
                    </Link>
                </p>
            </div>

            <Dialog
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Confirm Your Details"
                description="Please review your information before creating your account."
            >
                <div className="space-y-4 my-4 text-slate-800 dark:text-white">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-300">Full Name</p>
                        <p className="font-semibold">{name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-300">Email Address</p>
                        <p className="font-semibold">{email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-300">Account Type</p>
                        <p className="font-semibold capitalize">{role === 'mentor' ? 'Instructor' : role}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsConfirmModalOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirmRegistration}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Confirm & Create'}
                    </Button>
                </div>
            </Dialog>
        </div>
    );
};

const FlameIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
);

const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);

export default RegisterPage;
