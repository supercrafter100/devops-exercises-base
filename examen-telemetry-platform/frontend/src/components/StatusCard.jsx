import React from 'react';
import { Database, HardDrive, CheckCircle, XCircle } from 'lucide-react';

export default function StatusCard({ storageInfo }) {
    const isMemory = storageInfo?.storage === 'memory';
    const isTelemetry = storageInfo?.storage === 'telemetry';

    return (
        <div className='bg-white rounded-xl shadow-md p-6 border border-slate-200'>
            <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-slate-800'>
                    Storage Backend
                </h3>
                <Database className='w-6 h-6 text-primary-500' />
            </div>

            <div className='space-y-3'>
                <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
                    <div className='flex items-center space-x-2'>
                        <HardDrive className='w-4 h-4 text-slate-600' />
                        <span className='font-medium text-slate-700'>Mode</span>
                    </div>
                    <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            isTelemetry
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}
                    >
                        {storageInfo?.storage?.toUpperCase() || 'UNKNOWN'}
                    </span>
                </div>

                {isTelemetry && (
                    <>
                        <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
                            <div className='flex items-center space-x-2'>
                                <span className='font-medium text-slate-700'>
                                    PostgreSQL
                                </span>
                            </div>
                            <div className='flex items-center space-x-2'>
                                {storageInfo.postgres ? (
                                    <>
                                        <CheckCircle className='w-5 h-5 text-green-500' />
                                        <span className='text-sm font-medium text-green-600'>
                                            Connected
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className='w-5 h-5 text-red-500' />
                                        <span className='text-sm font-medium text-red-600'>
                                            Disconnected
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
                            <div className='flex items-center space-x-2'>
                                <span className='font-medium text-slate-700'>
                                    InfluxDB
                                </span>
                            </div>
                            <div className='flex items-center space-x-2'>
                                {storageInfo.influx ? (
                                    <>
                                        <CheckCircle className='w-5 h-5 text-green-500' />
                                        <span className='text-sm font-medium text-green-600'>
                                            Connected
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className='w-5 h-5 text-red-500' />
                                        <span className='text-sm font-medium text-red-600'>
                                            Disconnected
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {isMemory && (
                    <div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                        <p className='text-sm text-blue-800'>
                            In-memory storage active. Data will be lost on
                            restart.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
