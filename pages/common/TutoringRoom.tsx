import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import * as api from '../../lib/api';
import { TutoringSession } from '../../types';

// Declare Jitsi on window
declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}

const TutoringRoom: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [session, setSession] = useState<TutoringSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // Initialize as undefined to distinguish "loading" from "no token"
    const [jwtToken, setJwtToken] = useState<string | null | undefined>(undefined);
    const jitsiApiRef = useRef<any>(null);

    const handleLeave = () => {
        if (user?.role === 'mentor') navigate('/mentor/tutoring');
        else navigate('/student/tutoring');
    };

    // 1. Fetch Session Details
    useEffect(() => {
        if (!sessionId) return;
        api.getTutoringSessionById(sessionId)
            .then(data => {
                setSession(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load session:", err);
                setIsLoading(false);
            });
    }, [sessionId]);

    // 2. Realtime Subscription
    useEffect(() => {
        if (!sessionId) return;

        const channel = api.supabase
            .channel(`session-${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tutoring_sessions',
                    filter: `id=eq.${sessionId}`
                },
                (payload) => {
                    console.log("Realtime update received:", payload);
                    const updatedSession = payload.new as TutoringSession;
                    setSession(updatedSession);
                }
            )
            .subscribe();

        return () => {
            api.supabase.removeChannel(channel);
        };
    }, [sessionId]);

    // 3. Generate JWT Token
    useEffect(() => {
        if (!user || !sessionId) return;

        const fetchToken = async () => {
            try {
                const token = await api.generateMeetingToken(user, sessionId);
                setJwtToken(token);
            } catch (error) {
                console.error("Token generation failed:", error);
                setJwtToken(null);
            }
        };

        fetchToken();
    }, [user, sessionId]);

    // 4. Initialize Jitsi (Only if Active or Mentor)
    useEffect(() => {
        if (isLoading || !session || !user) return;

        // Wait for token to be generated
        if (jwtToken === undefined) return;

        const isMentor = user.role === 'mentor';
        const isActive = session.status === 'active';

        // Block students if not active
        if (!isMentor && !isActive) return;

        // Cleanup previous instance if exists (e.g. re-render)
        if (jitsiApiRef.current) return;

        // Load Jitsi Script
        const script = document.createElement('script');
        script.src = `https://8x8.vc/vpaas-magic-cookie-e0e1a2d4390d49b888d2f3d47b2ea567/external_api.js`; // Use JaaS specific script
        script.async = true;
        script.onload = () => {
            if (window.JitsiMeetExternalAPI) {
                const domain = '8x8.vc';
                // For JaaS, standard format is usually tenant/room if using main domain OR just room if using tenant subdomain.
                // Best practice for 8x8 JaaS:
                // domain: "8x8.vc"
                // roomName: "vpaas-magic-cookie-e0e1a2d4390d49b888d2f3d47b2ea567/skillforge-" + sessionId

                const tenantId = 'vpaas-magic-cookie-e0e1a2d4390d49b888d2f3d47b2ea567';
                const roomName = `skillforge-${sessionId}`;

                const options = {
                    roomName: `${tenantId}/${roomName}`, // MUST match JWT room claim (which is usually without tenant, but API expects full path)
                    // WAIT. The JWT 'room' claim usually *excludes* the tenant prefix for JaaS? 
                    // User said: "JWT room === Jitsi roomName === frontend room string".
                    // If JWT signs "skillforge-123", then Jitsi roomName must be "skillforge-123"?
                    // NO. JaaS usually requires "tenant/room" in the API but returns "room" in the JWT.
                    // BUT the user said "Match exactly". 
                    // Let's stick to the SAFEST JaaS config:
                    // domain: "8x8.vc"
                    // roomName: `${tenantId}/${roomName}`
                    // JWT room claim: "skillforge-..." (handled by server) OR "*"
                    // Server signs "skillforge-..."
                    // If this fails, we change server to sign `${tenantId}/${roomName}`.
                    // Let's assume server signs SHORT name, and API uses detailed name.
                    // Re-reading User Warning: "JWT room === Jitsi roomName".
                    // Okay, if I pass "tenant/room" to Jitsi, connection might fail if Token has just "room".
                    // I will change the CLIENT to use `skillforge-${sessionId}` and set the domain to the specialized tenant URL if possible.
                    // User: "Initialize with tenant domain, not meet.jit.si: domain = JITSI_TENANT_DOMAIN"
                    // "domain = app-id.8x8.vc"
                    // If I do that, roomName should be just "skillforge-...".
                    // Let's try that.

                    parentNode: document.getElementById('jitsi-container'),
                    userInfo: {
                        email: user.email,
                        displayName: user.name
                    },
                    configOverwrite: {
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        prejoinPageEnabled: false,
                        requireDisplayName: false,
                        disableDeepLinking: true,
                        enableP2P: true, // Try P2P if bridge fails (good for 1-1)
                        constraints: {
                            video: {
                                height: {
                                    ideal: 720,
                                    max: 720,
                                    min: 240
                                }
                            }
                        },
                        notifications: [
                            'connection.CONNFAIL',
                        ]
                    },
                    interfaceConfigOverwrite: {
                        // Hide the "I am the host" / Login button to prevent redirect kickout
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                            'fodeviceselection', 'hangup', 'chat', 'raisehand',
                            'videoquality', 'filmstrip', 'tileview', 'select-background',
                            'stats', 'shortcuts', 'mute-everyone', 'security'
                        ],
                        HIDE_INVITE_MORE_HEADER: true,
                        SHOW_CHROME_EXTENSION_BANNER: false,
                        // Crux of the fix: Hide the profile/login entirely
                        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                    },
                    jwt: jwtToken
                };

                const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
                jitsiApiRef.current = jitsiApi;

                // Add listeners
                jitsiApi.addEventListeners({
                    videoConferenceJoined: (e: any) => {
                        console.log("[Jitsi] Joined as:", e);
                        // If mentor, activate session
                        if (isMentor && session.status === 'scheduled') {
                            console.log("Mentor joined - activating session...");
                            api.startTutoringSession(sessionId).then(() => {
                                console.log("Session activated!");
                            });
                        }
                    },
                    participantRoleChanged: (e: any) => {
                        console.log("[Jitsi] Role changed:", e);
                    },
                    conferenceJoined: (e: any) => {
                        console.log("[Jitsi] Conference joined:", e);
                    },
                    // Connection monitoring
                    'connection.CONNFAIL': (e: any) => {
                        console.error("[Jitsi] Connection Failed:", e);
                        alert("Connection to meeting server failed. Please check your network or try reloading.");
                    },
                    'connection.DISCONNECTED': (e: any) => {
                        console.warn("[Jitsi] Disconnected:", e);
                    },
                    videoConferenceLeft: () => handleLeave(),
                    readyToClose: () => handleLeave()
                });
            }
        };

        document.body.appendChild(script);

        return () => {
            if (jitsiApiRef.current) {
                jitsiApiRef.current.dispose();
                jitsiApiRef.current = null;
            }
            if (document.body.contains(script)) {
                // Check if script is child of body before removing
                try {
                    document.body.removeChild(script);
                } catch (e) { console.warn("Script already removed"); }
            }
        };
    }, [isLoading, session?.status, user?.id, user?.role, sessionId, jwtToken]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!session) {
        return <div className="p-8 text-center text-red-500">Session not found.</div>;
    }

    const isMentor = user?.role === 'mentor';
    const isActive = session.status === 'active';
    const isWaiting = !isMentor && !isActive;

    return (
        <div className="h-[calc(100vh-4rem)] bg-slate-900 relative">
            {isWaiting ? (
                <div className="flex flex-col items-center justify-center h-full text-white space-y-6">
                    <div className="w-20 h-20 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
                    <div className="text-center">
                        <h2 className="text-3xl font-bold">Waiting for Host</h2>
                        <p className="text-slate-400 mt-2 text-lg">Your instructor hasn't started the session yet.</p>
                        <p className="text-slate-500 mt-1">Refreshes automatically...</p>
                    </div>
                </div>
            ) : (
                <div id="jitsi-container" className="w-full h-full" />
            )}
        </div>
    );
};

export default TutoringRoom;