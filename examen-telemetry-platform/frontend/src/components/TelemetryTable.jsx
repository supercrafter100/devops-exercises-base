import React from 'react';
import { Calendar, MapPin, MessageSquare, RefreshCw } from 'lucide-react';

export default function TelemetryTable({ data, loading, onRefresh }) {
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch {
            return dateString;
        }
    };

    return (
        <div className='bg-white rounded-xl shadow-md border border-slate-200'>
            <div className='p-6 border-b border-slate-200'>
                <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-slate-800'>
                        Recent Telemetry Events
                    </h3>
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className='flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50'
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                        />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            <div className='overflow-x-auto'>
                {loading && data.length === 0 ? (
                    <div className='p-12 text-center'>
                        <RefreshCw className='w-8 h-8 text-slate-400 animate-spin mx-auto mb-3' />
                        <p className='text-slate-500'>
                            Loading telemetry data...
                        </p>
                    </div>
                ) : data.length === 0 ? (
                    <div className='p-12 text-center'>
                        <MessageSquare className='w-12 h-12 text-slate-300 mx-auto mb-3' />
                        <p className='text-slate-500'>
                            No telemetry events yet
                        </p>
                        <p className='text-sm text-slate-400 mt-1'>
                            Submit an event to get started
                        </p>
                    </div>
                ) : (
                    <table className='w-full'>
                        <thead className='bg-slate-50'>
                            <tr>
                                <th className='px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider'>
                                    ID
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider'>
                                    Source
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider'>
                                    Message
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider'>
                                    Timestamp
                                </th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-200'>
                            {data.map((item, index) => (
                                <tr
                                    key={item.id || index}
                                    className='hover:bg-slate-50 transition-colors'
                                >
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-500'>
                                        {item.id || index + 1}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap'>
                                        <div className='flex items-center space-x-2'>
                                            <MapPin className='w-4 h-4 text-primary-500' />
                                            <span className='text-sm font-medium text-slate-800'>
                                                {item.source}
                                            </span>
                                        </div>
                                    </td>
                                    <td className='px-6 py-4 text-sm text-slate-600'>
                                        <div className='max-w-md truncate'>
                                            {item.message || '-'}
                                        </div>
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-500'>
                                        <div className='flex items-center space-x-2'>
                                            <Calendar className='w-4 h-4' />
                                            <span>
                                                {formatDate(
                                                    item.created_at ||
                                                        item.timestamp,
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {data.length > 0 && (
                <div className='p-4 bg-slate-50 border-t border-slate-200'>
                    <p className='text-sm text-slate-600 text-center'>
                        Showing {data.length} most recent events
                    </p>
                </div>
            )}
        </div>
    );
}
