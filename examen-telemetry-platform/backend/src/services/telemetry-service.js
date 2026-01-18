/**
 * Telemetry Storage Abstraction Layer
 * Switches between memory and telemetry (Postgres + InfluxDB) modes
 */

const MemoryStorage = require('../db/memory-storage');
const PostgresClient = require('../db/postgres-client');
const InfluxClient = require('../db/influx-client');

class TelemetryStorage {
    constructor(storageMode, config) {
        this.storageMode = storageMode;
        this.config = config;
        this.storage = null;
        this.postgresClient = null;
        this.influxClient = null;
    }

    async connect() {
        if (this.storageMode === 'telemetry') {
            // Initialize both PostgreSQL and InfluxDB
            this.postgresClient = new PostgresClient({
                host: this.config.postgres.host,
                database: this.config.postgres.database,
                user: this.config.postgres.user,
                password: this.config.postgres.password,
            });

            this.influxClient = new InfluxClient({
                url: this.config.influx.url,
                token: this.config.influx.token,
                org: this.config.influx.org,
                bucket: this.config.influx.bucket,
            });

            await this.postgresClient.connect();
            await this.influxClient.connect();

            console.log('✓ Telemetry mode: PostgreSQL + InfluxDB');
        } else {
            // Use in-memory storage
            this.storage = new MemoryStorage();
            await this.storage.connect();
        }
    }

    async saveTelemetry(data) {
        if (this.storageMode === 'telemetry') {
            // Save to both databases
            const metadata = await this.postgresClient.saveMetadata(data);
            const metric = await this.influxClient.saveMetric(data);

            return {
                metadata,
                metric,
                mode: 'telemetry',
            };
        } else {
            return await this.storage.saveTelemetry(data);
        }
    }

    async getTelemetry(limit = 50) {
        if (this.storageMode === 'telemetry') {
            // Get metadata from PostgreSQL
            const metadata = await this.postgresClient.getRecentMetadata(limit);

            return metadata.map((item) => ({
                id: item.id,
                source: item.source,
                message: item.message,
                created_at: item.created_at,
                mode: 'telemetry',
            }));
        } else {
            return await this.storage.getTelemetry(limit);
        }
    }

    async getStats() {
        if (this.storageMode === 'telemetry') {
            const pgStats = await this.postgresClient.getStats();
            const influxStats = await this.influxClient.getStats();

            return {
                ...pgStats,
                ...influxStats,
                mode: 'telemetry',
            };
        } else {
            return await this.storage.getStats();
        }
    }

    async healthCheck() {
        if (this.storageMode === 'telemetry') {
            const postgresOk = await this.postgresClient.healthCheck();
            const influxOk = await this.influxClient.healthCheck();

            return {
                storage: 'telemetry',
                postgres: postgresOk,
                influx: influxOk,
            };
        } else {
            return {
                storage: 'memory',
            };
        }
    }

    async disconnect() {
        if (this.storageMode === 'telemetry') {
            if (this.postgresClient) await this.postgresClient.disconnect();
            if (this.influxClient) await this.influxClient.disconnect();
        } else if (this.storage) {
            await this.storage.disconnect();
        }
    }
}

module.exports = TelemetryStorage;
