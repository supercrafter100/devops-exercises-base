import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatusCard from './components/StatusCard';
import StatsGrid from './components/StatsGrid';
import TelemetryForm from './components/TelemetryForm';
import TelemetryTable from './components/TelemetryTable';
import api from './services/api';

function App() {
    const [storageInfo, setStorageInfo] = useState(null);
    const [telemetryData, setTelemetryData] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load initial data
    useEffect(() => {
        loadData();

        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            loadData(true); // silent refresh
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);

        try {
            // Load all data in parallel
            const [verifyResult, telemetryResult, statsResult] =
                await Promise.all([
                    api.verify(),
                    api.getTelemetry(50),
                    api.getStats().catch(() => ({ stats: {} })),
                ]);

            setStorageInfo(verifyResult);
            setTelemetryData(telemetryResult.data || []);
            setStats(telemetryResult.stats || statsResult.stats || {});
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to connect to backend API');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleTelemetrySubmit = () => {
        // Reload data after successful submission
        loadData();
    };

    return (
        <div className='min-h-screen bg-slate-50'>
            <Header />

            <main className='container mx-auto px-6 py-8'>
                {error && (
                    <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
                        <p className='text-red-700'>{error}</p>
                    </div>
                )}

                {/* Stats Grid */}
                <div className='mb-8'>
                    <StatsGrid
                        stats={stats}
                        telemetryCount={telemetryData.length}
                    />
                </div>

                {/* Two Column Layout */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
                    {/* Status Card */}
                    <div className='lg:col-span-1'>
                        <StatusCard storageInfo={storageInfo} />
                    </div>

                    {/* Telemetry Form */}
                    <div className='lg:col-span-2'>
                        <TelemetryForm
                            onSubmitSuccess={handleTelemetrySubmit}
                        />
                    </div>
                </div>

                {/* Telemetry Table */}
                <TelemetryTable
                    data={telemetryData}
                    loading={loading}
                    onRefresh={() => loadData()}
                />
            </main>

            {/* Footer */}
            <footer className='bg-slate-800 text-slate-300 py-6 mt-12'>
                <div className='container mx-auto px-6 text-center'>
                    <p className='text-sm'>
                        Distributed Telemetry Archival Platform v1.0.0
                    </p>
                    <p className='text-xs text-slate-400 mt-2'>
                        Enterprise-grade telemetry collection and analysis
                        system
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;
