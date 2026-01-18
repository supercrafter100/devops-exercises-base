/**
 * API Service
 * Handles all communication with the backend API
 */

import axios from 'axios';

const API_BASE_URL = '/api';

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Submit telemetry event
     */
    async submitTelemetry(data) {
        const response = await this.client.post('/telemetry', data);
        return response.data;
    }

    /**
     * Get recent telemetry entries
     */
    async getTelemetry(limit = 50) {
        const response = await this.client.get('/telemetry', {
            params: { limit },
        });
        return response.data;
    }

    /**
     * Verify storage backend
     */
    async verify() {
        const response = await this.client.get('/verify');
        return response.data;
    }

    /**
     * Get statistics
     */
    async getStats() {
        const response = await this.client.get('/stats');
        return response.data;
    }
}

export default new ApiService();
