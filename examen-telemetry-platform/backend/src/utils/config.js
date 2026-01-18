/**
 * Configuration loader
 * Reads environment variables and provides defaults
 */

function loadConfig() {
    const storageMode = (process.env.STORAGE_MODE || 'memory').toLowerCase();

    const config = {
        port: parseInt(process.env.PORT) || 4000,
        storageMode,
        postgres: {
            host: process.env.POSTGRES_HOST || 'localhost',
            database: process.env.POSTGRES_DB || 'telemetry',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PWD || 'postgres',
        },
        influx: {
            url: process.env.INFLUX_URL || 'http://localhost:8086',
            token: process.env.INFLUX_TOKEN || '',
            org: process.env.INFLUX_ORG || 'telemetry-org',
            bucket: process.env.INFLUX_BUCKET || 'telemetry-bucket',
        },
    };

    return config;
}

module.exports = loadConfig;
