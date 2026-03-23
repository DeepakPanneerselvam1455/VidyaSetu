import React, { useState, useEffect, useRef } from 'react';
import { DirectMessage } from '../types';
import * as api from '../lib/api';
import { SendIcon } from './ui/Icons';
import { Button } from './ui/Button';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    currentUserName: string;
    recipientId: string;
    recipientName: string;
}

const ChatModal: React.FC<ChatModalProps> = ({
    isOpen,
    onClose,
    currentUserId,
    currentUserName,
    recipientId,
    recipientName
}) => {
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            const data = await api.getMessages(currentUserId, recipientId);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch initial messages & subscribe to realtime when modal opens
    useEffect(() => {
        if (!isOpen || !currentUserId || !recipientId) return;

        setIsLoading(true);
        setMessages([]);
        fetchMessages();

        // Subscribe to realtime new messages
        const unsubscribe = api.subscribeToDirectMessages(
            currentUserId,
            recipientId,
            (incomingMsg) => {
                setMessages(prev => {
                    // Avoid duplicates (optimistic updates vs realtime)
                    if (prev.some(m => m.id === incomingMsg.id)) return prev;
                    return [...prev, incomingMsg];
                });
            }
        );

        // Focus input
        const timer = setTimeout(() => inputRef.current?.focus(), 100);

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [isOpen, currentUserId, recipientId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        const text = newMessage.trim();
        if (!text || isSending || currentUserId === recipientId) return;

        setIsSending(true);
        // Optimistic update — add immediately to UI
        const optimisticMsg: DirectMessage = {
            id: `optimistic-${Date.now()}`,
            senderId: currentUserId,
            receiverId: recipientId,
            message: text,
            createdAt: new Date().toISOString(),
            read: false,
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');

        try {
            const sent = await api.sendMessage(currentUserId, recipientId, text);
            // Replace the optimistic entry with the confirmed server response
            setMessages(prev =>
                prev.map(m => m.id === optimisticMsg.id ? sent : m)
            );
        } catch (error) {
            console.error('Failed to send message:', error);
            // Rollback optimistic update on failure
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setNewMessage(text); // Restore text so user can retry
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    };

    const handleSendForm = (e: React.FormEvent) => {
        e.preventDefault();
        handleSend();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
            ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg m-4 rounded-xl border overflow-hidden flex flex-col"
                style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-main)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    height: 'min(600px, 80vh)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4 border-b shrink-0"
                    style={{ borderColor: 'var(--border-default)' }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
                            style={{
                                backgroundColor: 'var(--primary)',
                                color: 'var(--primary-foreground)'
                            }}
                        >
                            {recipientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-base" style={{ color: 'var(--text-main)' }}>
                                {recipientName}
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="w-2 h-2 rounded-full bg-green-500"
                                    title="Connected via Realtime"
                                />
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    Direct Message
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md transition-colors hover:opacity-80"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Messages Area */}
                <div
                    className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
                    style={{ minHeight: 0 }}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'var(--surface-nested, rgba(128,128,128,0.1))' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                                No messages yet
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                Start the conversation with {recipientName}.
                            </p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => {
                                const isMine = msg.senderId === currentUserId;
                                const isOptimistic = msg.id.startsWith('optimistic-');
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className="max-w-[75%] rounded-xl px-3.5 py-2.5 transition-opacity"
                                            style={{
                                                backgroundColor: isMine
                                                    ? 'var(--primary)'
                                                    : 'var(--surface-nested, rgba(128,128,128,0.12))',
                                                color: isMine
                                                    ? 'var(--primary-foreground)'
                                                    : 'var(--text-main)',
                                                borderRadius: isMine
                                                    ? '16px 16px 4px 16px'
                                                    : '16px 16px 16px 4px',
                                                opacity: isOptimistic ? 0.7 : 1,
                                            }}
                                        >
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                {msg.message}
                                            </p>
                                            <p
                                                className="text-[10px] mt-1 text-right"
                                                style={{
                                                    opacity: 0.7,
                                                    color: isMine ? 'var(--primary-foreground)' : 'var(--text-secondary)'
                                                }}
                                            >
                                                {isOptimistic ? 'Sending...' : formatTime(msg.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <form
                    onSubmit={handleSendForm}
                    className="shrink-0 px-4 py-3 border-t flex items-center gap-2"
                    style={{ borderColor: 'var(--border-default)' }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${recipientName}...`}
                        className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-50"
                        style={{
                            color: 'var(--text-main)',
                            backgroundColor: 'var(--surface-nested, rgba(128,128,128,0.08))',
                            border: '1px solid var(--border-default)',
                            borderRadius: '10px',
                            padding: '10px 14px'
                        }}
                        disabled={isSending}
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="shrink-0 rounded-lg"
                        style={{
                            width: '40px',
                            height: '40px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <SendIcon className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ChatModal;
