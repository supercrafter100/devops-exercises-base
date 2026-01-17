/**
 * Simple URL Shortener Backend (Express + Redis)
 *
 * Rules:
 * - All routes live under /api
 * - STORAGE env decides backend: memory | redis
 * - When redis, uses REDIS_HOST and REDIS_PORT
 * - Stores pairs: shortCode -> originalUrl
 * - Designed for DevOps students: small, readable, and containerizable later
 */

const express = require('express');
const { createClient } = require('redis');

const PORT = 4000; // Backend runs on port 4000

// Read environment variables
const STORAGE = (process.env.STORAGE || 'memory').toLowerCase();
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);

// Create Express app
const app = express();
app.use(express.json()); // Parse JSON bodies

// Create an API router so all endpoints are under /api
const api = express.Router();

/**
 * Storage layer abstraction.
 * Exposes two async functions: get(shortCode) and set(shortCode, url).
 * Also exposes type() returning 'memory' | 'redis' for /api/verify.
 */
function createStorage() {
    if (STORAGE === 'redis') {
        // Redis storage using the official redis npm package (v4)
        const client = createClient({
            socket: { host: REDIS_HOST, port: REDIS_PORT },
        });

        return {
            type: () => 'redis',
            // Connect once before starting the server
            connect: async () => {
                await client.connect();
            },
            get: async (code) => {
                return client.get(code);
            },
            set: async (code, url) => {
                // Use simple key-value, no expiration for this exercise
                await client.set(code, url);
            },
            close: async () => {
                try {
                    await client.quit();
                } catch (e) {}
            },
        };
    }

    // Default: in-memory storage via JavaScript Map
    const map = new Map();
    return {
        type: () => 'memory',
        connect: async () => {},
        get: async (code) => map.get(code) || null,
        set: async (code, url) => {
            map.set(code, url);
        },
        close: async () => {},
    };
}

const storage = createStorage();

/**
 * Generate a short code consisting of 6 base62 characters.
 * This is intentionally simple and deterministic enough for teaching purposes.
 */
function generateShortCode(length = 6) {
    const alphabet =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < length; i++) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
}

/**
 * Try generating a unique short code by checking storage for collisions.
 * We attempt a small number of times to keep the logic simple.
 */
async function createUniqueCode() {
    const MAX_ATTEMPTS = 5;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const code = generateShortCode(6);
        const existing = await storage.get(code);
        if (!existing) return code;
    }
    // Fallback: just return a code (collision chance is extremely low)
    return generateShortCode(8);
}

/**
 * POST /api/shorten
 * Body: { url: "https://example.com" }
 * Response: { shortCode: "abc123" }
 */
api.post('/shorten', async (req, res) => {
    const url = req.body && req.body.url ? String(req.body.url) : '';

    // Minimal sanity check without external validation libraries
    if (!url || !/^https?:\/\//i.test(url)) {
        return res.status(400).json({
            error: 'Please provide a valid http(s) URL in { "url": "..." }',
        });
    }

    try {
        const code = await createUniqueCode();
        await storage.set(code, url);
        return res.json({ shortCode: code });
    } catch (err) {
        console.error('Error creating short URL:', err);
        return res.status(500).json({ error: 'Failed to shorten URL' });
    }
});

/**
 * GET /api/verify
 * Returns which storage backend is in use
 * Example: { "storage": "memory" } or { "storage": "redis" }
 * NOTE: Must be defined BEFORE /:shortCode so it matches first
 */
api.get('/verify', (req, res) => {
    return res.json({ storage: storage.type() });
});

/**
 * GET /api/:shortCode
 * Redirects client to the original URL
 */
api.get('/:shortCode', async (req, res) => {
    const code = req.params.shortCode;
    try {
        const originalUrl = await storage.get(code);
        if (!originalUrl) {
            return res.status(404).json({ error: 'Short code not found' });
        }
        // Redirect to the original URL
        return res.redirect(originalUrl);
    } catch (err) {
        console.error('Error during redirect:', err);
        return res.status(500).json({ error: 'Failed to lookup short code' });
    }
});

// Mount API router
app.use('/api', api);

/**
 * Start the server after storage is ready (e.g., connect to Redis if needed)
 */
async function start() {
    try {
        await storage.connect();
        app.listen(PORT, () => {
            console.log(
                `URL Shortener API listening on http://localhost:${PORT}`,
            );
            console.log(`Storage backend: ${storage.type()}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

// Graceful shutdown for completeness
process.on('SIGINT', async () => {
    await storage.close();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await storage.close();
    process.exit(0);
});

start();
