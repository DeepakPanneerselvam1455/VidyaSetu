import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User } from '../types';
import { Select } from '../components/ui/Select';

const states = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry"
];


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

    useEffect(() => {
        // Reset form data if user context changes
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
        setIsSaving(true);
        try {
            const updatedData: Partial<User> = {
                ...formData,
            };
            await updateUserProfile(updatedData);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile", error);
            // Optionally, show an error message to the user
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancel = () => {
        // Reset form to original user data
        setFormData({
            name: user?.name || '',
            dob: user?.dob || '',
            education: user?.education || '',
            school: user?.school || '',
            state: user?.state || '',
            contact: user?.contact || '',
        });
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
            </div>
             <form onSubmit={handleSave}>
                <Card>
                    <CardHeader className="items-center text-center">
                        <UserCircle2Icon className="w-24 h-24 text-slate-300 dark:text-slate-600"/>
                        <CardTitle className="text-2xl">{user?.name}</CardTitle>
                        <CardDescription>
                            {isEditing ? 'Update your personal details below.' : 'Your personal details on the SkillForge platform.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 border-t dark:border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProfileField label="Full Name" id="name" value={formData.name} isEditing={isEditing} onChange={handleInputChange} />
                            <ProfileField label="Email Address" value={user?.email} isEditing={false} />
                            <ProfileField label="Role" value={user?.role === 'mentor' ? 'Instructor' : user?.role} isEditing={false} />
                            <ProfileField label="Member Since" value={user ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} isEditing={false} />
                            
                            <hr className="md:col-span-2 border-slate-200 dark:border-slate-700" />
                            
                            <ProfileField label="Date of Birth" id="dob" value={formData.dob} isEditing={isEditing} onChange={handleInputChange} placeholder="DD/MM/YYYY" />
                            <ProfileField label="Education" id="education" value={formData.education} isEditing={isEditing} onChange={handleInputChange} placeholder="e.g., High School, Bachelor's" />
                            <ProfileField label="School Name" id="school" value={formData.school} isEditing={isEditing} onChange={handleInputChange} placeholder="e.g., State University" />
                            <ProfileField 
                                label="State" 
                                id="state" 
                                value={formData.state} 
                                isEditing={isEditing} 
                                onChange={handleInputChange} 
                                as="select"
                                options={states}
                            />
                            <ProfileField label="Contact Number" id="contact" value={formData.contact} isEditing={isEditing} onChange={handleInputChange} type="tel" placeholder="e.g., (555) 123-4567" />
                        </div>
                    </CardContent>
                    {isEditing && (
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </form>
        </div>
    );
};

interface ProfileFieldProps {
    label: string;
    id?: string;
    value?: string | number | null;
    isEditing: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    type?: string;
    placeholder?: string;
    as?: 'input' | 'select';
    options?: string[];
}

const ProfileField: React.FC<ProfileFieldProps> = ({ label, id, value, isEditing, onChange, type = 'text', placeholder, as = 'input', options = [] }) => {
    return (
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
            {isEditing && id && onChange ? (
                as === 'select' ? (
                    <Select id={id} value={String(value || '')} onChange={onChange}>
                        <option value="" disabled>Select...</option>
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                ) : (
                    <Input
                        id={id}
                        type={type}
                        value={value || ''}
                        onChange={onChange}
                        placeholder={placeholder}
                    />
                )
            ) : (
                <p className="text-lg h-10 flex items-center">{value || <span className="text-slate-400 dark:text-slate-500 italic text-base">Not set</span>}</p>
            )}
        </div>
    );
};

const UserCircle2Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>;


export default Profile;