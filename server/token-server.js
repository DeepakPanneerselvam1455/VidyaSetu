
const http = require('http');
const url = require('url');
const path = require('path');
const { SignJWT } = require('jose');
const crypto = require('crypto');

// Correctly load .env from the project root (parent directory of this script)
const result = require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (result.error) {
    console.error("Error loading .env:", result.error);
} else {
    // console.log("Environment variables loaded:", result.parsed); // Optional debug
}

const PORT = process.env.TOKEN_PORT || 3001;
const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

const APP_ID = process.env.JITSI_APP_ID; // "vpaas-magic-cookie-..."
const KEY_ID = process.env.JITSI_KEY_ID; // "vpaas-magic-cookie-.../hex_id"
const PRIVATE_KEY = process.env.JITSI_PRIVATE_KEY; // PEM string

// Helper to format PEM if needed (handles one-line env vars)
const getPrivateKey = () => {
    if (!PRIVATE_KEY) return null;
    return PRIVATE_KEY.replace(/\\n/g, '\n');
};

const server = http.createServer(async (req, res) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, HEADERS);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.pathname === '/api/jitsi-token' && req.method === 'GET') {
        try {
            const { room, name, email, id, role } = parsedUrl.query;

            if (!room || !name || !email || !id) {
                res.writeHead(400, HEADERS);
                res.end(JSON.stringify({ error: 'Missing required fields: room, name, email, id' }));
                return;
            }

            if (!APP_ID || !KEY_ID || !PRIVATE_KEY) {
                console.error("Missing server configuration");
                res.writeHead(500, HEADERS);
                res.end(JSON.stringify({ error: 'Server misconfiguration' }));
                return;
            }

            // ⚠️ SECURITY: Verify moderator status
            // In a real app, validatethe session or check DB. 
            // Here we trust the 'role' param but only if it matches specific criteria if needed.
            // For this specific requested implementation:
            const isModerator = role === 'mentor';

            const now = Math.floor(Date.now() / 1000);
            const exp = now + 7200; // 2 hours
            const nbf = now - 10;

            const payload = {
                aud: "jitsi",
                iss: "chat", // Fixed: must be "chat" for JaaS
                iat: now,
                exp: exp,
                nbf: nbf,
                sub: APP_ID, // Fixed: sub is App ID
                room: room, // Fixed: verify strict room name matching
                context: {
                    features: {
                        livestreaming: true,
                        recording: true,
                        transcription: true,
                        "outbound-call": true
                    },
                    user: {
                        id: id,
                        name: name,
                        email: email,
                        avatar: "",
                        moderator: isModerator
                    }
                }
            };

            // Sign Token
            const pk = crypto.createPrivateKey(getPrivateKey());
            const token = await new SignJWT(payload)
                .setProtectedHeader({ alg: 'RS256', kid: KEY_ID, typ: 'JWT' })
                .sign(pk);

            console.log(`[TokenServer] Generated for ${email} (Mod: ${isModerator}) in ${room}`);

            res.writeHead(200, HEADERS);
            res.end(JSON.stringify({
                token,
                tenant: `${APP_ID}.8x8.vc`,
                room: room
            }));

        } catch (error) {
            console.error("Token generation error:", error);
            res.writeHead(500, HEADERS);
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    } else {
        res.writeHead(404, HEADERS);
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(PORT, () => {
    console.log(`Jitsi Token Server running on http://localhost:${PORT}`);
    console.log(`Configured for App ID: ${APP_ID}`);
});
