-- PostgreSQL Initialization Script
-- Database: telemetry
-- 
-- This script creates the necessary table for the telemetry platform
-- Run this script if you want to manually set up the database

-- Create database (run this as postgres superuser)
-- CREATE DATABASE telemetry;

-- Connect to the telemetry database
-- \c telemetry;

-- Create telemetry_metadata table
CREATE TABLE IF NOT EXISTS telemetry_metadata (
    id SERIAL PRIMARY KEY,
    source VARCHAR(255) NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_telemetry_source ON telemetry_metadata(source);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON telemetry_metadata(created_at DESC);

-- Insert some sample data (optional)
INSERT INTO telemetry_metadata (source, message, created_at) VALUES
    ('server-01', 'System started successfully', NOW() - INTERVAL '1 hour'),
    ('server-02', 'High CPU usage detected', NOW() - INTERVAL '45 minutes'),
    ('app-backend', 'Database connection established', NOW() - INTERVAL '30 minutes'),
    ('sensor-3', 'Temperature reading: 23.5°C', NOW() - INTERVAL '15 minutes'),
    ('api-gateway', 'Request rate: 150 req/s', NOW() - INTERVAL '5 minutes');

-- Verify the table was created
SELECT COUNT(*) as total_records FROM telemetry_metadata;
