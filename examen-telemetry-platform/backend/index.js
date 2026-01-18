/**
 * Distributed Telemetry Archival Platform - Backend API
 *
 * A demonstration application for DevOps exercises.
 * Simulates an enterprise telemetry collection and storage system.
 *
 * Storage Modes:
 * - memory: In-memory storage (default)
 * - telemetry: PostgreSQL (metadata) + InfluxDB (time-series)
 *
 * Environment Variables:
 * - STORAGE_MODE: 'memory' | 'telemetry'
 * - POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, POSTGRES_PWD
 * - INFLUX_URL, INFLUX_TOKEN, INFLUX_ORG, INFLUX_BUCKET
 */

const express = require('express');
const cors = require('cors');
const loadConfig = require('./src/utils/config');
const TelemetryStorage = require('./src/services/telemetry-service');
const createTelemetryRoutes = require('./src/routes/telemetry');

// Load configuration
const config = loadConfig();

// Create Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Initialize telemetry storage
const telemetryService = new TelemetryStorage(config.storageMode, config);

// Mount API routes under /api
app.use('/api', createTelemetryRoutes(telemetryService));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        storageMode: config.storageMode,
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'Distributed Telemetry Archival Platform',
        version: '1.0.0',
        storageMode: config.storageMode,
        endpoints: {
            health: '/health',
            telemetry: {
                post: '/api/telemetry',
                get: '/api/telemetry',
                verify: '/api/verify',
                stats: '/api/stats',
            },
        },
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
});

// Start server
async function start() {
    try {
        console.log('═══════════════════════════════════════════════════');
        console.log('  Distributed Telemetry Archival Platform');
        console.log('═══════════════════════════════════════════════════');
        console.log(`Storage Mode: ${config.storageMode}`);
        console.log('');

        // Connect to storage backend
        await telemetryService.connect();

        console.log('');

        // Start HTTP server
        app.listen(config.port, () => {
            console.log(
                `✓ API Server listening on http://localhost:${config.port}`,
            );
            console.log('');
            console.log('API Endpoints:');
            console.log(`  POST /api/telemetry    - Submit telemetry event`);
            console.log(`  GET  /api/telemetry    - Get recent telemetry`);
            console.log(`  GET  /api/verify       - Verify storage backend`);
            console.log(`  GET  /api/stats        - Get statistics`);
            console.log('');
            console.log('═══════════════════════════════════════════════════');
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

// Graceful shutdown
async function shutdown() {
    console.log('\nShutting down gracefully...');
    await telemetryService.disconnect();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the application
start();
