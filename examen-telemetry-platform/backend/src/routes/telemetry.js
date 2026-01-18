/**
 * Telemetry API Routes
 * POST /api/telemetry - Submit telemetry data
 * GET /api/telemetry - Get recent telemetry
 * GET /api/verify - Verify storage configuration
 */

const express = require('express');
const router = express.Router();

function createTelemetryRoutes(telemetryService) {
    /**
     * POST /api/telemetry
     * Submit telemetry event
     */
    router.post('/telemetry', async (req, res) => {
        try {
            const { source, message, value } = req.body;

            if (!source) {
                return res.status(400).json({
                    error: 'Missing required field: source',
                });
            }

            const data = {
                source,
                message: message || `Telemetry event from ${source}`,
                value: value !== undefined ? value : Math.random() * 100,
            };

            const result = await telemetryService.saveTelemetry(data);

            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (err) {
            console.error('Error saving telemetry:', err);
            res.status(500).json({
                error: 'Failed to save telemetry data',
                message: err.message,
            });
        }
    });

    /**
     * GET /api/telemetry
     * Get recent telemetry entries
     */
    router.get('/telemetry', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const data = await telemetryService.getTelemetry(limit);
            const stats = await telemetryService.getStats();

            res.json({
                success: true,
                count: data.length,
                stats,
                data,
            });
        } catch (err) {
            console.error('Error retrieving telemetry:', err);
            res.status(500).json({
                error: 'Failed to retrieve telemetry data',
                message: err.message,
            });
        }
    });

    /**
     * GET /api/verify
     * Verify storage backend and connectivity
     * CRITICAL: Used for automatic verification
     */
    router.get('/verify', async (req, res) => {
        try {
            const health = await telemetryService.healthCheck();
            res.json(health);
        } catch (err) {
            console.error('Health check failed:', err);
            res.status(500).json({
                error: 'Health check failed',
                message: err.message,
            });
        }
    });

    /**
     * GET /api/stats
     * Get storage statistics
     */
    router.get('/stats', async (req, res) => {
        try {
            const stats = await telemetryService.getStats();
            res.json({
                success: true,
                stats,
            });
        } catch (err) {
            console.error('Error retrieving stats:', err);
            res.status(500).json({
                error: 'Failed to retrieve stats',
            });
        }
    });

    return router;
}

module.exports = createTelemetryRoutes;
