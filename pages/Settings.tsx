import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

const Settings: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your account settings and preferences.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-500 dark:text-slate-400">
                        Account settings functionality will be implemented here in a future update. You will be able to manage your password, notification preferences, and more.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;