

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import { logActivity } from '../../lib/activityLog';

type SettingsTab = 'general' | 'appearance' | 'notifications' | 'integrations';

const SETTINGS_KEY = 'skillforge_settings';

const defaultSettings = {
    general: {
        platformName: 'SkillForge',
        platformUrl: 'https://skillforge.ai',
        publicRegistration: true,
    },
    appearance: {
        logo: '',
        primaryColor: '#6B73FF',
    },
    notifications: {
        newUser: true,
        quizSubmit: false,
        mentorNotify: true,
    },
    integrations: {
        googleAnalytics: '',
        stripe: '',
    }
};

const AdminSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [settings, setSettings] = useState(defaultSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const { user: adminUser } = useAuth();

    useEffect(() => {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleSettingsChange = (tab: SettingsTab, key: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [tab]: {
                ...prev[tab],
                [key]: value
            }
        }));
    };

    const handleSaveChanges = () => {
        setIsSaving(true);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        logActivity('system_setting_change', 'System settings were updated.', {
            adminId: adminUser?.id,
            adminName: adminUser?.name,
        });
        setTimeout(() => {
            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        }, 500);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">System Settings</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <nav className="flex flex-col space-y-1">
                        <SettingsTabButton tab="general" activeTab={activeTab} onClick={setActiveTab}>General</SettingsTabButton>
                        <SettingsTabButton tab="appearance" activeTab={activeTab} onClick={setActiveTab}>Appearance</SettingsTabButton>
                        <SettingsTabButton tab="notifications" activeTab={activeTab} onClick={setActiveTab}>Notifications</SettingsTabButton>
                        <SettingsTabButton tab="integrations" activeTab={activeTab} onClick={setActiveTab}>Integrations</SettingsTabButton>
                    </nav>
                </div>

                <div className="md:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="capitalize">{activeTab} Settings</CardTitle>
                            <CardDescription>
                                {activeTab === 'general' && 'Manage basic platform settings.'}
                                {activeTab === 'appearance' && 'Customize the look and feel of the platform.'}
                                {activeTab === 'notifications' && 'Configure automated email notifications.'}
                                {activeTab === 'integrations' && 'Connect third-party services.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {activeTab === 'general' && <GeneralSettings settings={settings.general} onChange={(key, value) => handleSettingsChange('general', key, value)} />}
                            {activeTab === 'appearance' && <AppearanceSettings settings={settings.appearance} onChange={(key, value) => handleSettingsChange('appearance', key, value)} />}
                            {activeTab === 'notifications' && <NotificationSettings settings={settings.notifications} onChange={(key, value) => handleSettingsChange('notifications', key, value)} />}
                            {activeTab === 'integrations' && <IntegrationSettings settings={settings.integrations} onChange={(key, value) => handleSettingsChange('integrations', key, value)} />}
                        </CardContent>
                        <CardFooter className="border-t dark:border-slate-800 pt-6 flex justify-end items-center gap-4">
                            {saveSuccess && <p className="text-sm text-green-600">Settings saved successfully!</p>}
                            <Button onClick={handleSaveChanges} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const SettingsTabButton: React.FC<{ tab: SettingsTab; activeTab: SettingsTab; onClick: (tab: SettingsTab) => void; children: React.ReactNode }> = ({ tab, activeTab, onClick, children }) => {
    return (
        <button
            onClick={() => onClick(tab)}
            className={cn(
                'px-3 py-2 text-left rounded-md text-sm font-medium transition-colors',
                activeTab === tab 
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' 
                    : 'hover:bg-slate-100/50 dark:text-white/80 dark:hover:bg-slate-800/50'
            )}
        >
            {children}
        </button>
    )
}

const GeneralSettings = ({ settings, onChange }: { settings: typeof defaultSettings.general, onChange: (key: string, value: any) => void }) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium mb-1">Platform Name</label>
            <Input value={settings.platformName} onChange={e => onChange('platformName', e.target.value)} />
        </div>
         <div>
            <label className="block text-sm font-medium mb-1">Platform URL</label>
            <Input type="url" value={settings.platformUrl} onChange={e => onChange('platformUrl', e.target.value)} />
        </div>
        <div className="flex items-center space-x-2 pt-2">
            <ToggleSwitch id="public-registration" checked={settings.publicRegistration} onChange={e => onChange('publicRegistration', e.target.checked)} />
            <label htmlFor="public-registration">Allow Public Registration</label>
        </div>
    </div>
);

const AppearanceSettings = ({ settings, onChange }: { settings: typeof defaultSettings.appearance, onChange: (key: string, value: any) => void }) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium mb-1">Platform Logo</label>
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center font-bold text-slate-500">SF</div>
                <Input type="file" className="max-w-xs" />
            </div>
        </div>
         <div>
            <label className="block text-sm font-medium mb-1">Primary Theme Color</label>
            <div className="flex items-center gap-2">
                <Input type="color" value={settings.primaryColor} onChange={e => onChange('primaryColor', e.target.value)} className="w-12 h-10 p-1"/>
                <Input value={settings.primaryColor} onChange={e => onChange('primaryColor', e.target.value)} className="max-w-xs" />
            </div>
        </div>
    </div>
);

const NotificationSettings = ({ settings, onChange }: { settings: typeof defaultSettings.notifications, onChange: (key: string, value: any) => void }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <label htmlFor="new-user-notif" className="font-medium">New User Registration</label>
                <p className="text-sm text-slate-500 dark:text-slate-300">Send a welcome email to new users.</p>
            </div>
            <ToggleSwitch id="new-user-notif" checked={settings.newUser} onChange={e => onChange('newUser', e.target.checked)} />
        </div>
        <div className="flex items-center justify-between">
             <div>
                <label htmlFor="quiz-submit-notif" className="font-medium">Quiz Submission Confirmation</label>
                <p className="text-sm text-slate-500 dark:text-slate-300">Send a confirmation email to students after they submit a quiz.</p>
            </div>
            <ToggleSwitch id="quiz-submit-notif" checked={settings.quizSubmit} onChange={e => onChange('quizSubmit', e.target.checked)} />
        </div>
         <div className="flex items-center justify-between">
             <div>
                <label htmlFor="mentor-notif" className="font-medium">Instructor Notifications</label>
                <p className="text-sm text-slate-500 dark:text-slate-300">Notify instructors when a student completes one of their quizzes.</p>
            </div>
            <ToggleSwitch id="mentor-notif" checked={settings.mentorNotify} onChange={e => onChange('mentorNotify', e.target.checked)} />
        </div>
    </div>
);

const IntegrationSettings = ({ settings, onChange }: { settings: typeof defaultSettings.integrations, onChange: (key: string, value: any) => void }) => (
     <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium mb-1">Google Analytics</label>
            <Input placeholder="UA-XXXXXXXXX-X" value={settings.googleAnalytics} onChange={e => onChange('googleAnalytics', e.target.value)} />
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Enable tracking of platform usage and user behavior.</p>
        </div>
        <div>
            <label className="block text-sm font-medium mb-1">Stripe API Key</label>
            <Input type="password" placeholder="sk_test_... or pk_test_..." value={settings.stripe} onChange={e => onChange('stripe', e.target.value)} />
             <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Connect your Stripe account for course payments (feature coming soon).</p>
        </div>
    </div>
);


const ToggleSwitch = ({ id, ...props }: { id: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="relative inline-block w-10 mr-2 align-middle select-none">
        <input type="checkbox" name={id} id={id} className="peer toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-indigo-600 focus:outline-none" {...props} />
        <label htmlFor={id} className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 dark:bg-slate-700 cursor-pointer peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></label>
    </div>
);


export default AdminSettings;