import { supabase } from './api';
import { formatDistanceToNow } from 'date-fns';

export interface ActivityLogEntry {
    id: string;
    type: string; // Changed from action to type to match usage
    title: string; // Changed from details to title to match usage
    timestamp: string;
    details?: any; // Added details object
}

export const formatTimeAgo = (timestamp: string): string => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

// --- Core Logging Functions ---
export const getActivityLog = async (): Promise<ActivityLogEntry[]> => {
    try {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(50);

        if (error) {
            console.error("Failed to fetch activity log", error);
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            type: d.type || 'unknown',
            title: d.title || '',
            timestamp: d.timestamp,
            details: d.details
        }));
    } catch (e) {
        console.error("Exception in getActivityLog", e);
        return [];
    }
};

export const logActivity = async (type: string, title: string, details?: any) => {
    try {
        const { error } = await supabase.from('activity_logs').insert([{
            type,
            title,
            details,
            timestamp: new Date().toISOString()
        }]);

        if (error) {
            console.error("Failed to log activity to Supabase", error);
        }
    } catch (err) {
        console.error("Failed to log activity to Supabase", err);
    }
};

export const clearActivityLog = async () => {
    // Optional: Implement if needed, though usually logs should be immutable
    console.warn("clearActivityLog not implemented for Supabase backend");
};

// Deprecated/No-op functions for compatibility if needed
export const subscribe = (cb: any) => { };
export const unsubscribe = (cb: any) => { };