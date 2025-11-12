// lib/activityLog.ts
import { formatDistanceToNow } from 'https://cdn.skypack.dev/date-fns';

export type ActivityType = 
    | 'user_login' 
    | 'user_create' 
    | 'user_delete'
    | 'user_role_change'
    | 'user_password_reset' 
    | 'course_create' 
    | 'course_update' 
    | 'course_delete'
    | 'quiz_submit'
    | 'quiz_create'
    | 'quiz_delete'
    | 'report_generated'
    | 'system_setting_change'
    | 'content_moderation_approve'
    | 'security_alert';

export interface ActivityLogEntry {
    id: string;
    type: ActivityType;
    title: string;
    timestamp: string;
    details?: Record<string, any>;
}

const LOG_KEY = 'skillforge_activity_log';

// --- Pub/Sub for real-time updates ---
type Listener = (newLog: ActivityLogEntry) => void;
const listeners = new Set<Listener>();

export const subscribe = (callback: Listener) => {
    listeners.add(callback);
};

export const unsubscribe = (callback: Listener) => {
    listeners.delete(callback);
};

const notify = (newLog: ActivityLogEntry) => {
    listeners.forEach(listener => listener(newLog));
};


// --- Core Logging Functions ---
export const getActivityLog = (): ActivityLogEntry[] => {
    try {
        const log = localStorage.getItem(LOG_KEY);
        return log ? JSON.parse(log) : [];
    } catch (e) {
        return [];
    }
};

export const logActivity = (type: ActivityType, title: string, details?: Record<string, any>): void => {
    const currentLog = getActivityLog();
    const newEntry: ActivityLogEntry = {
        id: `log-${Date.now()}`,
        type,
        title,
        timestamp: new Date().toISOString(),
        details,
    };

    const updatedLog = [newEntry, ...currentLog].slice(0, 50); // Keep last 50 entries
    localStorage.setItem(LOG_KEY, JSON.stringify(updatedLog));
    notify(newEntry);
};

// --- Utility ---
export const formatTimeAgo = (timestamp: string): string => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};