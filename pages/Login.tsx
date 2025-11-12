import React, { useState } from 'react';
// FIX: Replaced useHistory with useNavigate for react-router-dom v6 compatibility.
// Fix: Update imports for react-router-dom v6 to resolve module export errors.
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
  const { login } = useAuth();
  // FIX: Replaced useHistory with useNavigate for react-router-dom v6.
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      // FIX: Replaced history.push with navigate for react-router-dom v6.
      navigate('/');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDemoLogin = (role: 'student' | 'instructor' | 'admin') => {
    const creds = DEMO_CREDENTIALS[role];
    setEmail(creds.email);
    setPassword(creds.password);
    setError(null); // Clear any previous errors
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center p-4 flex flex-col items-center justify-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=2070&auto=format&fit=crop')" }}
    >
      <div className="w-full max-w-5xl">
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-700">
          {/* Left Side */}
          <div className="w-full md:w-1/2 p-8 sm:p-12 text-white flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white">SkillForge</h1>
              <p className="text-white/80 mt-2">Welcome Back</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-white/90">Email Address*</label>
                <div className="relative">
                  <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10 h-11 bg-black/20 border-slate-500 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-400"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-white/90">Password*</label>
                <div className="relative">
                  <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="pl-10 pr-10 h-11 bg-black/20 border-slate-500 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-400"
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full !mt-8 text-base py-3 h-auto" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            <p className="text-center text-sm text-white/80 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-violet-400 hover:underline">
                Sign up here
              </Link>
            </p>
          </div>
          {/* Right Side */}
          <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center md:border-l border-slate-700">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">SkillForge Platform</h2>
                <p className="text-white/80 mt-2">Advanced learning management system with role-based access for enhanced educational experiences. Click a role to sign in with demo credentials.</p>
              </div>
              <div className="space-y-4">
                <RoleInfoCard
                  icon={<GraduationCapIcon className="w-[22px] h-[22px] text-indigo-400" />}
                  title="Students"
                  description="Access courses, take assessments, and track your learning progress."
                  onClick={() => handleDemoLogin('student')}
                />
                <RoleInfoCard
                  icon={<PresentationIcon className="w-[22px] h-[22px] text-green-400" />}
                  title="Instructors"
                  description="Create and manage courses, generate AI-powered content, and monitor student progress."
                  onClick={() => handleDemoLogin('instructor')}
                />
                <RoleInfoCard
                  icon={<UserCogIcon className="w-[22px] h-[22px] text-red-400" />}
                  title="Administrators"
                  description="Manage platform users, view comprehensive analytics, and oversee system operations."
                  onClick={() => handleDemoLogin('admin')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="w-full max-w-5xl mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          icon={<BotIcon className="w-8 h-8"/>}
          title="AI-Powered Learning"
          description="Intelligent quiz generation and adaptive learning paths."
        />
        <FeatureCard
          icon={<PieChartIcon className="w-8 h-8"/>}
          title="Advanced Analytics"
          description="Comprehensive progress tracking and performance insights."
        />
        <FeatureCard
          icon={<UsersIcon className="w-8 h-8"/>}
          title="Role-Based Access"
          description="Tailored experiences for students, instructors, and administrators."
        />
      </div>
    </div>
  );
};


const RoleInfoCard: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick: () => void; }> = ({ icon, title, description, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/20 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-indigo-400"
    >
        <div className="bg-slate-800/50 rounded-lg p-3 shadow-sm shrink-0">{icon}</div>
        <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-white/80">{description}</p>
        </div>
    </button>
)

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center text-white">
        <div className="mb-4">{icon}</div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-white/70 mt-1">{description}</p>
    </div>
);

// Icons
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);
const MailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const GraduationCapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
);
const PresentationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="M7 21h10"/><path d="M12 16v5"/></svg>
);
const UserCogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m21.7 16.4-.9-.3"/><path d="m15.2 13.9-.9-.3"/><path d="m16.6 18.7.3-.9"/><path d="m19.1 12.2.3-.9"/><path d="m19.5 17.3-.3-.9"/><path d="m16.8 12.3-.3-.9"/><path d="m14.3 16.6 1-2.7"/><path d="m20.7 13.8 1-2.7"/></svg>
);
const BotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);
const PieChartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
);
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

export default LoginPage;