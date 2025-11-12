
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';

const initialFlaggedContent = [
    { id: 'flag-1', type: 'Quiz Question', content: 'What is the color of the sky on a cloudy day?', reason: 'Inappropriate/Unclear Question', reportedBy: 'student@skillforge.com', status: 'pending' },
    { id: 'flag-2', type: 'Course Review', content: 'This course was terrible, the instructor is awful.', reason: 'Harassment/Hate Speech', reportedBy: 'instructor@skillforge.com', status: 'pending' },
    { id: 'flag-3', type: 'User Comment', content: 'Check out my cool new website for free courses: spam.com', reason: 'Spam/Advertisement', reportedBy: 'student2@skillforge.com', status: 'pending' },
];

const AdminContentModeration: React.FC = () => {
    const [flaggedContent, setFlaggedContent] = useState(initialFlaggedContent);
    const [filter, setFilter] = useState('all');

    const handleAction = (id: string, action: 'approve' | 'delete') => {
        setFlaggedContent(prev => prev.filter(item => item.id !== id));
        // In a real app, you would also call an API here.
        console.log(`Action: ${action} on item ${id}`);
    };
    
    const handleEdit = (id: string) => {
        alert(`Editing functionality for item ${id} is not implemented in this demo.`);
    };

    const filteredContent = useMemo(() => {
        if (filter === 'all') return flaggedContent;
        const typeMap: { [key: string]: string } = {
            'quiz': 'Quiz Question',
            'review': 'Course Review',
            'comment': 'User Comment',
        };
        return flaggedContent.filter(item => item.type === typeMap[filter]);
    }, [flaggedContent, filter]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">Content Moderation Queue</h1>
            
             <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Flagged Content</CardTitle>
                        <CardDescription>Review content reported by users or the system. ({filteredContent.length} items pending)</CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        <Select value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="all">All Types</option>
                            <option value="quiz">Quiz Question</option>
                            <option value="review">Course Review</option>
                            <option value="comment">User Comment</option>
                        </Select>
                        <Button variant="outline" onClick={() => setFlaggedContent(initialFlaggedContent)}>Reset</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {filteredContent.length > 0 ? (
                        filteredContent.map(item => (
                            <div key={item.id} className="p-4 border dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Badge variant="secondary">{item.type}</Badge>
                                        <p className="mt-2 p-3 bg-white dark:bg-slate-800 rounded-md italic">"{item.content}"</p>
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="font-semibold text-red-600">{item.reason}</p>
                                        <p className="text-slate-500 dark:text-slate-300">Reported by: {item.reportedBy}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-3 pt-3 border-t dark:border-slate-700">
                                    <Button size="sm" variant="destructive" onClick={() => handleAction(item.id, 'delete')}>Delete Content</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleEdit(item.id)}>Edit Content</Button>
                                    <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction(item.id, 'approve')}>Approve</Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16">
                            <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500" />
                            <h3 className="mt-4 text-lg font-medium">Queue is Clear!</h3>
                            <p className="text-slate-500 dark:text-slate-300 mt-1">No content is currently awaiting moderation.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);


export default AdminContentModeration;