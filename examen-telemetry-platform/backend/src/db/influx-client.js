/**
 * InfluxDB Client for Time-Series Telemetry Data
 * Stores: measurement=telemetry, field=value, timestamp
 */

const { InfluxDB, Point } = require('@influxdata/influxdb-client');

class InfluxClient {
    constructor(config) {
        this.config = {
            url: config.url || 'http://localhost:8086',
            token: config.token || '',
            org: config.org || 'telemetry-org',
            bucket: config.bucket || 'telemetry-bucket',
        };
        this.client = null;
        this.writeApi = null;
        this.queryApi = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            this.client = new InfluxDB({
                url: this.config.url,
                token: this.config.token,
            });

            this.writeApi = this.client.getWriteApi(
                this.config.org,
                this.config.bucket,
                'ns',
            );

            this.queryApi = this.client.getQueryApi(this.config.org);

            // Test connection by attempting a simple query
            await this.testConnection();

            this.isConnected = true;
            console.log(
                `✓ InfluxDB connected: ${this.config.url} (org: ${this.config.org})`,
            );
        } catch (err) {
            console.error('InfluxDB connection failed:', err.message);
            this.isConnected = false;
            throw err;
        }
    }

    async testConnection() {
        // Simple query to verify connection
        const query = `from(bucket: "${this.config.bucket}") |> range(start: -1m) |> limit(n: 1)`;
        const result = await this.queryApi.collectRows(query);
        // If we get here without error, connection is good
        return true;
    }

    async saveMetric(data) {
        const point = new Point('telemetry')
            .tag('source', data.source || 'unknown')
            .floatField('value', data.value || Math.random() * 100)
            .timestamp(new Date());

        this.writeApi.writePoint(point);
        await this.writeApi.flush();

        return {
            measurement: 'telemetry',
            source: data.source,
            value: data.value,
            timestamp: new Date().toISOString(),
        };
    }

    async getRecentMetrics(limit = 50) {
        const query = `
            from(bucket: "${this.config.bucket}")
                |> range(start: -24h)
                |> filter(fn: (r) => r._measurement == "telemetry")
                |> sort(columns: ["_time"], desc: true)
                |> limit(n: ${limit})
        `;

        try {
            const rows = await this.queryApi.collectRows(query);
            return rows.map((row) => ({
                source: row.source || 'unknown',
                value: row._value,
                timestamp: row._time,
            }));
        } catch (err) {
            console.error('Query error:', err.message);
            return [];
        }
    }

    async getStats() {
        const query = `
            from(bucket: "${this.config.bucket}")
                |> range(start: -24h)
                |> filter(fn: (r) => r._measurement == "telemetry")
                |> count()
        `;

        try {
            const rows = await this.queryApi.collectRows(query);
            const count = rows.length > 0 ? rows[0]._value : 0;
            return { metricsLast24h: count };
        } catch (err) {
            return { metricsLast24h: 0 };
        }
    }

    async healthCheck() {
        try {
            await this.testConnection();
            return true;
        } catch (err) {
            return false;
        }
    }

    async disconnect() {
        if (this.writeApi) {
            await this.writeApi.close();
        }
        this.isConnected = false;
    }
}

module.exports = InfluxClient;
