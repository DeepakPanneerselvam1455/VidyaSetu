
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { TutoringSession, User } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import Dialog from '../../components/ui/Dialog';
import { cn } from '../../lib/utils';
import { SessionCalendar } from '../../components/SessionCalendar';

// Icons
const VideoIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>;
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const HistoryIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
const ListIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const StickyNoteIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/></svg>;
const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

const MentorTutoring: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<TutoringSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [studentMap, setStudentMap] = useState<Record<string, string>>({});
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [preselectedDate, setPreselectedDate] = useState<string>('');

    // Notes State
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [selectedSessionForNotes, setSelectedSessionForNotes] = useState<TutoringSession | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    // Cancel Session State
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [sessionToCancel, setSessionToCancel] = useState<TutoringSession | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchSessions = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [mySessions, allUsers] = await Promise.all([
                api.getSessionsForUser(user.id, 'mentor'),
                api.getUsers()
            ]);
            setSessions(mySessions);
            const map: Record<string, string> = {};
            allUsers.forEach(u => map[u.id] = u.name);
            setStudentMap(map);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [user]);

    const handleCreateSession = async (data: any) => {
        if (!user) return;
        try {
            const newSession: Omit<TutoringSession, 'id'> = {
                mentorId: user.id,
                studentIds: [], // Empty initially for open groups
                topic: data.topic,
                description: data.description,
                startTime: new Date(data.date + 'T' + data.time).toISOString(),
                duration: parseInt(data.duration),
                status: 'scheduled',
                type: data.type,
                category: 'tutoring',
                maxStudents: parseInt(data.maxStudents),
            };
            await api.createTutoringSession(newSession);
            setIsCreateModalOpen(false);
            fetchSessions();
        } catch (error) {
            console.error("Failed to create session", error);
        }
    };

    const handleStartSession = (sessionId: string) => {
        navigate(`/room/${sessionId}`);
    };

    const handleCancelSession = (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setSessionToCancel(session);
            setCancelReason('');
            setIsCancelModalOpen(true);
        }
    };

    const confirmCancelSession = async () => {
        if (!sessionToCancel) return;
        setIsCancelling(true);
        try {
            // Append reason to notes if provided, so it's recorded
            let notes = sessionToCancel.privateNotes || '';
            if (cancelReason.trim()) {
                notes = `[Cancelled: ${cancelReason}] ${notes}`;
            }

            const updatedSession = { 
                ...sessionToCancel, 
                status: 'cancelled' as const,
                privateNotes: notes
            };
            
            await api.updateTutoringSession(updatedSession);
            
            // Update local state to reflect changes immediately
            setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
            
            setIsCancelModalOpen(false);
            setSessionToCancel(null);
        } catch (error) {
            console.error("Failed to cancel session", error);
        } finally {
            setIsCancelling(false);
        }
    };

    const handleOpenNotes = (session: TutoringSession) => {
        setSelectedSessionForNotes(session);
        setNoteContent(session.privateNotes || '');
        setIsNotesModalOpen(true);
    };

    const handleSaveNotes = async () => {
        if (!selectedSessionForNotes) return;
        setIsSavingNotes(true);
        try {
            const updatedSession = { ...selectedSessionForNotes, privateNotes: noteContent };
            await api.updateTutoringSession(updatedSession);
            
            // Update local state to reflect changes immediately
            setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
            
            setIsNotesModalOpen(false);
            setSelectedSessionForNotes(null);
        } catch (error) {
            console.error("Failed to save notes", error);
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleCalendarDateClick = (date: Date) => {
        const formattedDate = date.toISOString().split('T')[0];
        setPreselectedDate(formattedDate);
        setIsCreateModalOpen(true);
    };

    const now = new Date();
    const isPast = (s: TutoringSession) => {
        const endTime = new Date(new Date(s.startTime).getTime() + s.duration * 60000);
        return s.status === 'completed' || s.status === 'cancelled' || endTime < now;
    };

    const upcomingSessions = sessions.filter(s => !isPast(s)).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const pastSessions = sessions.filter(s => isPast(s)).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const displaySessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-white">Tutoring Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Schedule classes and manage student sessions.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("h-8 px-3", viewMode === 'list' && "bg-white dark:bg-slate-700 shadow-sm")}
                            onClick={() => setViewMode('list')}
                        >
                            <ListIcon className="w-4 h-4 mr-2" /> List
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("h-8 px-3", viewMode === 'calendar' && "bg-white dark:bg-slate-700 shadow-sm")}
                            onClick={() => setViewMode('calendar')}
                        >
                            <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
                        </Button>
                    </div>
                    <Button onClick={() => { setPreselectedDate(''); setIsCreateModalOpen(true); }}>
                        <PlusIcon className="w-4 h-4 mr-2" /> Schedule Session
                    </Button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <SessionCalendar 
                    sessions={sessions}
                    onSessionClick={(s) => handleStartSession(s.id)}
                    onDateClick={handleCalendarDateClick}
                />
            ) : (
                <>
                    {/* Tabs */}
                    <div className="border-b border-slate-200 dark:border-slate-700">
                        <nav className="-mb-px flex space-x-6">
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className={cn(
                                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                    activeTab === 'upcoming'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                                )}
                            >
                                Upcoming & Active ({upcomingSessions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('past')}
                                className={cn(
                                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                    activeTab === 'past'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                                )}
                            >
                                Session History
                            </button>
                        </nav>
                    </div>

                    {isLoading ? <p>Loading sessions...</p> : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {displaySessions.length > 0 ? displaySessions.map(session => (
                                <Card key={session.id} className={cn("flex flex-col", activeTab === 'past' && "opacity-75 hover:opacity-100 transition-opacity")}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <Badge variant={session.type === 'one-on-one' ? 'default' : 'secondary'}>
                                                {session.type === 'one-on-one' ? '1-on-1' : 'Group Class'}
                                            </Badge>
                                            <Badge variant="outline" className="capitalize">{session.status}</Badge>
                                        </div>
                                        <CardTitle className="mt-2 text-lg">{session.topic}</CardTitle>
                                        <CardDescription>
                                            {session.studentIds.length} / {session.maxStudents} Students
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-3 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <CalendarIcon className="w-4 h-4" />
                                            <span>{new Date(session.startTime).toLocaleString()}</span>
                                        </div>
                                        {session.studentIds.length > 0 && (
                                            <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                                                <UsersIcon className="w-4 h-4 mt-0.5" />
                                                <div className="text-xs">
                                                    <span className="font-semibold">Participants:</span><br/>
                                                    {session.studentIds.map(id => studentMap[id] || 'Unknown').join(', ')}
                                                </div>
                                            </div>
                                        )}
                                        {session.description && <p className="text-slate-500 mt-2">{session.description}</p>}
                                    </CardContent>
                                    <CardFooter className="flex justify-between gap-2 pt-2 border-t dark:border-slate-800">
                                        {activeTab === 'upcoming' ? (
                                            <>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenNotes(session)} title="Private Notes">
                                                        <StickyNoteIcon className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleCancelSession(session.id)}>Cancel</Button>
                                                </div>
                                                <Button size="sm" onClick={() => handleStartSession(session.id)}>Start</Button>
                                            </>
                                        ) : (
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenNotes(session)}>
                                                <StickyNoteIcon className="w-4 h-4 mr-2" /> View Notes
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            )) : (
                                <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                                    {activeTab === 'upcoming' ? (
                                        <>
                                            <UsersIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                                            <p className="font-semibold text-lg">No Upcoming Sessions</p>
                                            <p className="text-slate-500">Create a group class or wait for student bookings.</p>
                                        </>
                                    ) : (
                                        <>
                                            <HistoryIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                                            <p className="font-semibold text-lg">No Past Sessions</p>
                                            <p className="text-slate-500">Completed sessions will appear here.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <CreateSessionDialog 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onCreate={handleCreateSession}
                initialDate={preselectedDate}
            />

            {/* Notes Dialog */}
            <Dialog 
                isOpen={isNotesModalOpen} 
                onClose={() => setIsNotesModalOpen(false)} 
                title={selectedSessionForNotes ? `Notes: ${selectedSessionForNotes.topic}` : 'Session Notes'}
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        These notes are private and only visible to you. Use them to track student progress, prepare for future sessions, or jot down reminders.
                    </p>
                    <Textarea 
                        value={noteContent} 
                        onChange={e => setNoteContent(e.target.value)} 
                        placeholder="Write your private notes here..." 
                        className="min-h-[200px]"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsNotesModalOpen(false)} disabled={isSavingNotes}>Cancel</Button>
                        <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
                            {isSavingNotes ? 'Saving...' : 'Save Notes'}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Cancel Session Confirmation Dialog */}
            <Dialog
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                title="Cancel Session"
            >
                <div className="space-y-4">
                    {sessionToCancel && (
                        <>
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-md text-sm space-y-1">
                                <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-semibold mb-2">
                                    <AlertTriangleIcon className="w-5 h-5" />
                                    Warning
                                </div>
                                <p>You are about to cancel <span className="font-semibold">{sessionToCancel.topic}</span>.</p>
                                <p>Scheduled for: <span className="font-semibold">{new Date(sessionToCancel.startTime).toLocaleString()}</span></p>
                                <p className="mt-2">This action cannot be undone and students will be notified.</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Reason for Cancellation (Optional)</label>
                                <Textarea 
                                    value={cancelReason} 
                                    onChange={e => setCancelReason(e.target.value)}
                                    placeholder="e.g., Personal emergency, technical issues..."
                                    rows={2}
                                />
                            </div>
                        </>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} disabled={isCancelling}>Keep Session</Button>
                        <Button variant="destructive" onClick={confirmCancelSession} disabled={isCancelling}>
                            {isCancelling ? 'Cancelling...' : 'Yes, Cancel Session'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

const CreateSessionDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: any) => void;
    initialDate?: string;
}> = ({ isOpen, onClose, onCreate, initialDate }) => {
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState(initialDate || '');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('60');
    const [type, setType] = useState('group');
    const [maxStudents, setMaxStudents] = useState('10');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDate(initialDate || '');
        }
    }, [isOpen, initialDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ topic, date, time, duration, type, maxStudents, description });
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Schedule New Session">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Topic</label>
                    <Input value={topic} onChange={e => setTopic(e.target.value)} required placeholder="e.g., Weekly Q&A" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Time</label>
                        <Input type="time" value={time} onChange={e => setTime(e.target.value)} required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Session Type</label>
                        <Select value={type} onChange={e => {
                            setType(e.target.value);
                            setMaxStudents(e.target.value === 'one-on-one' ? '1' : '10');
                        }}>
                            <option value="group">Group Class</option>
                            <option value="one-on-one">1-on-1</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Max Students</label>
                        <Input 
                            type="number" 
                            value={maxStudents} 
                            onChange={e => setMaxStudents(e.target.value)} 
                            disabled={type === 'one-on-one'} 
                            min="1"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                    <Select value={duration} onChange={e => setDuration(e.target.value)}>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min</option>
                        <option value="90">90 min</option>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Schedule</Button>
                </div>
            </form>
        </Dialog>
    );
};

export default MentorTutoring;
