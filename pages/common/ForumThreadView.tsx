
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { ForumThread, ForumPost } from '../../types';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';
import { validateForumPostForm } from '../../lib/formValidation';
import { FormError } from '../../components/ui/FormError';

// Icons
const ThumbsUpIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>;
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>;

const ForumThreadView: React.FC = () => {
    const { threadId } = useParams<{ threadId: string }>();
    const { user } = useAuth();
    const [thread, setThread] = useState<ForumThread | null>(null);
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [newReply, setNewReply] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [replyError, setReplyError] = useState<string | null>(null);

    const fetchData = async () => {
        if (!threadId) return;
        setIsLoading(true);
        try {
            const [t, p] = await Promise.all([
                api.getForumThreadById(threadId),
                api.getForumPosts(threadId)
            ]);
            setThread(t);
            setPosts(p);
        } catch (error) {
            console.error("Failed to load thread", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [threadId]);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !threadId) return;
        
        setReplyError(null);
        
        // Validate form
        const validation = validateForumPostForm(newReply);
        if (!validation.isValid) {
            setReplyError(validation.errors.content || null);
            return;
        }
        
        try {
            await api.createForumPost({
                threadId,
                authorId: user.id,
                authorName: user.name,
                content: newReply
            });
            setNewReply('');
            fetchData(); // Refresh to see new post
        } catch (error) {
            console.error("Failed to post reply", error);
            setReplyError("Failed to post reply. Please try again.");
        }
    };

    const handleVote = async () => {
        if (!user || !thread) return;
        try {
            await api.toggleThreadVote(thread.id, user.id);
            fetchData();
        } catch (error) {
            console.error("Failed to vote", error);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading discussion...</div>;
    if (!thread) return <div className="p-8 text-center">Thread not found.</div>;

    const hasVoted = user ? thread.upvotes.includes(user.id) : false;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link to="/forums" className="text-sm text-indigo-600 hover:underline">← Back to Forums</Link>

            {/* Main Thread Post */}
            <Card>
                <CardHeader className="pb-4">
                    <h1 className="text-2xl font-bold">{thread.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Posted by {thread.authorName}</span>
                        <span>•</span>
                        <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap" style={{ color: 'var(--text-main)' }}>{thread.content}</p>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
                        <Button
                            variant={hasVoted ? "default" : "outline"}
                            size="sm"
                            onClick={handleVote}
                            className="gap-2"
                        >
                            <ThumbsUpIcon className="w-4 h-4" />
                            {thread.upvotes.length}
                        </Button>
                        <div className="flex gap-2">
                            {thread.tags.map(tag => (
                                <span key={tag} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--kpi-icon-chip)', color: 'var(--text-secondary)' }}>#{tag}</span>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Replies */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{posts.length} Replies</h3>
                {posts.map(post => (
                    <Card key={post.id} style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--surface-nested, var(--kpi-icon-chip))' }}>
                                    <UserIcon className="w-6 h-6 text-slate-500" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-semibold text-sm">{post.authorName}</span>
                                        <span className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-main)' }}>{post.content}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Reply Form */}
            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Post a Reply</h3>
                    <form onSubmit={handleReply} className="space-y-4">
                        <Textarea
                            value={newReply}
                            onChange={e => setNewReply(e.target.value)}
                            placeholder="Type your reply here..."
                            rows={4}
                            required
                            error={replyError}
                        />
                        {replyError && <FormError error={replyError} />}
                        <div className="flex justify-end">
                            <Button type="submit">Post Reply</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForumThreadView;
