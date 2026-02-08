import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';
import * as api from '../../lib/api';
import { TutoringSession } from '../../types';

// Icons
const MicIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const MicOffIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const VideoIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>;
const VideoOffIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16-1.14 1.14a3 3 0 0 1-4.24 0L6 11.5"/><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const MonitorIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const PhoneMissedIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="23" y1="1" x2="17" y2="7"/><line x1="17" y1="1" x2="23" y2="7"/><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const MessageSquareIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const SendIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const RefreshCwIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>;

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: string;
    isSystem?: boolean;
}

const TutoringRoom: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [session, setSession] = useState<TutoringSession | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [chatOpen, setChatOpen] = useState(true);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [remoteUsers, setRemoteUsers] = useState<string[]>([]);
    const [permissionError, setPermissionError] = useState(false);
    
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mountedRef = useRef(true);

    const initMedia = async () => {
        // Clean up previous stream if exists
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            if (mountedRef.current) {
                setPermissionError(true);
                setIsMicOn(false);
                setIsCamOn(false);
            }
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            if (!mountedRef.current) {
                // Component unmounted during request
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            streamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setPermissionError(false);
            setIsMicOn(true);
            setIsCamOn(true);
        } catch (err) {
            console.warn("Media permission denied or device unavailable:", err);
            if (mountedRef.current) {
                setPermissionError(true);
                setIsMicOn(false);
                setIsCamOn(false);
            }
        }
    };

    // Initialize Media Stream
    useEffect(() => {
        mountedRef.current = true;
        initMedia();

        return () => {
            mountedRef.current = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, []);

    const handleRetryMedia = () => {
        initMedia();
    };

    // Toggle Track Handlers
    const toggleMic = () => {
        if (permissionError) {
            handleRetryMedia();
            return;
        }
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = !isMicOn;
        }
        setIsMicOn(!isMicOn);
    };

    const toggleCam = () => {
        if (permissionError) {
            handleRetryMedia();
            return;
        }
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) videoTrack.enabled = !isCamOn;
        }
        setIsCamOn(!isCamOn);
    };

    // Load Session Info
    useEffect(() => {
        if (!sessionId) return;
        api.getTutoringSessionById(sessionId).then(data => {
            if (mountedRef.current) {
                setSession(data);
            }
        });
    }, [sessionId]);

    // Real-time Chat Sync & Initial Setup
    useEffect(() => {
        if (!sessionId || !user) return;

        const storageKey = `skillforge_chat_${sessionId}`;
        
        // Initial Load
        const storedMessages = localStorage.getItem(storageKey);
        if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
        } else {
            // First time joining? Add a system message
            const initialMsg: ChatMessage = { 
                id: 'sys-init', 
                sender: 'System', 
                text: 'Connecting to secure video session...', 
                timestamp: new Date().toISOString(), 
                isSystem: true 
            };
            setMessages([initialMsg]);
            localStorage.setItem(storageKey, JSON.stringify([initialMsg]));
        }

        // Listener for changes in other tabs/windows
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === storageKey && e.newValue) {
                setMessages(JSON.parse(e.newValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Polling interval to ensure UI updates if storage event misses (e.g. same window different component)
        const interval = setInterval(() => {
            if (!mountedRef.current) return;
            const current = localStorage.getItem(storageKey);
            if (current) {
                const parsed = JSON.parse(current);
                setMessages(prev => {
                    if (prev.length !== parsed.length) return parsed;
                    return prev;
                });
            }
        }, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [sessionId, user]);

    // Simulate Remote Participants presence (Visual only)
    useEffect(() => {
        if (!session || !user) return;

        const partnerName = user.role === 'student' ? 'Instructor' : 'Student';
        
        // Simple timeout to show "Partner joined" if not already there
        const timeout = setTimeout(() => {
            if (mountedRef.current) {
                setRemoteUsers([partnerName]);
            }
        }, 1500);
        return () => clearTimeout(timeout);
    }, [session, user]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, chatOpen]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !sessionId) return;
        
        const storageKey = `skillforge_chat_${sessionId}`;
        const msg: ChatMessage = { 
            id: `msg-${Date.now()}`, 
            sender: user.name, 
            text: newMessage, 
            timestamp: new Date().toISOString() 
        };

        // Optimistic update
        const updatedMessages = [...messages, msg];
        setMessages(updatedMessages);
        setNewMessage('');

        // Persist
        localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
    };

    const handleLeave = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (user?.role === 'mentor') navigate('/mentor/tutoring');
        else navigate('/student/tutoring');
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!session) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Loading Session...</div>;

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-900 text-white overflow-hidden">
            {/* Main Stage */}
            <div className="flex-1 flex flex-col relative">
                {/* Session Info Overlay */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg shadow-lg">
                        <h2 className="font-bold text-white text-sm md:text-base">{session.topic}</h2>
                        <p className="text-xs text-slate-300 capitalize flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${remoteUsers.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            {session.type} • {session.duration} min
                        </p>
                    </div>
                </div>

                <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-4">
                    {/* Remote User View (Main) */}
                    {remoteUsers.length > 0 ? (
                        <div className="w-full h-full bg-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800 shadow-2xl">
                            {/* Simulated Remote Video Feed */}
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-900 flex flex-col items-center justify-center">
                                <div className="w-32 h-32 rounded-full bg-indigo-500 flex items-center justify-center text-4xl font-bold mb-4 shadow-xl border-4 border-indigo-400/30 animate-pulse">
                                    {remoteUsers[0].charAt(0)}
                                </div>
                                <h3 className="text-xl font-semibold">{remoteUsers[0]}</h3>
                                <p className="text-sm text-slate-400">Camera Off</p>
                            </div>
                            
                            {/* Audio Indicator */}
                            <div className="absolute top-4 right-4 bg-black/40 p-2 rounded-full backdrop-blur-md">
                                <MicIcon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <UserIcon className="w-10 h-10 opacity-50" />
                            </div>
                            <p className="text-lg font-medium">Waiting for others to join...</p>
                            <p className="text-sm">The session will start shortly.</p>
                        </div>
                    )}

                    {/* Local User View (PiP) */}
                    <div className="absolute bottom-4 right-4 w-48 aspect-video bg-black rounded-lg overflow-hidden border-2 border-slate-700 shadow-2xl transition-all hover:scale-105 z-20 group">
                        {permissionError ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-2 text-center">
                                <VideoOffIcon className="w-8 h-8 mb-2 text-red-500" />
                                <p className="text-[10px] leading-tight mb-2 font-medium">Camera blocked</p>
                                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 py-0 border-slate-600 hover:bg-slate-700 hover:text-white" onClick={handleRetryMedia}>
                                    <RefreshCwIcon className="w-3 h-3 mr-1" /> Retry
                                </Button>
                            </div>
                        ) : (
                            <>
                                <video 
                                    ref={localVideoRef} 
                                    autoPlay 
                                    muted 
                                    playsInline 
                                    className={cn("w-full h-full object-cover transform scale-x-[-1]", !isCamOn && "hidden")} 
                                />
                                {!isCamOn && (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-1">
                                            <span className="font-bold text-lg">{user?.name.charAt(0)}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">Camera Off</p>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white flex items-center gap-1">
                                    You
                                    {!isMicOn && <MicOffIcon className="w-3 h-3 text-red-500" />}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 px-4 shadow-lg z-30">
                    <ControlButton 
                        isActive={isMicOn} 
                        onClick={toggleMic} 
                        icon={isMicOn ? <MicIcon /> : <MicOffIcon />} 
                        label={isMicOn ? 'Mute' : 'Unmute'}
                        variant={isMicOn ? 'default' : 'danger'}
                        disabled={permissionError}
                    />
                    <ControlButton 
                        isActive={isCamOn} 
                        onClick={toggleCam} 
                        icon={isCamOn ? <VideoIcon /> : <VideoOffIcon />} 
                        label={isCamOn ? 'Stop Video' : 'Start Video'}
                        variant={isCamOn ? 'default' : 'danger'}
                        disabled={permissionError}
                    />
                    <ControlButton 
                        isActive={isScreenSharing} 
                        onClick={() => setIsScreenSharing(!isScreenSharing)} 
                        icon={<MonitorIcon />} 
                        label="Share"
                        activeColor="text-green-400 bg-green-400/10 border-green-400/20"
                    />
                    <div className="w-px h-8 bg-slate-700 mx-2" />
                    <ControlButton 
                        isActive={chatOpen} 
                        onClick={() => setChatOpen(!chatOpen)} 
                        icon={<MessageSquareIcon />} 
                        label="Chat"
                        activeColor="text-indigo-400 bg-indigo-400/10 border-indigo-400/20"
                    />
                    <Button variant="destructive" onClick={handleLeave} className="rounded-full px-6 ml-4 bg-red-600 hover:bg-red-700 border-0">
                        <PhoneMissedIcon className="w-5 h-5 mr-2" /> Leave
                    </Button>
                </div>
            </div>

            {/* Chat Sidebar */}
            <div className={cn(
                "bg-slate-900 border-l border-slate-800 flex flex-col transition-all duration-300 ease-in-out",
                chatOpen ? "w-80 translate-x-0" : "w-0 translate-x-full opacity-0"
            )}>
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                    <h3 className="font-semibold text-white">Session Chat</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {session.type === 'group' ? 'Group Chat' : 'Direct Message'}
                    </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300", msg.isSystem ? "items-center" : msg.sender === user?.name ? "items-end" : "items-start")}>
                            {!msg.isSystem && (
                                <span className="text-[10px] text-slate-400 mb-1 px-1">
                                    {msg.sender === user?.name ? 'You' : msg.sender}
                                </span>
                            )}
                            <div className={cn(
                                "px-3 py-2 rounded-lg max-w-[85%] text-sm shadow-sm",
                                msg.sender === user?.name 
                                    ? "bg-indigo-600 text-white rounded-tr-none" 
                                    : msg.isSystem 
                                        ? "bg-slate-800/50 text-slate-400 italic text-center w-full text-xs py-1 border border-slate-800"
                                        : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                            )}>
                                {msg.text}
                            </div>
                            {!msg.isSystem && (
                                <span className="text-[10px] text-slate-600 mt-1 px-1">
                                    {formatTime(msg.timestamp)}
                                </span>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex gap-2">
                        <Input 
                            value={newMessage} 
                            onChange={e => setNewMessage(e.target.value)} 
                            placeholder="Type a message..." 
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                        />
                        <Button type="submit" size="icon" className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={!newMessage.trim()}>
                            <SendIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ControlButton: React.FC<{ 
    isActive: boolean; 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string; 
    activeColor?: string;
    variant?: 'default' | 'danger';
    disabled?: boolean;
}> = ({ isActive, onClick, icon, label, activeColor, variant = 'default', disabled }) => {
    
    let buttonClass = "bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700";
    
    if (disabled) {
        buttonClass = "bg-slate-800/50 text-slate-600 border border-transparent cursor-not-allowed";
    } else if (isActive) {
        if (activeColor) {
            buttonClass = activeColor;
        } else if (variant === 'default') {
            buttonClass = "bg-white text-slate-900 hover:bg-slate-200";
        } else if (variant === 'danger') {
             buttonClass = "bg-white text-slate-900 hover:bg-slate-200";
        }
    } else {
        if (variant === 'danger') {
             buttonClass = "bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30";
        }
    }

    return (
        <div className="flex flex-col items-center gap-1.5">
            <button
                onClick={onClick}
                disabled={disabled}
                className={cn(
                    "p-3 rounded-full transition-all duration-200",
                    buttonClass
                )}
            >
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
            </button>
            <span className={cn("text-[10px] font-medium", disabled ? "text-slate-600" : "text-slate-400")}>{label}</span>
        </div>
    );
};

export default TutoringRoom;