/**
 * PostgreSQL Client for Telemetry Metadata
 * Stores: source, message, created_at
 */

const { Pool } = require('pg');

class PostgresClient {
    constructor(config) {
        this.config = {
            host: config.host || 'localhost',
            database: config.database || 'telemetry',
            user: config.user || 'postgres',
            password: config.password || 'postgres',
            port: config.port || 5432,
        };
        this.pool = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            this.pool = new Pool(this.config);

            // Test connection
            await this.pool.query('SELECT NOW()');

            // Create table if not exists
            await this.createTable();

            this.isConnected = true;
            console.log(
                `✓ PostgreSQL connected: ${this.config.host}:${this.config.port}/${this.config.database}`,
            );
        } catch (err) {
            console.error('PostgreSQL connection failed:', err.message);
            this.isConnected = false;
            throw err;
        }
    }

    async createTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS telemetry_metadata (
                id SERIAL PRIMARY KEY,
                source VARCHAR(255) NOT NULL,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await this.pool.query(query);
    }

    async saveMetadata(data) {
        const query = `
            INSERT INTO telemetry_metadata (source, message, created_at)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const values = [
            data.source || 'unknown',
            data.message || '',
            new Date(),
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async getRecentMetadata(limit = 50) {
        const query = `
            SELECT * FROM telemetry_metadata
            ORDER BY created_at DESC
            LIMIT $1
        `;
        const result = await this.pool.query(query, [limit]);
        return result.rows;
    }

    async getStats() {
        const query = 'SELECT COUNT(*) as count FROM telemetry_metadata';
        const result = await this.pool.query(query);
        return {
            totalRecords: parseInt(result.rows[0].count, 10),
        };
    }

    async healthCheck() {
        try {
            await this.pool.query('SELECT 1');
            return true;
        } catch (err) {
            return false;
        }
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
        }
    }
}

module.exports = PostgresClient;
