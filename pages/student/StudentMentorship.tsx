
import React, { useState, useEffect } from 'react';
import * as api from '../../lib/api';
import { User, MentorshipRequest } from '../../types';
import { useAuth } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import Dialog from '../../components/ui/Dialog';
import { Textarea } from '../../components/ui/Textarea';

// Icons
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const MapPinIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;

const StudentMentorship: React.FC = () => {
    const { user } = useAuth();
    const [mentors, setMentors] = useState<User[]>([]);
    const [requests, setRequests] = useState<MentorshipRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMentor, setSelectedMentor] = useState<User | null>(null);
    const [requestMessage, setRequestMessage] = useState('');

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [availableMentors, myRequests] = await Promise.all([
                api.getMentors(),
                api.getMentorshipRequests(user.id, 'student')
            ]);
            setMentors(availableMentors);
            setRequests(myRequests);
        } catch (error) {
            console.error("Failed to fetch mentorship data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleSendRequest = async () => {
        if (!user || !selectedMentor) return;
        try {
            await api.createMentorshipRequest({
                studentId: user.id,
                mentorId: selectedMentor.id,
                message: requestMessage
            });
            setSelectedMentor(null);
            setRequestMessage('');
            fetchData();
        } catch (error) {
            console.error("Failed to send request", error);
        }
    };

    const getRequestStatus = (mentorId: string) => {
        const req = requests.find(r => r.mentorId === mentorId);
        return req ? req.status : null;
    };

    const filteredMentors = mentors.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.expertise?.some(e => e.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-white">Find a Mentor</h1>
                    <p className="text-slate-500 dark:text-slate-400">Connect with experts for career advice and academic guidance.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search by name or skill..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? <p>Loading mentors...</p> : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMentors.map(mentor => {
                        const status = getRequestStatus(mentor.id);
                        return (
                            <Card key={mentor.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg">
                                            {mentor.name.charAt(0)}
                                        </div>
                                        {status && (
                                            <Badge variant={status === 'accepted' ? 'success' : status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                                                {status === 'pending' ? 'Request Sent' : status}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="mt-4">{mentor.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">{mentor.bio || "No bio available."}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {mentor.expertise?.map(skill => (
                                            <Badge key={skill} variant="outline">{skill}</Badge>
                                        ))}
                                    </div>
                                    {mentor.state && (
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <MapPinIcon className="w-4 h-4" />
                                            <span>{mentor.state}</span>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button 
                                        className="w-full" 
                                        onClick={() => setSelectedMentor(mentor)}
                                        disabled={!!status}
                                    >
                                        {status === 'accepted' ? 'Message Mentor' : status ? 'Request Pending' : 'Request Mentorship'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog 
                isOpen={!!selectedMentor} 
                onClose={() => setSelectedMentor(null)} 
                title={`Request Mentorship from ${selectedMentor?.name}`}
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Introduce yourself and explain why you'd like them as your mentor.</p>
                    <Textarea 
                        value={requestMessage} 
                        onChange={e => setRequestMessage(e.target.value)} 
                        placeholder="Hi, I'm interested in..."
                        rows={4}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setSelectedMentor(null)}>Cancel</Button>
                        <Button onClick={handleSendRequest}>Send Request</Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default StudentMentorship;
