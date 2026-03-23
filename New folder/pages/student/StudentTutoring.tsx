
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { TutoringSession, User, AvailabilitySlot } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import Dialog from '../../components/ui/Dialog';
import { cn } from '../../lib/utils';
import { SessionCalendar } from '../../components/SessionCalendar';

// Icons
const VideoIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>;
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>;
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const HistoryIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>;
const ListIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StudentTutoring: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<TutoringSession[]>([]);
    const [mentors, setMentors] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch both "my history" and "all available upcoming sessions"
            const [mySessions, availableSessions, allUsers] = await Promise.all([
                api.getSessionsForUser(user.id, 'student'), // For history
                api.getAvailableSessions(),                // For discovery
                api.getUsers()
            ]);

            // Merge and deduplicate
            const sessionMap = new Map();
            mySessions.forEach((s: any) => sessionMap.set(s.id, s));
            availableSessions.forEach((s: any) => sessionMap.set(s.id, s));

            setSessions(Array.from(sessionMap.values()));
            setMentors(allUsers.filter(u => u.role === 'mentor'));
        } catch (error) {
            console.error("Failed to fetch tutoring data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleJoinSession = async (session: TutoringSession) => {
        if (!user) return;

        // If not already a participant, join data-wise first
        const isParticipant = session.studentIds && session.studentIds.includes(user.id);

        if (!isParticipant) {
            try {
                await api.joinTutoringSession(session.id, user.id);
            } catch (err) {
                console.error("Failed to join session", err);
                return; // Don't navigate if join failed
            }
        }
        navigate(`/room/${session.id}`);
    };

    const handleBookSession = async (sessionData: any) => {
        if (!user) return;
        try {
            const newSession: Omit<TutoringSession, 'id'> = {
                mentorId: sessionData.mentorId,
                studentIds: [user.id],
                topic: sessionData.topic,
                description: sessionData.description,
                startTime: new Date(sessionData.date + 'T' + sessionData.time).toISOString(),
                duration: parseInt(sessionData.duration),
                status: 'scheduled',
                type: 'one-on-one',
                category: 'tutoring',
                focus: sessionData.focus,
                maxStudents: 1,
            };
            await api.createTutoringSession(newSession);
            setIsBookingModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Failed to book session", error);
        }
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
                    <h1 className="text-3xl font-bold tracking-tight text-text">Virtual Tutoring</h1>
                    <p className="text-text-muted">Book 1-on-1 sessions for doubt clearing or exam prep.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-secondary rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 px-3 text-text-muted hover:text-text", viewMode === 'list' && "bg-card text-primary shadow-sm")}
                            onClick={() => setViewMode('list')}
                        >
                            <ListIcon className="w-4 h-4 mr-2" /> List
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 px-3 text-text-muted hover:text-text", viewMode === 'calendar' && "bg-card text-primary shadow-sm")}
                            onClick={() => setViewMode('calendar')}
                        >
                            <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
                        </Button>
                    </div>
                    <Button onClick={() => setIsBookingModalOpen(true)}>
                        <PlusIcon className="w-4 h-4 mr-2" /> Book a Session
                    </Button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <SessionCalendar
                    sessions={sessions}
                    onSessionClick={(s) => handleJoinSession(s)}
                />
            ) : (
                <>
                    <div className="border-b border-border">
                        <nav className="-mb-px flex space-x-6">
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className={cn(
                                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                    activeTab === 'upcoming'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-text-muted hover:text-text hover:border-border'
                                )}
                            >
                                Upcoming Sessions ({upcomingSessions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('past')}
                                className={cn(
                                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                    activeTab === 'past'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-text-muted hover:text-text hover:border-border'
                                )}
                            >
                                History
                            </button>
                        </nav>
                    </div>

                    {isLoading ? <p>Loading sessions...</p> : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {displaySessions.length > 0 ? displaySessions.map(session => (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    isStudent={true}
                                    onJoin={() => handleJoinSession(session)}
                                    mentors={mentors}
                                    isPast={activeTab === 'past'}
                                    currentUser={user}
                                />
                            )) : (
                                <div className="col-span-full text-center py-12 border-2 border-dashed border-border rounded-lg">
                                    {activeTab === 'upcoming' ? (
                                        <>
                                            <VideoIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                            <p className="font-semibold text-lg">No Upcoming Sessions</p>
                                            <p className="text-muted-foreground">Book a session with a mentor to get started.</p>
                                        </>
                                    ) : (
                                        <>
                                            <HistoryIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                            <p className="font-semibold text-lg">No Session History</p>
                                            <p className="text-muted-foreground">You haven't completed any sessions yet.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <BookSessionDialog
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                mentors={mentors}
                onBook={handleBookSession}
            />
        </div>
    );
};

const SessionCard: React.FC<{
    session: TutoringSession;
    isStudent: boolean;
    onJoin: () => void;
    mentors: User[];
    isPast?: boolean;
    currentUser: User | null;
}> = ({ session, isStudent, onJoin, mentors, isPast, currentUser }) => {
    const startTime = new Date(session.startTime);
    const isToday = new Date().toDateString() === startTime.toDateString();
    const mentor = mentors.find(m => m.id === session.mentorId);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'scheduled': return 'default';
            case 'active': return 'success';
            case 'completed': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <Card className={cn("flex flex-col", isPast && "opacity-75 hover:opacity-100 transition-opacity")}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <Badge variant={session.type === 'one-on-one' ? 'default' : 'secondary'} className="w-fit">
                            {session.type === 'one-on-one' ? '1-on-1' : 'Group'}
                        </Badge>
                        {session.focus && (
                            <Badge variant="outline" className="w-fit text-[10px] uppercase tracking-wider">
                                {session.focus.replace('-', ' ')}
                            </Badge>
                        )}
                    </div>
                    <Badge variant={getStatusVariant(session.status)} className="capitalize">
                        {session.status}
                    </Badge>
                </div>
                <CardTitle className="mt-2 text-lg">{session.topic}</CardTitle>
                <CardDescription>
                    with {mentor ? mentor.name : 'Unknown Mentor'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 text-sm">
                <div className="flex items-center gap-2 text-text-muted">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{startTime.toLocaleDateString()} {isToday && '(Today)'}</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                    <ClockIcon className="w-4 h-4" />
                    <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.duration} min)</span>
                </div>
                {session.description && <p className="text-text-muted line-clamp-2">{session.description}</p>}
            </CardContent>
            {!isPast && (
                <CardFooter>
                    <Button className="w-full" onClick={onJoin} disabled={session.status === 'cancelled'}>
                        {currentUser && session.studentIds?.includes(currentUser.id)
                            ? (session.status === 'active' ? 'Enter Room' : 'Enter Room (Scheduled)')
                            : 'Join Session'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

const BookSessionDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    mentors: User[];
    onBook: (data: any) => void;
}> = ({ isOpen, onClose, mentors, onBook }) => {
    const [mentorId, setMentorId] = useState('');
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('30');
    const [description, setDescription] = useState('');
    const [focus, setFocus] = useState('concept');

    const selectedMentor = mentors.find(m => m.id === mentorId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onBook({ mentorId, topic, date, time, duration, description, focus });
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Book a Session">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Select Mentor</label>
                    <Select value={mentorId} onChange={e => setMentorId(e.target.value)} required>
                        <option value="" disabled>Choose a mentor</option>
                        {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </Select>
                </div>

                {selectedMentor && selectedMentor.availability && selectedMentor.availability.length > 0 && (
                    <div className="p-3 bg-secondary border border-border rounded-lg animate-in fade-in slide-in-from-top-1 duration-300">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                            <ClockIcon className="w-3 h-3" /> Preferred Tutoring Times
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {selectedMentor.availability.map(slot => (
                                <Badge key={slot.id} variant="secondary" className="bg-card text-[10px] py-0 px-2 h-6">
                                    {DAYS[slot.dayOfWeek].substring(0, 3)} {slot.startTime}-{slot.endTime}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1">Topic</label>
                    <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., React Hooks Help" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Session Focus</label>
                    <Select value={focus} onChange={e => setFocus(e.target.value)} required>
                        <option value="concept">Concept Explanation</option>
                        <option value="doubt-clearing">Doubt Clearing</option>
                        <option value="exam-prep">Exam Preparation</option>
                    </Select>
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
                <div>
                    <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                    <Select value={duration} onChange={e => setDuration(e.target.value)}>
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min</option>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                    <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe what you want to cover" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Book Session</Button>
                </div>
            </form>
        </Dialog>
    );
};

export default StudentTutoring;
