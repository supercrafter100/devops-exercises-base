/**
 * In-Memory Storage Implementation
 * Used when STORAGE_MODE is not set or set to 'memory'
 */

class MemoryStorage {
    constructor() {
        this.telemetryData = [];
        this.maxItems = 100; // Keep last 100 items
    }

    async connect() {
        console.log('Using in-memory storage');
    }

    async disconnect() {
        // No-op for memory storage
    }

    async saveTelemetry(data) {
        const entry = {
            id: Date.now() + Math.random(),
            source: data.source || 'unknown',
            message: data.message || '',
            value: data.value || Math.random() * 100,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
        };

        this.telemetryData.unshift(entry);

        // Keep only the most recent items
        if (this.telemetryData.length > this.maxItems) {
            this.telemetryData = this.telemetryData.slice(0, this.maxItems);
        }

        return entry;
    }

    async getTelemetry(limit = 50) {
        return this.telemetryData.slice(0, limit);
    }

    async getStats() {
        return {
            totalCount: this.telemetryData.length,
            storage: 'memory',
        };
    }

    getType() {
        return 'memory';
    }

    async healthCheck() {
        return {
            storage: 'memory',
        };
    }
}

module.exports = MemoryStorage;
