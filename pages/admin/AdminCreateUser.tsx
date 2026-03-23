import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { Button, buttonVariants } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { checkPasswordStrength } from '../../lib/utils';
import { validateUserCreationForm } from '../../lib/formValidation';
import { FormError } from '../../components/ui/FormError';
import PasswordStrengthMeter from '../../components/ui/PasswordStrengthMeter';

const AdminCreateUser: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState<{
        score: number;
        level: 'none' | 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
        text: string;
    }>({ score: 0, level: 'none', text: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<'student' | 'mentor' | 'admin'>('student');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ 
        name?: string; 
        email?: string; 
        password?: string; 
        role?: string;
    }>({});

    useEffect(() => {
        setPasswordStrength(checkPasswordStrength(password));
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        
        // Validate form
        const validation = validateUserCreationForm({ name, email, password, role });
        if (!validation.isValid) {
            setFieldErrors(validation.errors);
            return;
        }
        
        if (passwordStrength.score < 3) {
            setFieldErrors({ password: 'Password is too weak. Please choose a stronger password.' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            await api.createUser({ name, email, role }, password);
            navigate('/admin/users'); // Redirect on success
        } catch (err: any) {
            setError(err.message || 'Failed to create user. The email might already be in use.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPasswordWeak = password.length > 0 && passwordStrength.score < 3;

    return (
        <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Create New User</CardTitle>
                        <CardDescription>Fill in the details to register a new user for the VidyaSetu platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                            <Input 
                                id="name" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                required 
                                placeholder="John Doe"
                                error={fieldErrors.name}
                                aria-invalid={!!fieldErrors.name}
                                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                            />
                            {fieldErrors.name && <FormError error={fieldErrors.name} />}
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
                            <Input 
                                id="email" 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                                placeholder="user@example.com"
                                error={fieldErrors.email}
                                aria-invalid={!!fieldErrors.email}
                                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                            />
                            {fieldErrors.email && <FormError error={fieldErrors.email} />}
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                            <div className="relative">
                                <Input 
                                    id="password" 
                                    type={showPassword ? 'text' : 'password'} 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    required 
                                    aria-describedby="password-help"
                                    error={fieldErrors.password}
                                    aria-invalid={!!fieldErrors.password}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            <PasswordStrengthMeter level={passwordStrength.level} text={passwordStrength.text} />
                            {fieldErrors.password && <FormError error={fieldErrors.password} />}
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium mb-1">Role</label>
                            <Select 
                                id="role" 
                                value={role} 
                                onChange={e => setRole(e.target.value as any)} 
                                required
                                error={fieldErrors.role}
                                aria-invalid={!!fieldErrors.role}
                                aria-describedby={fieldErrors.role ? "role-error" : undefined}
                            >
                                <option value="student">Student</option>
                                <option value="mentor">Instructor</option>
                                <option value="admin">Admin</option>
                            </Select>
                            {fieldErrors.role && <FormError error={fieldErrors.role} />}
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex flex-col items-stretch gap-2">
                        <Button type="submit" disabled={isSubmitting || isPasswordWeak}>
                            {isSubmitting ? 'Creating...' : 'Create User'}
                        </Button>
                        <Link to="/admin/users" className={buttonVariants({ variant: 'outline' })}>Cancel</Link>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
};

const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
);

export default AdminCreateUser;