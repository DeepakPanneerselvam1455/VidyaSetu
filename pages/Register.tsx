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
        <div 
          className="min-h-screen bg-cover bg-center p-4 flex flex-col items-center justify-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=2070&auto=format&fit=crop')" }}
        >
            <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-700">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center gap-2">
                        <FlameIcon className="w-8 h-8 text-orange-500" />
                        <h1 className="text-4xl font-bold text-white">SkillForge</h1>
                    </div>
                    <h2 className="text-2xl mt-4 font-semibold text-white">Create Account</h2>
                    <p className="text-white/80 mt-1">Learn. Create. Excel.</p>
                </div>
                <form onSubmit={handleInitialSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-white/90">Full Name</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Enter your full name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-10 h-11 bg-black/20 border-slate-500 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-400"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-white/90">Email Address</label>
                        <div className="relative">
                            <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-11 bg-black/20 border-slate-500 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-400"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-white/90">Password</label>
                        <div className="relative">
                             <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10 h-11 bg-black/20 border-slate-500 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        <PasswordStrengthMeter level={passwordStrength.level} text={passwordStrength.text} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-white/90">Confirm Password</label>
                        <div className="relative">
                             <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                            <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm your password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 pr-10 h-11 bg-black/20 border-slate-500 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-white/90">Account Type</label>
                        <Select
                            value={role}
                            onChange={(e) => setRole(e.target.value as User['role'])}
                            className="bg-black/20 border-slate-500 text-white focus:border-violet-400 focus:ring-violet-400"
                        >
                            <option value="student">Student - Learn and take courses</option>
                            <option value="mentor">Instructor - Create and manage courses</option>
                            <option value="admin">Admin - Manage the platform</option>
                        </Select>
                    </div>
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    <Button type="submit" className="w-full !mt-6 text-lg py-3 h-auto" disabled={isPasswordWeak}>
                        Create Account
                    </Button>
                     {isPasswordWeak && (
                        <p className="text-xs text-center text-orange-400">Password must be at least 'Medium' strength.</p>
                    )}
                </form>
                 <p className="text-center text-sm text-white/80 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-violet-400 hover:underline">
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
const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const MailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);


export default RegisterPage;