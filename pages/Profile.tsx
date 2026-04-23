import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { User } from '../types';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { validateProfileForm } from '../lib/formValidation';
import { FormError } from '../components/ui/FormError';

const states = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
    "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
    "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
    "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
    "Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands",
    "Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi",
    "Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const roleLabel: Record<string, string> = {
    mentor: 'Instructor',
    student: 'Student',
    admin: 'Administrator',
};

// ── Helper: field value display ───────────────────────────────────────────────
const FieldValue: React.FC<{ value?: string | number | null }> = ({ value }) => {
    if (value === undefined || value === null || value === '') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-400 border border-red-100 italic">
                Not set
            </span>
        );
    }
    return <span className="text-sm font-semibold text-gray-900 leading-snug">{value}</span>;
};

// ── Section card wrapper ──────────────────────────────────────────────────────
const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 bg-gray-50">
            <span className="text-indigo-500">{icon}</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

// ── Native labeled field (view mode) ─────────────────────────────────────────
const InfoField: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        <FieldValue value={value} />
    </div>
);

// ── Edit field ───────────────────────────────────────────────────────────────
interface EditFieldProps {
    label: string;
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    type?: string;
    placeholder?: string;
    readOnly?: boolean;
    as?: 'input' | 'select';
    options?: string[];
    error?: string;
}
const EditField: React.FC<EditFieldProps> = ({
    label, id, value, onChange, type = 'text', placeholder, readOnly = false, as = 'input', options = [], error
}) => (
    <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</label>
        {readOnly ? (
            <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed">
                {value || <span className="italic text-gray-400">—</span>}
            </div>
        ) : as === 'select' ? (
            <Select id={id} value={value} onChange={onChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
                <option value="" disabled>Select state…</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </Select>
        ) : (
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition-colors duration-150 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
        )}
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const Profile: React.FC = () => {
    const { user, updateUserProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        dob: user?.dob || '',
        education: user?.education || '',
        school: user?.school || '',
        state: user?.state || '',
        contact: user?.contact || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ name?: string; contact?: string }>({});

    useEffect(() => {
        setFormData({
            name: user?.name || '',
            dob: user?.dob || '',
            education: user?.education || '',
            school: user?.school || '',
            state: user?.state || '',
            contact: user?.contact || '',
        });
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        const validation = validateProfileForm({ name: formData.name, dob: formData.dob, contact: formData.contact });
        if (!validation.isValid) { setFieldErrors(validation.errors); return; }
        setIsSaving(true);
        try {
            await updateUserProfile(formData as Partial<User>);
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update profile', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({ name: user?.name || '', dob: user?.dob || '', education: user?.education || '', school: user?.school || '', state: user?.state || '', contact: user?.contact || '' });
        setFieldErrors({});
        setIsEditing(false);
    };

    // Avatar initials
    const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="space-y-6 max-w-3xl mx-auto">

            {/* ── Hero / Avatar Card ── */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Gradient banner */}
                <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    {/* Avatar */}
                    <div className="flex items-end gap-4">
                        <div className="w-20 h-20 rounded-full border-4 border-white bg-indigo-600 flex items-center justify-center shadow-md shrink-0">
                            <span className="text-2xl font-bold text-white tracking-wide">{initials}</span>
                        </div>
                        <div className="pb-1">
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">{user?.name || '—'}</h1>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                    {roleLabel[user?.role || ''] || user?.role || '—'}
                                </span>
                                <span className="text-xs text-gray-400">{user?.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Edit / Save buttons */}
                    <div className="flex items-center gap-2 pb-1">
                        {isEditing ? (
                            <>
                                <button type="button" onClick={handleCancel}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300">
                                    Cancel
                                </button>
                                <button type="submit" form="profile-form" disabled={isSaving}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                                    {isSaving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <button type="button" onClick={() => setIsEditing(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                                <PencilIcon className="w-3.5 h-3.5" />
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <form id="profile-form" onSubmit={handleSave} className="space-y-5">

                {/* ── Basic Info ── */}
                <SectionCard title="Basic Info" icon={<UserIcon className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {isEditing ? (
                            <>
                                <EditField label="Full Name" id="name" value={formData.name} onChange={handleInputChange} placeholder="Your full name" error={fieldErrors.name} />
                                <EditField label="Email Address" id="email" value={user?.email || ''} onChange={() => {}} readOnly />
                                <EditField label="Role" id="role" value={roleLabel[user?.role || ''] || user?.role || ''} onChange={() => {}} readOnly />
                                <InfoField label="Member Since" value={user ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                            </>
                        ) : (
                            <>
                                <InfoField label="Full Name" value={user?.name} />
                                <InfoField label="Email Address" value={user?.email} />
                                <InfoField label="Role" value={roleLabel[user?.role || ''] || user?.role} />
                                <InfoField label="Member Since" value={user ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                            </>
                        )}
                    </div>
                </SectionCard>

                {/* ── Personal Info ── */}
                <SectionCard title="Personal Info" icon={<CalendarIcon className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {isEditing ? (
                            <>
                                <EditField label="Date of Birth" id="dob" value={formData.dob} onChange={handleInputChange} placeholder="DD/MM/YYYY" />
                                <EditField label="Contact Number" id="contact" value={formData.contact} onChange={handleInputChange} type="tel" placeholder="e.g., +91 9876543210" error={fieldErrors.contact} />
                                <EditField label="State" id="state" value={formData.state} onChange={handleInputChange} as="select" options={states} />
                            </>
                        ) : (
                            <>
                                <InfoField label="Date of Birth" value={user?.dob} />
                                <InfoField label="Contact Number" value={user?.contact} />
                                <InfoField label="State" value={user?.state} />
                            </>
                        )}
                    </div>
                </SectionCard>

                {/* ── Academic Info ── */}
                <SectionCard title="Academic Info" icon={<GraduationCapIcon className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {isEditing ? (
                            <>
                                <EditField label="Education Level" id="education" value={formData.education} onChange={handleInputChange} placeholder="e.g., Bachelor's Degree" />
                                <EditField label="School / Institution" id="school" value={formData.school} onChange={handleInputChange} placeholder="e.g., State University" />
                            </>
                        ) : (
                            <>
                                <InfoField label="Education Level" value={user?.education} />
                                <InfoField label="School / Institution" value={user?.school} />
                            </>
                        )}
                    </div>
                </SectionCard>

            </form>
        </div>
    );
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
    </svg>
);
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);
const GraduationCapIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
);

export default Profile;