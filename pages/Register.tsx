import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../lib/api';
import { useAuth } from '../lib/auth';
import { User } from '../types';
import Dialog from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { checkPasswordStrength } from '../lib/utils';
import PasswordStrengthMeter from '../components/ui/PasswordStrengthMeter';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState<{
        score: number;
        level: 'none' | 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
        text: string;
    }>({ score: 0, level: 'none', text: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [role, setRole] = useState<'student' | 'mentor' | 'admin'>('student');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        nameRef.current?.focus();
    }, []);

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
            const loggedInUser = await login(email, password);

            // Redirect based on role
            if (loggedInUser.role === 'admin') navigate('/admin');
            else if (loggedInUser.role === 'mentor') navigate('/mentor');
            else navigate('/student');
        } catch (err: any) {
            setError(err.message || 'Failed to create account.');
            setIsConfirmModalOpen(false); // Close modal on error to show the form again
        } finally {
            setIsLoading(false);
        }
    };

    const isPasswordWeak = password.length > 0 && passwordStrength.score < 3;
    const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

    return (
        <div className="auth-page">
            <div className="w-full max-w-[520px]">
                <div className="auth-card p-8 sm:p-10">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center gap-2.5 mb-5">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(250 60% 50%), hsl(260 55% 45%))' }}>
                                <FlameIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold auth-text-heading">VidyaSetu</span>
                        </div>
                        <h1 className="text-2xl font-bold auth-text-heading">Create your account</h1>
                        <p className="auth-text-muted text-sm mt-1.5">Join thousands of learners and instructors</p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="auth-error-banner mb-5">
                            <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleInitialSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="reg-name" className="auth-label">Full name</label>
                            <div className="relative">
                                <UserIcon className="auth-input-icon" />
                                <input
                                    ref={nameRef}
                                    id="reg-name"
                                    type="text"
                                    className="auth-input"
                                    placeholder="Your full name"
                                    required
                                    autoComplete="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{
                                        paddingLeft: '3rem',
                                        backgroundColor: '#f8fafc',
                                        color: '#0f172a',
                                        WebkitTextFillColor: '#0f172a',
                                        caretColor: '#0f172a',
                                        border: '2px solid #cbd5e1',
                                        opacity: 1,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="reg-email" className="auth-label">Email address</label>
                            <div className="relative">
                                <MailIcon className="auth-input-icon" />
                                <input
                                    id="reg-email"
                                    type="email"
                                    className="auth-input"
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        paddingLeft: '3rem',
                                        backgroundColor: '#f8fafc',
                                        color: '#0f172a',
                                        WebkitTextFillColor: '#0f172a',
                                        caretColor: '#0f172a',
                                        border: '2px solid #cbd5e1',
                                        opacity: 1,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="reg-password" className="auth-label">Password</label>
                            <div className="relative">
                                <LockIcon className="auth-input-icon" />
                                <input
                                    id="reg-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    placeholder="Create a strong password"
                                    required
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        paddingRight: '2.5rem',
                                        paddingLeft: '3rem',
                                        backgroundColor: '#f8fafc',
                                        color: '#0f172a',
                                        WebkitTextFillColor: '#0f172a',
                                        caretColor: '#0f172a',
                                        border: '2px solid #cbd5e1',
                                        opacity: 1,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="auth-toggle-btn"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOffIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
                                </button>
                            </div>
                            <div className="mt-2">
                                <PasswordStrengthMeter level={passwordStrength.level} text={passwordStrength.text} />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="reg-confirm" className="auth-label">Confirm password</label>
                            <div className="relative">
                                <LockIcon className="auth-input-icon" />
                                <input
                                    id="reg-confirm"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    placeholder="Re-enter your password"
                                    required
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{
                                        paddingRight: '2.5rem',
                                        paddingLeft: '3rem',
                                        backgroundColor: '#f8fafc',
                                        color: '#0f172a',
                                        WebkitTextFillColor: '#0f172a',
                                        caretColor: '#0f172a',
                                        border: '2px solid #cbd5e1',
                                        opacity: 1,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="auth-toggle-btn"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? <EyeOffIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
                                </button>
                            </div>
                            {!passwordsMatch && (
                                <p className="text-xs mt-1.5" style={{ color: 'hsl(0 65% 50%)' }}>Passwords do not match</p>
                            )}
                        </div>

                        {/* Role Selector */}
                        <div>
                            <label htmlFor="reg-role" className="auth-label">I want to join as</label>
                            <div className="relative">
                                <RoleIcon className="auth-input-icon" />
                                <select
                                    id="reg-role"
                                    className="auth-select"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as User['role'])}
                                    style={{
                                        paddingLeft: '3rem',
                                        backgroundColor: '#f8fafc',
                                        color: '#0f172a',
                                        WebkitTextFillColor: '#0f172a',
                                        border: '2px solid #cbd5e1',
                                        opacity: 1,
                                    }}
                                >
                                    <option value="student">Student — Learn and take courses</option>
                                    <option value="mentor">Instructor — Create and manage courses</option>
                                    <option value="admin">Admin — Manage the platform</option>
                                </select>
                                <ChevronIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 auth-text-muted pointer-events-none" />
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-2.5 pt-1">
                            <input
                                type="checkbox"
                                id="agree-terms"
                                className="auth-checkbox mt-0.5"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                            />
                            <label htmlFor="agree-terms" className="text-xs auth-text-muted cursor-pointer select-none leading-relaxed">
                                I agree to the <span className="auth-link" style={{ cursor: 'pointer' }}>Terms of Service</span> and <span className="auth-link" style={{ cursor: 'pointer' }}>Privacy Policy</span>
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="auth-btn !mt-6"
                            disabled={isPasswordWeak || !passwordsMatch}
                        >
                            Create Account
                        </button>

                        {isPasswordWeak && (
                            <p className="text-xs text-center" style={{ color: 'hsl(30 80% 45%)' }}>
                                Password must be at least 'Medium' strength to continue.
                            </p>
                        )}
                    </form>

                    {/* Sign in link */}
                    <p className="text-center text-sm auth-text-muted mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                </div>
            </div>

            {/* Confirmation Dialog — unchanged logic */}
            <Dialog
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Confirm Your Details"
                description="Please review your information before creating your account."
            >
                <div className="space-y-6 my-6">
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Full Name</p>
                        <p className="text-lg font-medium" style={{ color: 'var(--text-heading)' }}>{name}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Email Address</p>
                        <p className="text-lg font-medium" style={{ color: 'var(--text-heading)' }}>{email}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Account Type</p>
                        <p className="text-lg font-medium capitalize" style={{ color: 'var(--text-heading)' }}>{role === 'mentor' ? 'Instructor' : role}</p>
                    </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsConfirmModalOpen(false)}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirmRegistration}
                        disabled={isLoading}
                        className="w-full sm:w-auto min-w-[120px]"
                        size="lg"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="auth-spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
                                Creating...
                            </span>
                        ) : (
                            'Confirm & Create'
                        )}
                    </Button>
                </div>
            </Dialog>
        </div>
    );
};

/* ─── Icons ─── */
const FlameIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
);
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
);
const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const MailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);
const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const AlertCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);
const RoleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const ChevronIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
);

export default RegisterPage;