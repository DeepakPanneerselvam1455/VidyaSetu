
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const DEMO_CREDENTIALS = {
  student: { email: 'student@skillforge.com', password: 'student123' },
  instructor: { email: 'instructor@skillforge.com', password: 'instructor123' },
  admin: { email: 'admin@skillforge.com', password: 'admin123' },
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    switch (user.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'mentor':
        navigate('/mentor');
        break;
      case 'student':
        navigate('/student');
        break;
      default:
        // Do nothing, stay on login page if role is weird, or maybe valid user but no dashboard?
        // Actually best to not auto-redirect if role is invalid so they can see error or logout.
        break;
    }
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const loggedInUser = await login(email, password);

      // Role-based redirect
      switch (loggedInUser.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'mentor':
          navigate('/mentor');
          break;
        case 'student':
          navigate('/student');
          break;
        default:
          setError('Account has no valid role assigned. Please contact support.');
          // Ideally logout here or cleanup state if role is invalid to prevent partial login state
          break;
      }
    } catch (err: any) {
      console.error("Login Check Failed:", err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'student' | 'instructor' | 'admin') => {
    const creds = DEMO_CREDENTIALS[role];
    setEmail(creds.email);
    setPassword(creds.password);
    setError(null);
  };


  return (
    <div className="min-h-screen bg-main flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-surface rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden border border-default">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary">VidyaSetu</h1>
            <p className="text-muted mt-2">Sign in to your learning dashboard</p>
          </div>

          <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm">
            <p className="font-semibold flex items-center gap-2">
              <InfoIcon className="w-4 h-4" /> Secure Cloud Storage
            </p>
            <p className="mt-1 opacity-90">Your progress is synced securely to the cloud.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-main">Email Address*</label>
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10 h-11 bg-main border-default placeholder:text-muted focus:border-focus focus:ring-primary text-main"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-main">Password*</label>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="pl-10 pr-10 h-11 bg-main border-default placeholder:text-muted focus:border-focus focus:ring-primary text-main"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                >
                  {showPassword ? <EyeOffIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-error font-medium">{error}</p>}
            <Button type="submit" className="w-full !mt-8 text-base py-3 h-auto" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Sign In'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Sign up here
            </Link>
          </p>
        </div>

        {/* Right Side - Role Selection */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 bg-main/50 flex flex-col justify-center border-t md:border-t-0 md:border-l border-default">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-main">Select Role</h2>
              <p className="text-muted mt-2">Click a role to automatically fill credentials for the built-in sandbox accounts.</p>
            </div>
            <div className="space-y-4">
              <RoleInfoCard
                icon={<GraduationCapIcon className="w-[22px] h-[22px] text-primary" />}
                title="Students"
                description="student@skillforge.com"
                onClick={() => handleDemoLogin('student')}
              />
              <RoleInfoCard
                icon={<PresentationIcon className="w-[22px] h-[22px] text-primary" />}
                title="Instructors"
                description="instructor@skillforge.com"
                onClick={() => handleDemoLogin('instructor')}
              />
              <RoleInfoCard
                icon={<UserCogIcon className="w-[22px] h-[22px] text-primary" />}
                title="Administrators"
                description="admin@skillforge.com"
                onClick={() => handleDemoLogin('admin')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoleInfoCard: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick: () => void; }> = ({ icon, title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-start gap-4 p-4 rounded-lg bg-surface border border-default hover:border-primary hover:ring-1 hover:ring-primary transition-all text-left group"
  >
    <div className="bg-primary/10 rounded-lg p-3 shadow-sm shrink-0 group-hover:bg-primary/20 transition-colors">{icon}</div>
    <div>
      <h3 className="font-semibold text-main group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
    </div>
  </button>
)

const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
);
const MailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);
const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const GraduationCapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
);
const PresentationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="M7 21h10" /><path d="M12 16v5" /></svg>
);
const UserCogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="15" r="3" /><circle cx="9" cy="7" r="4" /><path d="M10 15H6a4 4 0 0 0-4 4v2" /><path d="m21.7 16.4-.9-.3" /><path d="m15.2 13.9-.9-.3" /><path d="m16.6 18.7.3-.9" /><path d="m19.1 12.2.3-.9" /><path d="m19.5 17.3-.3-.9" /><path d="m16.8 12.3-.3-.9" /><path d="m14.3 16.6 1-2.7" /><path d="m20.7 13.8 1-2.7" /></svg>
);
const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
);

export default LoginPage;
