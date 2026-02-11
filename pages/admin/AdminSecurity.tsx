

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';
import { ActivityLogEntry, getActivityLog, formatTimeAgo, logActivity } from '../../lib/activityLog';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';

type SecurityTab = 'access' | 'policy' | 'audit';

const initialPermissions = {
    student: { viewCourses: true, takeQuizzes: true, createCourses: false, manageOwnQuizzes: false, viewAllAnalytics: false, manageUsers: false, accessSystemSettings: false, deleteAnyCourse: false },
    instructor: { viewCourses: true, takeQuizzes: false, createCourses: true, manageOwnQuizzes: true, viewAllAnalytics: false, manageUsers: false, accessSystemSettings: false, deleteAnyCourse: false },
    admin: { viewCourses: true, takeQuizzes: true, createCourses: true, manageOwnQuizzes: true, viewAllAnalytics: true, manageUsers: true, accessSystemSettings: true, deleteAnyCourse: true },
};
const permissionLabels: { key: keyof typeof initialPermissions.student, label: string }[] = [
    { key: 'viewCourses', label: 'View Courses' },
    { key: 'takeQuizzes', label: 'Take Quizzes' },
    { key: 'createCourses', label: 'Create Courses' },
    { key: 'manageOwnQuizzes', label: 'Manage Own Quizzes' },
    { key: 'viewAllAnalytics', label: 'View All Analytics' },
    { key: 'manageUsers', label: 'Manage Users' },
    { key: 'accessSystemSettings', label: 'Access System Settings' },
    { key: 'deleteAnyCourse', label: 'Delete Any Course' },
];

const initialPolicy = {
    minLength: 8,
    requireUpper: true,
    requireLower: true,
    requireNum: true,
    requireSpecial: false,
    expirationDays: 90,
};

const AdminSecurity: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SecurityTab>('access');

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">Security Settings</h1>

            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <SecurityTabButton tab="access" activeTab={activeTab} onClick={setActiveTab}>Access Control (RBAC)</SecurityTabButton>
                    <SecurityTabButton tab="policy" activeTab={activeTab} onClick={setActiveTab}>Password Policy</SecurityTabButton>
                    <SecurityTabButton tab="audit" activeTab={activeTab} onClick={setActiveTab}>Audit Log</SecurityTabButton>
                </nav>
            </div>

            {activeTab === 'access' && <AccessControl />}
            {activeTab === 'policy' && <PasswordPolicy />}
            {activeTab === 'audit' && <AuditLog />}

        </div>
    );
};

const SecurityTabButton: React.FC<{ tab: SecurityTab; activeTab: SecurityTab; onClick: (tab: SecurityTab) => void; children: React.ReactNode }> = ({ tab, activeTab, onClick, children }) => {
    return (
        <button
            onClick={() => onClick(tab)}
            className={cn(
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                activeTab === tab
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-600'
            )}
        >
            {children}
        </button>
    )
}

const AccessControl = () => {
    const [permissions, setPermissions] = useState(initialPermissions);
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fix: Cast settings to any to resolve type error from accessing rbac on empty object type.
                const settings = await api.getSystemSettings('security') as any;
                if (settings && settings.rbac) {
                    setPermissions(settings.rbac);
                }
            } catch (error) {
                console.error("Failed to fetch RBAC settings", error);
            }
        };
        fetchSettings();
    }, []);

    const handlePermissionChange = (role: 'student' | 'instructor' | 'admin', key: string, value: boolean) => {
        setPermissions(prev => ({ ...prev, [role]: { ...prev[role], [key]: value } }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Fix: Cast currentSettings to any to allow merging into the security settings object.
            const currentSettings = await api.getSystemSettings('security') as any;
            await api.updateSystemSettings('security', { ...currentSettings, rbac: permissions });

            logActivity('system_setting_change', 'RBAC Permissions updated by admin', { admin: user?.name });
        } catch (error) {
            console.error("Failed to save RBAC settings", error);
            alert("Failed to save permission changes.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Role-Based Access Control</CardTitle>
                <CardDescription>Define permissions for each user role. Changes are enforced immediately by the backend.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            <th className="p-3 font-medium">Permission</th>
                            <th className="p-3 font-medium text-center">Student</th>
                            <th className="p-3 font-medium text-center">Instructor</th>
                            <th className="p-3 font-medium text-center">Admin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {permissionLabels.map(({ key, label }) => (
                            <PermissionRow
                                key={key}
                                permission={label}
                                permissionKey={key}
                                permissions={permissions}
                                onChange={handlePermissionChange}
                            />
                        ))}
                    </tbody>
                </table>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Update Permissions'}</Button>
            </CardFooter>
        </Card>
    )
};

const PermissionRow: React.FC<{
    permission: string;
    permissionKey: string;
    permissions: typeof initialPermissions;
    onChange: (role: 'student' | 'instructor' | 'admin', key: string, value: boolean) => void;
}> = ({ permission, permissionKey, permissions, onChange }) => (
    <tr className="border-b dark:border-slate-700">
        <td className="p-3">{permission}</td>
        <td className="p-3 text-center"><input type="checkbox" checked={permissions.student[permissionKey as keyof typeof permissions.student]} onChange={e => onChange('student', permissionKey, e.target.checked)} className="w-4 h-4" /></td>
        <td className="p-3 text-center"><input type="checkbox" checked={permissions.instructor[permissionKey as keyof typeof permissions.instructor]} onChange={e => onChange('instructor', permissionKey, e.target.checked)} className="w-4 h-4" /></td>
        <td className="p-3 text-center"><input type="checkbox" checked={permissions.admin[permissionKey as keyof typeof permissions.admin]} onChange={e => onChange('admin', permissionKey, e.target.checked)} className="w-4 h-4" /></td>
    </tr>
);


const PasswordPolicy = () => {
    const [policy, setPolicy] = useState(initialPolicy);
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fix: Cast settings to any to resolve type error from accessing policy on empty object type.
                const settings = await api.getSystemSettings('security') as any;
                if (settings && settings.policy) {
                    setPolicy(settings.policy);
                }
            } catch (error) {
                console.error("Failed to fetch password policy", error);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (key: keyof typeof initialPolicy, value: any) => {
        setPolicy(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Fix: Cast currentSettings to any to allow merging policy into the security settings object.
            const currentSettings = await api.getSystemSettings('security') as any;
            await api.updateSystemSettings('security', { ...currentSettings, policy });

            logActivity('system_setting_change', 'Password policy updated', { admin: user?.name });
        } catch (error) {
            console.error("Failed to save password policy", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Password Policy</CardTitle>
                <CardDescription>Enforce password requirements for all users on the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
                <div>
                    <label className="font-medium text-sm">Minimum Length</label>
                    <Input type="number" value={policy.minLength} onChange={e => handleChange('minLength', parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <p className="font-medium text-sm">Character Requirements</p>
                    <div className="flex items-center gap-2"><input type="checkbox" id="req-upper" checked={policy.requireUpper} onChange={e => handleChange('requireUpper', e.target.checked)} /><label htmlFor="req-upper">Require uppercase letter</label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" id="req-lower" checked={policy.requireLower} onChange={e => handleChange('requireLower', e.target.checked)} /><label htmlFor="req-lower">Require lowercase letter</label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" id="req-num" checked={policy.requireNum} onChange={e => handleChange('requireNum', e.target.checked)} /><label htmlFor="req-num">Require number</label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" id="req-special" checked={policy.requireSpecial} onChange={e => handleChange('requireSpecial', e.target.checked)} /><label htmlFor="req-special">Require special character (e.g., !@#$)</label></div>
                </div>
                <div>
                    <label className="font-medium text-sm">Password Expiration (days)</label>
                    <Input type="number" value={policy.expirationDays} onChange={e => handleChange('expirationDays', parseInt(e.target.value) || 0)} />
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Set to 0 to disable expiration.</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Policy'}</Button>
            </CardFooter>
        </Card>
    )
};

const AuditLog = () => {
    const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // Fix: Removed non-existent api.executeHybrid and directly use getActivityLog to load LocalStorage-based audit entries.
                const data = await getActivityLog();

                const securityLogTypes: ActivityLogEntry['type'][] = [
                    'user_role_change',
                    'user_password_reset',
                    'system_setting_change',
                    'user_login',
                    'user_create',
                    'user_delete',
                    'security_alert'
                ];

                if (Array.isArray(data)) {
                    setLogs(data.filter(log => securityLogTypes.includes(log.type)));
                }
            } catch (err) {
                console.error("Failed to load audit logs", err);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log =>
            log.title.toLowerCase().includes(filter.toLowerCase()) ||
            log.type.toLowerCase().includes(filter.toLowerCase()) ||
            (log.details?.userName && log.details.userName.toLowerCase().includes(filter.toLowerCase())) ||
            (log.details?.adminName && log.details.adminName.toLowerCase().includes(filter.toLowerCase()))
        );
    }, [logs, filter]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Tracks security-sensitive events and administrative actions within the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <Input placeholder="Filter by user, admin, or action..." className="max-w-xs" value={filter} onChange={e => setFilter(e.target.value)} />
                    <Button variant="outline" onClick={() => alert('Exporting log...')}>Export Log</Button>
                </div>
                <div className="overflow-x-auto border rounded-lg max-h-96">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                            <tr>
                                <th className="p-3 font-medium">Timestamp</th>
                                <th className="p-3 font-medium">Action</th>
                                <th className="p-3 font-medium">Details</th>
                                <th className="p-3 font-medium">User Involved</th>
                                <th className="p-3 font-medium">Performed By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length > 0 ? filteredLogs.map(log => (
                                <tr key={log.id} className="border-b dark:border-slate-700">
                                    <td className="p-3 whitespace-nowrap" title={new Date(log.timestamp).toLocaleString()}>{formatTimeAgo(log.timestamp)}</td>
                                    <td className="p-3"><span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{log.type}</span></td>
                                    <td className="p-3">{log.title}</td>
                                    <td className="p-3 text-slate-500 dark:text-slate-300">{log.details?.userName || log.details?.userId || 'N/A'}</td>
                                    <td className="p-3 text-slate-500 dark:text-slate-300">{log.details?.adminName || 'System'}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="text-center p-8 text-slate-500 dark:text-slate-300">No security logs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
};


export default AdminSecurity;
