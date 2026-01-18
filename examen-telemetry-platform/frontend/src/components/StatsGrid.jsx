import React from 'react';
import { BarChart3, TrendingUp, Clock, Database } from 'lucide-react';

export default function StatsGrid({ stats, telemetryCount }) {
    const statCards = [
        {
            title: 'Total Events',
            value:
                stats?.totalRecords || stats?.totalCount || telemetryCount || 0,
            icon: BarChart3,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Storage Mode',
            value: stats?.mode === 'telemetry' ? 'Distributed' : 'In-Memory',
            icon: Database,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Last 24h Metrics',
            value: stats?.metricsLast24h || 'N/A',
            icon: TrendingUp,
            color: 'bg-purple-500',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Status',
            value: 'Active',
            icon: Clock,
            color: 'bg-orange-500',
            bgColor: 'bg-orange-50',
        },
    ];

    return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {statCards.map((stat, index) => (
                <div
                    key={index}
                    className='bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow'
                >
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-medium text-slate-600 mb-1'>
                                {stat.title}
                            </p>
                            <p className='text-2xl font-bold text-slate-800'>
                                {stat.value}
                            </p>
                        </div>
                        <div className={`${stat.bgColor} p-3 rounded-lg`}>
                            <stat.icon
                                className={`w-6 h-6 text-${stat.color.replace('bg-', '')}`}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
